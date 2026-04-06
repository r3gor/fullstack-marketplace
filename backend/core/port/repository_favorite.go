package port

import (
	"context"
	"time"
)

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
