package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type FavoriteRepository struct {
	q *sqlcdb.Queries
}

func NewFavoriteRepository(db *sql.DB) *FavoriteRepository {
	return &FavoriteRepository{q: sqlcdb.New(db)}
}

func (r *FavoriteRepository) Add(ctx context.Context, userID string, productID int64) error {
	err := r.q.AddFavorite(ctx, sqlcdb.AddFavoriteParams{
		UserID:    userID,
		ProductID: productID,
	})
	if err != nil {
		if isUniqueConstraint(err) {
			return &AlreadyFavoriteError{}
		}
		return err
	}
	return nil
}

func (r *FavoriteRepository) Remove(ctx context.Context, userID string, productID int64) error {
	return r.q.RemoveFavorite(ctx, sqlcdb.RemoveFavoriteParams{
		UserID:    userID,
		ProductID: productID,
	})
}

func (r *FavoriteRepository) List(ctx context.Context, userID string) ([]port.Favorite, error) {
	rows, err := r.q.ListFavoritesByUserID(ctx, userID)
	if err != nil {
		return nil, err
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
	return count > 0, err
}

type AlreadyFavoriteError struct{}

func (e *AlreadyFavoriteError) Error() string { return "product is already in favorites" }

// Favorite is the domain struct used by the port.
// Defined here to avoid circular imports; port imports it.
var _ = time.Now // keep time import
