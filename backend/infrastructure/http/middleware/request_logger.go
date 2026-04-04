package middleware

import (
	"regexp"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

var passwordPattern = regexp.MustCompile(`(?i)"password"\s*:\s*"[^"]*"`)

// RequestLogger logs every request with full context at the appropriate level:
//   - INFO  for 2xx/3xx (success)
//   - WARN  for 4xx (client errors: validation, conflict, unauthorized)
//   - ERROR for 5xx (unexpected server errors)
//
// For non-GET requests with status >= 400, the sanitized request body is included
// so errors can be correlated with what the user sent.
func RequestLogger(log *logger.AppLogger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Capture body before processing — Fiber buffers it so this is safe.
		rawBody := string(c.Body())

		err := c.Next()

		status := c.Response().StatusCode()
		latency := time.Since(start)
		correlationID := GetCorrelationID(c)
		userID, _ := c.Locals("user_id").(string)

		attrs := []any{
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"latency_ms", latency.Milliseconds(),
			"ip", c.IP(),
			"correlation_id", correlationID,
			"user_id", userID,
		}

		if query := string(c.Request().URI().QueryString()); query != "" {
			attrs = append(attrs, "query", query)
		}

		if c.Method() != fiber.MethodGet && rawBody != "" && status >= 400 {
			attrs = append(attrs, "body", sanitizeBody(rawBody))
		}

		switch {
		case status >= 500:
			log.Error("request", attrs...)
		case status >= 400:
			log.Warn("request", attrs...)
		default:
			log.Info("request", attrs...)
		}

		return err
	}
}

// sanitizeBody redacts sensitive fields (e.g. password) from a raw JSON body string.
func sanitizeBody(body string) string {
	return passwordPattern.ReplaceAllString(body, `"password":"[REDACTED]"`)
}
