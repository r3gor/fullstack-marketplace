package bootstrap

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/bootstrap/config"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/handler"
)

func registerRoutes(app *fiber.App, db *sql.DB, cfg *config.Config) {
	healthHandler := handler.NewHealthHandler(db)

	api := app.Group("/api/v1")
	api.Get("/health", healthHandler.Check)
}
