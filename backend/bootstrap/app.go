package bootstrap

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/bootstrap/config"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/sqlite"
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

	// Repositories
	userRepo := sqlite.NewUserRepository(db)
	refreshTokenRepo := sqlite.NewRefreshTokenRepository(db)

	// Loggers
	auditLog := logger.NewAuditLogger()
	appLog := logger.NewAppLogger()

	// Services
	authService := application.NewAuthService(userRepo, refreshTokenRepo, auditLog, cfg.RefreshTokenExpiry)

	app := fiber.New(fiber.Config{
		AppName:      "Fullstack E-commerce API",
		ErrorHandler: errorHandler,
	})

	app.Use(recover.New())
	app.Use(fiberlogger.New(fiberlogger.Config{
		Format: "[${time}] ${status} - ${method} ${path} (${latency})\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PATCH, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	registerRoutes(app, db, cfg, authService, appLog)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("server starting on %s (env: %s)", addr, cfg.Env)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"error":   "internal_server_error",
		"message": err.Error(),
	})
}
