package strapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

type Client struct {
	baseURL    string
	apiToken   string
	httpClient *http.Client
	log        *logger.AppLogger
}

func NewClient(baseURL, apiToken string, log *logger.AppLogger) *Client {
	return &Client{
		baseURL:  baseURL,
		apiToken: apiToken,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		log: log,
	}
}

type CreateReviewInput struct {
	UserID    string `json:"user_id"`
	ProductID int64  `json:"product_id"`
	Rating    int    `json:"rating"`
	Comment   string `json:"comment"`
	Status    string `json:"status"`
}

type reviewPayload struct {
	Data CreateReviewInput `json:"data"`
}

type reviewResponse struct {
	Data struct {
		DocumentID string `json:"documentId"`
	} `json:"data"`
}

// CreateReview posts a new review to Strapi with status "pending".
// Returns the Strapi documentId of the created review.
func (c *Client) CreateReview(ctx context.Context, input CreateReviewInput) (string, error) {
	url := c.baseURL + "/api/reviews"
	payload := reviewPayload{Data: input}

	body, err := json.Marshal(payload)
	if err != nil {
		c.log.Error("strapi_error",
			"layer", "strapi", "operation", "create_review", "url", url,
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return "", domain.NewInternalError(fmt.Errorf("failed to marshal review payload: %w", err))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		c.log.Error("strapi_error",
			"layer", "strapi", "operation", "create_review", "url", url,
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return "", domain.NewInternalError(fmt.Errorf("failed to build request: %w", err))
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.log.Error("strapi_error",
			"layer", "strapi", "operation", "create_review", "url", url, "method", "POST",
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return "", domain.NewInternalError(fmt.Errorf("failed to call Strapi: %w", err))
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		c.log.Warn("strapi_non2xx",
			"layer", "strapi", "operation", "create_review", "url", url,
			"method", "POST", "status_code", resp.StatusCode,
			"correlation_id", middleware.CorrelationIDFromCtx(ctx),
		)
		return "", domain.NewInternalError(fmt.Errorf("strapi returned status %d", resp.StatusCode))
	}

	var result reviewResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.log.Error("strapi_error",
			"layer", "strapi", "operation", "create_review", "url", url,
			"correlation_id", middleware.CorrelationIDFromCtx(ctx), "error", err,
		)
		return "", domain.NewInternalError(fmt.Errorf("failed to decode Strapi response: %w", err))
	}

	return result.Data.DocumentID, nil
}
