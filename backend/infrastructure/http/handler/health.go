package handler

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Check(c *fiber.Ctx) error {
	if err := h.db.Ping(); err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status":  "unhealthy",
			"message": "database unreachable",
		})
	}
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "fullstack-ecommerce-api",
	})
}
