package middleware

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/infrastructure/logger"
)

// ErrorHandler is the centralized Fiber error handler.
// It maps domain errors, infrastructure errors, and fiber errors to HTTP responses.
// All handlers simply return err — this function does all the translation.
func ErrorHandler(log *logger.AppLogger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		correlationID := GetCorrelationID(c)

		var valErr *domain.ValidationError
		var conflictErr *domain.ConflictError
		var unauthErr *domain.UnauthorizedError
		var notFoundErr *domain.NotFoundError
		var infraErr *infrastructure.InfraError
		var fiberErr *fiber.Error

		switch {
		case errors.As(err, &valErr):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "validation_error",
				"message": valErr.Message,
			})

		case errors.As(err, &conflictErr):
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":   "conflict",
				"message": conflictErr.Message,
			})

		case errors.As(err, &unauthErr):
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error":   "unauthorized",
				"message": unauthErr.Message,
			})

		case errors.As(err, &notFoundErr):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "not_found",
				"message": notFoundErr.Error(),
			})

		case errors.As(err, &infraErr):
			log.Error("unexpected_error",
				"correlation_id", correlationID,
				"error", infraErr.Error(),
			)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "internal_server_error",
				"message": "an unexpected error occurred",
			})

		case errors.As(err, &fiberErr):
			// fiber.Error comes from middleware (RequireAuth, BodyParser failures, etc.)
			// Only log if it's a 5xx
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

		default:
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
