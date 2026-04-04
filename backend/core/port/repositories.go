package port

import (
	"context"
	"time"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user domain.User) (domain.User, error)
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	GetByID(ctx context.Context, id string) (domain.User, error)
	Update(ctx context.Context, id, name, email string) (domain.User, error)
}

type RefreshToken struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, token RefreshToken) (RefreshToken, error)
	GetByHash(ctx context.Context, tokenHash string) (RefreshToken, error)
	DeleteByHash(ctx context.Context, tokenHash string) error
	DeleteByUserID(ctx context.Context, userID string) error
}

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

type Favorite struct {
	UserID    string
	ProductID int64
	CreatedAt time.Time
}

type FavoriteRepository interface {
	Add(ctx context.Context, userID string, productID int64) error
	Remove(ctx context.Context, userID string, productID int64) error
	List(ctx context.Context, userID string) ([]Favorite, error)
	IsFavorite(ctx context.Context, userID string, productID int64) (bool, error)
}
