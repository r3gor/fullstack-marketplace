package application

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
)

type OrderService struct {
	orders      port.OrderRepository
	auditLogger port.AuditLogger
}

func NewOrderService(orders port.OrderRepository, audit port.AuditLogger) *OrderService {
	return &OrderService{orders: orders, auditLogger: audit}
}

func (s *OrderService) CreateOrder(ctx context.Context, userID string, req dto.CreateOrderRequest) (port.Order, error) {
	if len(req.Items) == 0 {
		return port.Order{}, domain.NewValidationError("order must contain at least one item")
	}

	var total float64
	items := make([]port.OrderItem, 0, len(req.Items))

	for i, item := range req.Items {
		if item.Quantity <= 0 {
			return port.Order{}, domain.NewValidationError(fmt.Sprintf("item %d: quantity must be greater than 0", i+1))
		}
		if item.PriceAtPurchase <= 0 {
			return port.Order{}, domain.NewValidationError(fmt.Sprintf("item %d: price must be greater than 0", i+1))
		}
		total += float64(item.Quantity) * item.PriceAtPurchase
		items = append(items, port.OrderItem{
			ProductID:       item.ProductID,
			Quantity:        int64(item.Quantity),
			PriceAtPurchase: item.PriceAtPurchase,
		})
	}

	order := port.Order{
		ID:          uuid.New().String(),
		UserID:      userID,
		TotalAmount: total,
		Status:      "pending",
		Items:       items,
	}

	created, err := s.orders.Create(ctx, order)
	if err != nil {
		return port.Order{}, fmt.Errorf("failed to create order: %w", err)
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "order_created",
		PerformedBy: userID,
		Target:      created.ID,
	})

	return created, nil
}

func (s *OrderService) ListOrders(ctx context.Context, userID string) ([]port.Order, error) {
	return s.orders.ListByUserID(ctx, userID)
}

func (s *OrderService) GetOrder(ctx context.Context, userID, orderID string) (port.Order, error) {
	order, err := s.orders.GetByIDAndUserID(ctx, orderID, userID)
	if err != nil {
		return port.Order{}, err
	}
	return order, nil
}
