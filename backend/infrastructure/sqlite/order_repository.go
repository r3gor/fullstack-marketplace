package sqlite

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type OrderRepository struct {
	db *sql.DB
	q  *sqlcdb.Queries
}

func NewOrderRepository(db *sql.DB) *OrderRepository {
	return &OrderRepository{db: db, q: sqlcdb.New(db)}
}

func (r *OrderRepository) Create(ctx context.Context, order port.Order) (port.Order, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return port.Order{}, err
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
		return port.Order{}, err
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
			return port.Order{}, err
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
		return port.Order{}, err
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
			return port.Order{}, &NotFoundOrderError{}
		}
		return port.Order{}, err
	}

	items, err := r.q.ListOrderItemsByOrderID(ctx, row.ID)
	if err != nil {
		return port.Order{}, err
	}

	return toPortOrder(row, items), nil
}

func (r *OrderRepository) ListByUserID(ctx context.Context, userID string) ([]port.Order, error) {
	rows, err := r.q.ListOrdersByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	orders := make([]port.Order, 0, len(rows))
	for _, row := range rows {
		items, err := r.q.ListOrderItemsByOrderID(ctx, row.ID)
		if err != nil {
			return nil, err
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
	return count > 0, err
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
