package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const CorrelationIDHeader = "X-Correlation-ID"

// CorrelationID generates or propagates a correlation ID for each request.
// It is stored in the Fiber locals and returned in the response header.
func CorrelationID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Get(CorrelationIDHeader)
		if id == "" {
			id = uuid.New().String()
		}
		c.Locals(CorrelationIDHeader, id)
		c.Set(CorrelationIDHeader, id)
		return c.Next()
	}
}

// GetCorrelationID retrieves the correlation ID from Fiber locals.
func GetCorrelationID(c *fiber.Ctx) string {
	if id, ok := c.Locals(CorrelationIDHeader).(string); ok {
		return id
	}
	return ""
}
