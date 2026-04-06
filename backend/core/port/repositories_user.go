package port

import (
	"context"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user domain.User) (domain.User, error)
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	GetByID(ctx context.Context, id string) (domain.User, error)
	Update(ctx context.Context, id, name, email string) (domain.User, error)
}
