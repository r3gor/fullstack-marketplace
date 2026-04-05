package sqlite

import (
	"context"
	"database/sql"
	"strings"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type UserRepository struct {
	q   *sqlcdb.Queries
	log *logger.AppLogger
}

func NewUserRepository(db *sql.DB, log *logger.AppLogger) *UserRepository {
	return &UserRepository{q: sqlcdb.New(db), log: log}
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
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "create_user", "table", "users",
				"constraint", "UNIQUE", "field", "email",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return domain.User{}, domain.NewConflictError("email already in use")
		}
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "create_user", "table", "users",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.User{}, domain.NewInternalError(err)
	}
	return toDomainUser(row), nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		if err == sql.ErrNoRows {
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "get_user_by_email", "table", "users",
				"constraint", "NOT_FOUND",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return domain.User{}, domain.NewNotFoundError("user")
		}
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "get_user_by_email", "table", "users",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.User{}, domain.NewInternalError(err)
	}
	return toDomainUser(row), nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (domain.User, error) {
	row, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		if err == sql.ErrNoRows {
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "get_user_by_id", "table", "users",
				"constraint", "NOT_FOUND",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return domain.User{}, domain.NewNotFoundError("user")
		}
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "get_user_by_id", "table", "users",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.User{}, domain.NewInternalError(err)
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
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "update_user", "table", "users",
				"constraint", "NOT_FOUND",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return domain.User{}, domain.NewNotFoundError("user")
		}
		if isUniqueConstraint(err) {
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "update_user", "table", "users",
				"constraint", "UNIQUE", "field", "email",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return domain.User{}, domain.NewConflictError("email already in use")
		}
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "update_user", "table", "users",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.User{}, domain.NewInternalError(err)
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

