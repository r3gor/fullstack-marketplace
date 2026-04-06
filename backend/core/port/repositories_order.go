package port

import (
	"context"
	"time"
)

type Order struct {
	ID          string
	UserID      string
	TotalAmount float64
	Status      string
	Items       []OrderItem
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type OrderItem struct {
	ID              string
	OrderID         string
	ProductID       int64
	Quantity        int64
	PriceAtPurchase float64
}

type OrderRepository interface {
	Create(ctx context.Context, order Order) (Order, error)
	GetByIDAndUserID(ctx context.Context, orderID, userID string) (Order, error)
	ListByUserID(ctx context.Context, userID string) ([]Order, error)
	UserHasPurchasedProduct(ctx context.Context, userID string, productID int64) (bool, error)
}
