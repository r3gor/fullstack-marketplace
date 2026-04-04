package sqlite

import (
	"context"
	"database/sql"
	"strings"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type UserRepository struct {
	q *sqlcdb.Queries
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{q: sqlcdb.New(db)}
}

func (r *UserRepository) Create(ctx context.Context, user domain.User) (domain.User, error) {
	row, err := r.q.CreateUser(ctx, sqlcdb.CreateUserParams{
		ID:           user.ID,
		Name:         user.Name,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
	})
	if err != nil {
		if isUniqueConstraint(err) {
			return domain.User{}, &domain.ConflictError{Message: "email already in use"}
		}
		return domain.User{}, err
	}
	return toDomainUser(row), nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.User{}, &domain.NotFoundError{Resource: "user"}
		}
		return domain.User{}, err
	}
	return toDomainUser(row), nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (domain.User, error) {
	row, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.User{}, &domain.NotFoundError{Resource: "user"}
		}
		return domain.User{}, err
	}
	return toDomainUser(row), nil
}

func (r *UserRepository) Update(ctx context.Context, id, name, email string) (domain.User, error) {
	row, err := r.q.UpdateUser(ctx, sqlcdb.UpdateUserParams{
		ID:    id,
		Name:  name,
		Email: email,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.User{}, &domain.NotFoundError{Resource: "user"}
		}
		if isUniqueConstraint(err) {
			return domain.User{}, &domain.ConflictError{Message: "email already in use"}
		}
		return domain.User{}, err
	}
	return toDomainUser(row), nil
}

func toDomainUser(u sqlcdb.User) domain.User {
	return domain.User{
		ID:           u.ID,
		Name:         u.Name,
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

func isUniqueConstraint(err error) bool {
	return strings.Contains(err.Error(), "UNIQUE constraint failed")
}
