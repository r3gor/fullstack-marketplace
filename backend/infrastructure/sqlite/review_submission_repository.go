package sqlite

import (
	"context"
	"database/sql"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type ReviewSubmissionRepository struct {
	q *sqlcdb.Queries
}

func NewReviewSubmissionRepository(db *sql.DB) *ReviewSubmissionRepository {
	return &ReviewSubmissionRepository{q: sqlcdb.New(db)}
}

func (r *ReviewSubmissionRepository) Create(ctx context.Context, userID string, productID int64, strapiReviewID string) error {
	return r.q.CreateReviewSubmission(ctx, sqlcdb.CreateReviewSubmissionParams{
		UserID:         userID,
		ProductID:      productID,
		StrapiReviewID: strapiReviewID,
	})
}

func (r *ReviewSubmissionRepository) Exists(ctx context.Context, userID string, productID int64) (bool, error) {
	count, err := r.q.ExistsReviewSubmission(ctx, sqlcdb.ExistsReviewSubmissionParams{
		UserID:    userID,
		ProductID: productID,
	})
	return count > 0, err
}
