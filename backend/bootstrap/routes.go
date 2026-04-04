package bootstrap

import (
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/bootstrap/config"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/handler"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

func registerRoutes(
	app *fiber.App,
	db *sql.DB,
	cfg *config.Config,
	authService *application.AuthService,
	userService *application.UserService,
	favoriteService *application.FavoriteService,
	orderService *application.OrderService,
	reviewService *application.ReviewService,
	appLog *logger.AppLogger,
) {
	healthHandler := handler.NewHealthHandler(db)
	docsHandler := handler.NewDocsHandler("./docs/openapi.yaml")
	authHandler := handler.NewAuthHandler(authService, cfg, appLog)
	userHandler := handler.NewUserHandler(userService, appLog)
	favoriteHandler := handler.NewFavoriteHandler(favoriteService, appLog)
	orderHandler := handler.NewOrderHandler(orderService, appLog)
	reviewHandler := handler.NewReviewHandler(reviewService, appLog)

	// Docs (public)
	app.Get("/docs", docsHandler.ScalarUI)
	app.Get("/docs/openapi.yaml", docsHandler.Spec)

	api := app.Group("/api/v1")
	api.Use(middleware.CorrelationID())

	api.Get("/health", healthHandler.Check)

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", middleware.RequireAuth(cfg.JWTSecret), authHandler.Logout)
	auth.Post("/refresh", authHandler.Refresh)

	// Protected routes
	protected := api.Group("", middleware.RequireAuth(cfg.JWTSecret))

	users := protected.Group("/users")
	users.Get("/me", userHandler.GetMe)
	users.Patch("/me", userHandler.UpdateMe)

	favorites := protected.Group("/favorites")
	favorites.Get("", favoriteHandler.List)
	favorites.Post("/:productId", favoriteHandler.Add)
	favorites.Delete("/:productId", favoriteHandler.Remove)

	orders := protected.Group("/orders")
	orders.Get("", orderHandler.List)
	orders.Post("", orderHandler.Create)
	orders.Get("/:id", orderHandler.Get)

	products := protected.Group("/products")
	products.Post("/:productId/reviews", reviewHandler.Create)
}
