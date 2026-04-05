package sqlite

import (
	"context"
	"database/sql"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite/sqlcdb"
)

type ReviewSubmissionRepository struct {
	q   *sqlcdb.Queries
	log *logger.AppLogger
}

func NewReviewSubmissionRepository(db *sql.DB, log *logger.AppLogger) *ReviewSubmissionRepository {
	return &ReviewSubmissionRepository{q: sqlcdb.New(db), log: log}
}

func (r *ReviewSubmissionRepository) Create(ctx context.Context, userID string, productID int64, strapiReviewID string) error {
	if err := r.q.CreateReviewSubmission(ctx, sqlcdb.CreateReviewSubmissionParams{
		UserID:         userID,
		ProductID:      productID,
		StrapiReviewID: strapiReviewID,
	}); err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "create_review_submission", "table", "review_submissions",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return &infrastructure.InfraError{Layer: "sqlite", Operation: "create_review_submission", Resource: "review_submissions", Cause: err}
	}
	return nil
}

func (r *ReviewSubmissionRepository) Exists(ctx context.Context, userID string, productID int64) (bool, error) {
	count, err := r.q.ExistsReviewSubmission(ctx, sqlcdb.ExistsReviewSubmissionParams{
		UserID:    userID,
		ProductID: productID,
	})
	if err != nil {
		r.log.Error("db_error",
			"layer", "sqlite", "operation", "exists_review_submission", "table", "review_submissions",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return false, &infrastructure.InfraError{Layer: "sqlite", Operation: "exists_review_submission", Resource: "review_submissions", Cause: err}
	}
	return count > 0, nil
}
