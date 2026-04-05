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
// It receives the errHandler so it can call it directly when there is an error.
// This ensures the response status code is set before reading it for the log entry —
// otherwise Fiber's global ErrorHandler would run after the log is written, giving
// status 200 for all errored responses.
func RequestLogger(log *logger.AppLogger, errHandler fiber.ErrorHandler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Capture body before processing — Fiber buffers it so this is safe.
		rawBody := string(c.Body())

		handlerErr := c.Next()

		// If there's an error, let the error handler write the response first
		// so c.Response().StatusCode() reflects the real HTTP status.
		if handlerErr != nil {
			if err := errHandler(c, handlerErr); err != nil {
				log.Error("error_handler_failed", "error", err, "original_error", handlerErr)
			}
		}

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

		// Return nil — the response was already written by errHandler above.
		return nil
	}
}

// sanitizeBody redacts sensitive fields (e.g. password) from a raw JSON body string.
func sanitizeBody(body string) string {
	return passwordPattern.ReplaceAllString(body, `"password":"[REDACTED]"`)
}
