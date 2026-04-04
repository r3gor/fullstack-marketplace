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
