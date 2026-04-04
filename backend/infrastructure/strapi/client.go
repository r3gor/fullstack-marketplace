package strapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	baseURL    string
	apiToken   string
	httpClient *http.Client
}

func NewClient(baseURL, apiToken string) *Client {
	return &Client{
		baseURL:  baseURL,
		apiToken: apiToken,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
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
	payload := reviewPayload{Data: input}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal review payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/reviews", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to build request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call Strapi: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("strapi returned status %d", resp.StatusCode)
	}

	var result reviewResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode Strapi response: %w", err)
	}

	return result.Data.DocumentID, nil
}
