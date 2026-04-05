package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

type ReviewHandler struct {
	reviewService *application.ReviewService
	log           *logger.AppLogger
}

func NewReviewHandler(reviewService *application.ReviewService, log *logger.AppLogger) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService, log: log}
}

// Create godoc — POST /api/v1/products/:productId/reviews
func (h *ReviewHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	productID, err := strconv.ParseInt(c.Params("productId"), 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid product ID")
	}

	var req dto.CreateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := h.reviewService.SubmitReview(c.UserContext(), userID, productID, req); err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "review submitted and pending moderation",
	})
}
