package middleware

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const CorrelationIDHeader = "X-Correlation-ID"

// correlationKey is an unexported type to avoid context key collisions.
type correlationKey struct{}

// CorrelationID generates or propagates a correlation ID for each request.
// It is stored in Fiber locals, the response header, and the Go context so that
// infrastructure adapters (repos, HTTP clients) can include it in their logs.
func CorrelationID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Get(CorrelationIDHeader)
		if id == "" {
			id = uuid.New().String()
		}
		c.Locals(CorrelationIDHeader, id)
		c.Set(CorrelationIDHeader, id)

		// Propagate into the Go context so repos/clients can read it via CorrelationIDFromCtx.
		ctx := context.WithValue(c.Context(), correlationKey{}, id)
		c.SetUserContext(ctx)

		return c.Next()
	}
}

// GetCorrelationID retrieves the correlation ID from Fiber locals (use in handlers/middleware).
func GetCorrelationID(c *fiber.Ctx) string {
	if id, ok := c.Locals(CorrelationIDHeader).(string); ok {
		return id
	}
	return ""
}

// CorrelationIDFromCtx retrieves the correlation ID from a Go context (use in repos/clients).
func CorrelationIDFromCtx(ctx context.Context) string {
	if id, ok := ctx.Value(correlationKey{}).(string); ok {
		return id
	}
	return ""
}
