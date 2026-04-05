package sqlite

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type OrderRepository struct {
	db  *sql.DB
	q   *sqlcdb.Queries
	log *logger.AppLogger
}

func NewOrderRepository(db *sql.DB, log *logger.AppLogger) *OrderRepository {
	return &OrderRepository{db: db, q: sqlcdb.New(db), log: log}
}

func (r *OrderRepository) Create(ctx context.Context, order port.Order) (port.Order, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "begin_tx", "table", "orders",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return port.Order{}, &infrastructure.InfraError{Layer: "sqlite", Operation: "begin_tx", Resource: "orders", Cause: err}
	}
	defer tx.Rollback() //nolint:errcheck

	qtx := sqlcdb.New(tx)

	createdOrder, err := qtx.CreateOrder(ctx, sqlcdb.CreateOrderParams{
		ID:          order.ID,
		UserID:      order.UserID,
		TotalAmount: order.TotalAmount,
		Status:      order.Status,
	})
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "create_order", "table", "orders",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return port.Order{}, &infrastructure.InfraError{Layer: "sqlite", Operation: "create_order", Resource: "orders", Cause: err}
	}

	items := make([]port.OrderItem, 0, len(order.Items))
	for _, item := range order.Items {
		createdItem, err := qtx.CreateOrderItem(ctx, sqlcdb.CreateOrderItemParams{
			ID:              uuid.New().String(),
			OrderID:         createdOrder.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			PriceAtPurchase: item.PriceAtPurchase,
		})
		if err != nil {
			r.log.Error("db_error",
				"layer", "sqlite", "operation", "create_order_item", "table", "order_items",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
			)
			return port.Order{}, &infrastructure.InfraError{Layer: "sqlite", Operation: "create_order_item", Resource: "order_items", Cause: err}
		}
		items = append(items, port.OrderItem{
			ID:              createdItem.ID,
			OrderID:         createdItem.OrderID,
			ProductID:       createdItem.ProductID,
			Quantity:        createdItem.Quantity,
			PriceAtPurchase: createdItem.PriceAtPurchase,
		})
	}

	if err := tx.Commit(); err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "commit_tx", "table", "orders",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return port.Order{}, &infrastructure.InfraError{Layer: "sqlite", Operation: "commit_tx", Resource: "orders", Cause: err}
	}

	return port.Order{
		ID:          createdOrder.ID,
		UserID:      createdOrder.UserID,
		TotalAmount: createdOrder.TotalAmount,
		Status:      createdOrder.Status,
		Items:       items,
		CreatedAt:   createdOrder.CreatedAt,
		UpdatedAt:   createdOrder.UpdatedAt,
	}, nil
}

func (r *OrderRepository) GetByIDAndUserID(ctx context.Context, orderID, userID string) (port.Order, error) {
	row, err := r.q.GetOrderByIDAndUserID(ctx, sqlcdb.GetOrderByIDAndUserIDParams{
		ID:     orderID,
		UserID: userID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "get_order_by_id", "table", "orders",
				"constraint", "NOT_FOUND",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return port.Order{}, &NotFoundOrderError{}
		}
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "get_order_by_id", "table", "orders",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return port.Order{}, &infrastructure.InfraError{Layer: "sqlite", Operation: "get_order_by_id", Resource: "orders", Cause: err}
	}

	items, err := r.q.ListOrderItemsByOrderID(ctx, row.ID)
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "list_order_items", "table", "order_items",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return port.Order{}, &infrastructure.InfraError{Layer: "sqlite", Operation: "list_order_items", Resource: "order_items", Cause: err}
	}

	return toPortOrder(row, items), nil
}

func (r *OrderRepository) ListByUserID(ctx context.Context, userID string) ([]port.Order, error) {
	rows, err := r.q.ListOrdersByUserID(ctx, userID)
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "list_orders", "table", "orders",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return nil, &infrastructure.InfraError{Layer: "sqlite", Operation: "list_orders", Resource: "orders", Cause: err}
	}

	orders := make([]port.Order, 0, len(rows))
	for _, row := range rows {
		items, err := r.q.ListOrderItemsByOrderID(ctx, row.ID)
		if err != nil {
			r.log.Error("db_error",
				"layer", "sqlite", "operation", "list_order_items", "table", "order_items",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
			)
			return nil, &infrastructure.InfraError{Layer: "sqlite", Operation: "list_order_items", Resource: "order_items", Cause: err}
		}
		orders = append(orders, toPortOrder(row, items))
	}
	return orders, nil
}

func (r *OrderRepository) UserHasPurchasedProduct(ctx context.Context, userID string, productID int64) (bool, error) {
	count, err := r.q.ExistsOrderItemByUserAndProduct(ctx, sqlcdb.ExistsOrderItemByUserAndProductParams{
		UserID:    userID,
		ProductID: productID,
	})
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "check_purchase", "table", "order_items",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return false, &infrastructure.InfraError{Layer: "sqlite", Operation: "check_purchase", Resource: "order_items", Cause: err}
	}
	return count > 0, nil
}

func toPortOrder(row sqlcdb.Order, items []sqlcdb.OrderItem) port.Order {
	portItems := make([]port.OrderItem, 0, len(items))
	for _, item := range items {
		portItems = append(portItems, port.OrderItem{
			ID:              item.ID,
			OrderID:         item.OrderID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			PriceAtPurchase: item.PriceAtPurchase,
		})
	}
	return port.Order{
		ID:          row.ID,
		UserID:      row.UserID,
		TotalAmount: row.TotalAmount,
		Status:      row.Status,
		Items:       portItems,
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
	}
}

type NotFoundOrderError struct{}

func (e *NotFoundOrderError) Error() string { return "order not found" }
