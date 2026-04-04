package sqlite

import (
	"context"
	"database/sql"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type RefreshTokenRepository struct {
	q *sqlcdb.Queries
}

func NewRefreshTokenRepository(db *sql.DB) *RefreshTokenRepository {
	return &RefreshTokenRepository{q: sqlcdb.New(db)}
}

func (r *RefreshTokenRepository) Create(ctx context.Context, token port.RefreshToken) (port.RefreshToken, error) {
	row, err := r.q.CreateRefreshToken(ctx, sqlcdb.CreateRefreshTokenParams{
		ID:        token.ID,
		UserID:    token.UserID,
		TokenHash: token.TokenHash,
		ExpiresAt: token.ExpiresAt,
	})
	if err != nil {
		return port.RefreshToken{}, err
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
			return port.RefreshToken{}, &NotFoundTokenError{}
		}
		return port.RefreshToken{}, err
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
	return r.q.DeleteRefreshToken(ctx, tokenHash)
}

func (r *RefreshTokenRepository) DeleteByUserID(ctx context.Context, userID string) error {
	return r.q.DeleteUserRefreshTokens(ctx, userID)
}

// NotFoundTokenError signals a missing/expired refresh token.
type NotFoundTokenError struct{}

func (e *NotFoundTokenError) Error() string { return "refresh token not found or expired" }
