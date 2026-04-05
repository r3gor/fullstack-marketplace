package middleware

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

// ErrorHandler is the centralized Fiber error handler.
// All handlers simply return err — this function does all the translation.
// It performs a single errors.As check against *domain.AppError, then falls back
// to fiber.Error (from middleware like RequireAuth) and finally to a generic 500.
func ErrorHandler(log *logger.AppLogger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		correlationID := GetCorrelationID(c)

		var appErr *domain.AppError
		if errors.As(err, &appErr) {
			if appErr.Code == domain.ErrCodeInternal {
				log.Error("unexpected_error",
					"correlation_id", correlationID,
					"error", appErr.Err,
				)
			}
			return c.Status(statusForCode(appErr.Code)).JSON(fiber.Map{
				"error":   appErr.Code,
				"message": appErr.Message,
			})
		}

		// fiber.Error comes from Fiber internals and middleware (BodyParser, RequireAuth, etc.)
		var fiberErr *fiber.Error
		if errors.As(err, &fiberErr) {
			if fiberErr.Code >= 500 {
				log.Error("unexpected_error",
					"correlation_id", correlationID,
					"error", fiberErr.Message,
				)
			}
			return c.Status(fiberErr.Code).JSON(fiber.Map{
				"error":   httpErrorKey(fiberErr.Code),
				"message": fiberErr.Message,
			})
		}

		log.Error("unexpected_error",
			"correlation_id", correlationID,
			"error", err.Error(),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "internal_server_error",
			"message": "an unexpected error occurred",
		})
	}
}

// statusForCode maps an AppError Code constant to its HTTP status code.
func statusForCode(code string) int {
	switch code {
	case domain.ErrCodeValidation:
		return fiber.StatusBadRequest
	case domain.ErrCodeNotFound:
		return fiber.StatusNotFound
	case domain.ErrCodeConflict:
		return fiber.StatusConflict
	case domain.ErrCodeUnauthorized:
		return fiber.StatusUnauthorized
	default:
		return fiber.StatusInternalServerError
	}
}

func httpErrorKey(code int) string {
	keys := map[int]string{
		fiber.StatusBadRequest:          "validation_error",
		fiber.StatusUnauthorized:        "unauthorized",
		fiber.StatusForbidden:           "forbidden",
		fiber.StatusNotFound:            "not_found",
		fiber.StatusConflict:            "conflict",
		fiber.StatusInternalServerError: "internal_server_error",
	}
	if k, ok := keys[code]; ok {
		return k
	}
	return "internal_server_error"
}
