package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

type OrderHandler struct {
	orderService *application.OrderService
	log          *logger.AppLogger
}

func NewOrderHandler(orderService *application.OrderService, log *logger.AppLogger) *OrderHandler {
	return &OrderHandler{orderService: orderService, log: log}
}

// List godoc — GET /api/v1/orders
func (h *OrderHandler) List(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	orders, err := h.orderService.ListOrders(c.Context(), userID)
	if err != nil {
		h.log.Error("failed to list orders", "error", err, "user_id", userID)
		return fiber.NewError(fiber.StatusInternalServerError, "failed to retrieve orders")
	}

	return c.JSON(toOrderListResponse(orders))
}

// Create godoc — POST /api/v1/orders
func (h *OrderHandler) Create(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req dto.CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	order, err := h.orderService.CreateOrder(c.Context(), userID, req)
	if err != nil {
		var valErr *domain.ValidationError
		if errors.As(err, &valErr) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "validation_error", "message": valErr.Message,
			})
		}
		h.log.Error("failed to create order", "error", err, "user_id", userID)
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create order")
	}

	return c.Status(fiber.StatusCreated).JSON(toOrderResponse(order))
}

// Get godoc — GET /api/v1/orders/:id
func (h *OrderHandler) Get(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	orderID := c.Params("id")

	order, err := h.orderService.GetOrder(c.Context(), userID, orderID)
	if err != nil {
		var notFoundErr *domain.NotFoundError
		if errors.As(err, &notFoundErr) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "not_found", "message": notFoundErr.Error(),
			})
		}
		h.log.Error("failed to get order", "error", err, "user_id", userID)
		return fiber.NewError(fiber.StatusInternalServerError, "failed to retrieve order")
	}

	return c.JSON(toOrderResponse(order))
}

func toOrderResponse(order port.Order) dto.OrderResponse {
	items := make([]dto.OrderItemResponse, 0, len(order.Items))
	for _, item := range order.Items {
		items = append(items, dto.OrderItemResponse{
			ID:              item.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			PriceAtPurchase: item.PriceAtPurchase,
		})
	}
	return dto.OrderResponse{
		ID:          order.ID,
		TotalAmount: order.TotalAmount,
		Status:      order.Status,
		Items:       items,
		CreatedAt:   order.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func toOrderListResponse(orders []port.Order) []dto.OrderResponse {
	result := make([]dto.OrderResponse, 0, len(orders))
	for _, o := range orders {
		result = append(result, toOrderResponse(o))
	}
	return result
}
