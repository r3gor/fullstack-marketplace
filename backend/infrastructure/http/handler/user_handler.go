package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

type UserHandler struct {
	userService *application.UserService
	log         *logger.AppLogger
}

func NewUserHandler(userService *application.UserService, log *logger.AppLogger) *UserHandler {
	return &UserHandler{userService: userService, log: log}
}

// GetMe godoc — GET /api/v1/users/me
func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	user, err := h.userService.GetMe(c.Context(), userID)
	if err != nil {
		return h.handleError(c, err, "get_me")
	}

	return c.JSON(dto.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	})
}

// UpdateMe godoc — PATCH /api/v1/users/me
func (h *UserHandler) UpdateMe(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	user, err := h.userService.UpdateMe(c.Context(), userID, req)
	if err != nil {
		return h.handleError(c, err, "update_me")
	}

	return c.JSON(dto.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	})
}

func (h *UserHandler) handleError(c *fiber.Ctx, err error, op string) error {
	var valErr *domain.ValidationError
	var conflictErr *domain.ConflictError
	var notFoundErr *domain.NotFoundError

	switch {
	case errors.As(err, &valErr):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "validation_error", "message": valErr.Message,
		})
	case errors.As(err, &conflictErr):
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "conflict", "message": conflictErr.Message,
		})
	case errors.As(err, &notFoundErr):
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "not_found", "message": notFoundErr.Error(),
		})
	default:
		h.log.Error("unexpected error", "operation", op, "error", err, "correlation_id", middleware.GetCorrelationID(c))
		return fiber.NewError(fiber.StatusInternalServerError, "an unexpected error occurred")
	}
}
