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

type FavoriteRepository struct {
	q   *sqlcdb.Queries
	log *logger.AppLogger
}

func NewFavoriteRepository(db *sql.DB, log *logger.AppLogger) *FavoriteRepository {
	return &FavoriteRepository{q: sqlcdb.New(db), log: log}
}

func (r *FavoriteRepository) Add(ctx context.Context, userID string, productID int64) error {
	err := r.q.AddFavorite(ctx, sqlcdb.AddFavoriteParams{
		UserID:    userID,
		ProductID: productID,
	})
	if err != nil {
		if isUniqueConstraint(err) {
			r.log.Warn("domain_constraint",
				"layer", "sqlite", "operation", "add_favorite", "table", "favorites",
				"constraint", "UNIQUE",
				"correlation_id", middleware.CorrelationIDFromCtx(ctx),
			)
			return domain.ErrAlreadyFavorite()
		}
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "add_favorite", "table", "favorites",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.NewInternalError(err)
	}
	return nil
}

func (r *FavoriteRepository) Remove(ctx context.Context, userID string, productID int64) error {
	if err := r.q.RemoveFavorite(ctx, sqlcdb.RemoveFavoriteParams{
		UserID:    userID,
		ProductID: productID,
	}); err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "remove_favorite", "table", "favorites",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return domain.NewInternalError(err)
	}
	return nil
}

func (r *FavoriteRepository) List(ctx context.Context, userID string) ([]port.Favorite, error) {
	rows, err := r.q.ListFavoritesByUserID(ctx, userID)
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "list_favorites", "table", "favorites",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return nil, domain.NewInternalError(err)
	}

	favorites := make([]port.Favorite, 0, len(rows))
	for _, row := range rows {
		favorites = append(favorites, port.Favorite{
			UserID:    row.UserID,
			ProductID: row.ProductID,
			CreatedAt: row.CreatedAt,
		})
	}
	return favorites, nil
}

func (r *FavoriteRepository) IsFavorite(ctx context.Context, userID string, productID int64) (bool, error) {
	count, err := r.q.IsFavorite(ctx, sqlcdb.IsFavoriteParams{
		UserID:    userID,
		ProductID: productID,
	})
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "is_favorite", "table", "favorites",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return false, domain.NewInternalError(err)
	}
	return count > 0, nil
}

