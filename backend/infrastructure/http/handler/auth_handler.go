package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/bootstrap/config"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/http/middleware"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

type AuthHandler struct {
	authService *application.AuthService
	cfg         *config.Config
	log         *logger.AppLogger
}

func NewAuthHandler(authService *application.AuthService, cfg *config.Config, log *logger.AppLogger) *AuthHandler {
	return &AuthHandler{authService: authService, cfg: cfg, log: log}
}

// Register godoc — POST /api/v1/auth/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	user, err := h.authService.Register(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	})
}

// Login godoc — POST /api/v1/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	user, refreshToken, err := h.authService.Login(c.UserContext(), req)
	if err != nil {
		return err
	}

	accessToken, err := h.generateAccessToken(user.ID)
	if err != nil {
		h.log.Error("failed to generate access token", "error", err, "user_id", user.ID, "correlation_id", middleware.GetCorrelationID(c))
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate token")
	}

	h.setAuthCookies(c, accessToken, refreshToken)

	return c.JSON(dto.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	})
}

// Logout godoc — POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	rawRefreshToken := c.Cookies("refresh_token")

	if err := h.authService.Logout(c.UserContext(), rawRefreshToken, userID); err != nil {
		h.log.Error("logout error", "error", err, "user_id", userID, "correlation_id", middleware.GetCorrelationID(c))
	}

	h.clearAuthCookies(c)
	return c.SendStatus(fiber.StatusNoContent)
}

// Refresh godoc — POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	rawRefreshToken := c.Cookies("refresh_token")

	user, newRefreshToken, err := h.authService.Refresh(c.UserContext(), rawRefreshToken)
	if err != nil {
		return err
	}

	accessToken, err := h.generateAccessToken(user.ID)
	if err != nil {
		h.log.Error("failed to generate access token on refresh", "error", err, "user_id", user.ID, "correlation_id", middleware.GetCorrelationID(c))
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate token")
	}

	h.setAuthCookies(c, accessToken, newRefreshToken)

	return c.JSON(dto.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	})
}

func (h *AuthHandler) generateAccessToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(h.cfg.JWTExpiry).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.cfg.JWTSecret))
}

func (h *AuthHandler) setAuthCookies(c *fiber.Ctx, accessToken, refreshToken string) {
	secure := h.cfg.Env == "production"

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
		MaxAge:   int(h.cfg.JWTExpiry.Seconds()),
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
		MaxAge:   int(h.cfg.RefreshTokenExpiry.Seconds()),
		Path:     "/api/v1/auth",
	})
}

func (h *AuthHandler) clearAuthCookies(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{Name: "access_token", Value: "", MaxAge: -1, Path: "/"})
	c.Cookie(&fiber.Cookie{Name: "refresh_token", Value: "", MaxAge: -1, Path: "/api/v1/auth"})
}
