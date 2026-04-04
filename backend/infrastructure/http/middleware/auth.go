package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const UserIDKey = "user_id"

// RequireAuth validates the JWT access token from the httpOnly cookie.
// On success, it sets the userID in Fiber locals for downstream handlers.
func RequireAuth(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenStr := c.Cookies("access_token")
		if tokenStr == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "authentication required")
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid token signing method")
			}
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid or expired token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid token claims")
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid token subject")
		}

		c.Locals(UserIDKey, userID)
		return c.Next()
	}
}

// GetUserID retrieves the authenticated user ID from Fiber locals.
func GetUserID(c *fiber.Ctx) string {
	if id, ok := c.Locals(UserIDKey).(string); ok {
		return id
	}
	return ""
}
