package sqlite

import (
	"context"
	"database/sql"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type RefreshTokenRepository struct {
	q   *sqlcdb.Queries
	log *logger.AppLogger
}

func NewRefreshTokenRepository(db *sql.DB, log *logger.AppLogger) *RefreshTokenRepository {
	return &RefreshTokenRepository{q: sqlcdb.New(db), log: log}
}

func (r *RefreshTokenRepository) Create(ctx context.Context, token port.RefreshToken) (port.RefreshToken, error) {
	row, err := r.q.CreateRefreshToken(ctx, sqlcdb.CreateRefreshTokenParams{
		ID:        token.ID,
		UserID:    token.UserID,
		TokenHash: token.TokenHash,
		ExpiresAt: token.ExpiresAt,
	})
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "create_refresh_token", "table", "refresh_tokens",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return port.RefreshToken{}, domain.NewInternalError(err)
	}
	return port.RefreshToken{
		ID:        row.ID,
		UserID:    row.UserID,
		TokenHash: row.TokenHash,
		ExpiresAt: row.ExpiresAt,
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *RefreshTokenRepository) GetByHash(ctx context.Context, tokenHash string) (port.RefreshToken, error) {
	row, err := r.q.GetRefreshToken(ctx, tokenHash)
	if err != nil {
		if err == sql.ErrNoRows {
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "get_refresh_token", "table", "refresh_tokens",
				"constraint", "NOT_FOUND",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return port.RefreshToken{}, domain.NewNotFoundError("refresh_token")
		}
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "get_refresh_token", "table", "refresh_tokens",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return port.RefreshToken{}, domain.NewInternalError(err)
	}
	return port.RefreshToken{
		ID:        row.ID,
		UserID:    row.UserID,
		TokenHash: row.TokenHash,
		ExpiresAt: row.ExpiresAt,
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *RefreshTokenRepository) DeleteByHash(ctx context.Context, tokenHash string) error {
	if err := r.q.DeleteRefreshToken(ctx, tokenHash); err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "delete_refresh_token", "table", "refresh_tokens",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.NewInternalError(err)
	}
	return nil
}

func (r *RefreshTokenRepository) DeleteByUserID(ctx context.Context, userID string) error {
	if err := r.q.DeleteUserRefreshTokens(ctx, userID); err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "delete_user_refresh_tokens", "table", "refresh_tokens",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.NewInternalError(err)
	}
	return nil
}

