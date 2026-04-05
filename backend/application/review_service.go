package application

import (
	"context"
	"fmt"
	"strings"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/strapi"
)

type ReviewService struct {
	orders      port.OrderRepository
	submissions port.ReviewSubmissionRepository
	strapi      *strapi.Client
	auditLogger port.AuditLogger
}

func NewReviewService(
	orders port.OrderRepository,
	submissions port.ReviewSubmissionRepository,
	strapiClient *strapi.Client,
	audit port.AuditLogger,
) *ReviewService {
	return &ReviewService{
		orders:      orders,
		submissions: submissions,
		strapi:      strapiClient,
		auditLogger: audit,
	}
}

func (s *ReviewService) SubmitReview(ctx context.Context, userID string, productID int64, req dto.CreateReviewRequest) error {
	if req.Rating < 1 || req.Rating > 5 {
		return domain.ErrInvalidRating(1, 5)
	}
	req.Comment = strings.TrimSpace(req.Comment)
	if len(req.Comment) < 10 {
		return domain.ErrCommentTooShort(10)
	}
	if len(req.Comment) > 1000 {
		return domain.ErrCommentTooLong(1000)
	}

	// Must have purchased the product
	purchased, err := s.orders.UserHasPurchasedProduct(ctx, userID, productID)
	if err != nil {
		return fmt.Errorf("failed to check purchase history: %w", err)
	}
	if !purchased {
		return domain.ErrProductNotPurchased()
	}

	// No duplicate reviews
	exists, err := s.submissions.Exists(ctx, userID, productID)
	if err != nil {
		return fmt.Errorf("failed to check existing review: %w", err)
	}
	if exists {
		return domain.ErrReviewAlreadySubmitted()
	}

	// Create review in Strapi with status "pending"
	strapiID, err := s.strapi.CreateReview(ctx, strapi.CreateReviewInput{
		UserID:    userID,
		ProductID: productID,
		Rating:    req.Rating,
		Comment:   req.Comment,
		Status:    "pending",
	})
	if err != nil {
		return fmt.Errorf("failed to create review in Strapi: %w", err)
	}

	// Record submission for deduplication tracking
	if err := s.submissions.Create(ctx, userID, productID, strapiID); err != nil {
		return fmt.Errorf("failed to record review submission: %w", err)
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "review_submitted",
		PerformedBy: userID,
		Target:      strapiID,
	})

	return nil
}
