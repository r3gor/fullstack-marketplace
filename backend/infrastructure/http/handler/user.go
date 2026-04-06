package handler

import (
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

	user, err := h.userService.GetMe(c.UserContext(), userID)
	if err != nil {
		return err
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
		return domain.ErrInvalidRequestBody()
	}

	user, err := h.userService.UpdateMe(c.UserContext(), userID, req)
	if err != nil {
		return err
	}

	return c.JSON(dto.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	})
}
