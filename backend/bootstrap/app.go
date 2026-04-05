package bootstrap

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/bootstrap/config"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/strapi"
)

func Run() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := sql.Open("sqlite3", cfg.DatabaseURL+"?_foreign_keys=on")
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	log.Printf("connected to SQLite at %s", cfg.DatabaseURL)

	if err := runMigrations(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	// Loggers
	auditLog := logger.NewAuditLogger()
	appLog := logger.NewAppLogger()

	// Repositories
	userRepo             := sqlite.NewUserRepository(db, appLog)
	refreshTokenRepo     := sqlite.NewRefreshTokenRepository(db, appLog)
	favoriteRepo         := sqlite.NewFavoriteRepository(db, appLog)
	orderRepo            := sqlite.NewOrderRepository(db, appLog)
	reviewSubmissionRepo := sqlite.NewReviewSubmissionRepository(db, appLog)

	// Services
	authService := application.NewAuthService(userRepo, refreshTokenRepo, auditLog, cfg.RefreshTokenExpiry)
	userService := application.NewUserService(userRepo, auditLog)
	favoriteService := application.NewFavoriteService(favoriteRepo, auditLog)
	orderService := application.NewOrderService(orderRepo, auditLog)

	strapiClient := strapi.NewClient(cfg.StrapiAPIURL, cfg.StrapiAPIToken, appLog)
	reviewService := application.NewReviewService(orderRepo, reviewSubmissionRepo, strapiClient, auditLog)

	errHandler := middleware.ErrorHandler(appLog)

	app := fiber.New(fiber.Config{
		AppName:        "Fullstack E-commerce API",
		ErrorHandler:   errHandler,
		ReadBufferSize: 16 * 1024, // 16 KB — prevents 431 when JWT cookies are sent
	})

	app.Use(recover.New())
	app.Use(middleware.CorrelationID())
	app.Use(middleware.RequestLogger(appLog, errHandler))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PATCH, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	registerRoutes(app, db, cfg, authService, userService, favoriteService, orderService, reviewService, appLog)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("server starting on %s (env: %s)", addr, cfg.Env)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
