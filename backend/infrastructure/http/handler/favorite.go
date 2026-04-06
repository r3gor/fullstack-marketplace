package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

type FavoriteHandler struct {
	favoriteService *application.FavoriteService
	log             *logger.AppLogger
}

func NewFavoriteHandler(favoriteService *application.FavoriteService, log *logger.AppLogger) *FavoriteHandler {
	return &FavoriteHandler{favoriteService: favoriteService, log: log}
}

// List godoc — GET /api/v1/favorites
func (h *FavoriteHandler) List(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	favorites, err := h.favoriteService.List(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return c.JSON(toFavoriteListResponse(favorites))
}

// Add godoc — POST /api/v1/favorites/:productId
func (h *FavoriteHandler) Add(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	productID, err := strconv.ParseInt(c.Params("productId"), 10, 64)
	if err != nil {
		return domain.ErrInvalidProductID()
	}

	if err := h.favoriteService.Add(c.UserContext(), userID, productID); err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"product_id": productID})
}

// Remove godoc — DELETE /api/v1/favorites/:productId
func (h *FavoriteHandler) Remove(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	productID, err := strconv.ParseInt(c.Params("productId"), 10, 64)
	if err != nil {
		return domain.ErrInvalidProductID()
	}

	if err := h.favoriteService.Remove(c.UserContext(), userID, productID); err != nil {
		return err
	}

	return c.JSON(fiber.Map{"message": "removed from favorites"})
}

type favoriteResponse struct {
	ProductID int64  `json:"product_id"`
	CreatedAt string `json:"created_at"`
}

func toFavoriteListResponse(favorites []port.Favorite) []favoriteResponse {
	result := make([]favoriteResponse, 0, len(favorites))
	for _, f := range favorites {
		result = append(result, favoriteResponse{
			ProductID: f.ProductID,
			CreatedAt: f.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}
	return result
}
