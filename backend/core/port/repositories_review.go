package port

import "context"

type ReviewSubmissionRepository interface {
	Create(ctx context.Context, userID string, productID int64, strapiReviewID string) error
	Exists(ctx context.Context, userID string, productID int64) (bool, error)
}
