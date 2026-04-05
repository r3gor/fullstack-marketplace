package httperrors

import "github.com/gofiber/fiber/v2"

// UserCodes maps user and authentication domain error codes to HTTP status codes.
var UserCodes = map[string]int{
	"user.not_found":             fiber.StatusNotFound,
	"user.email_already_in_use":  fiber.StatusConflict,
	"user.invalid_name":          fiber.StatusBadRequest,
	"user.invalid_email":         fiber.StatusBadRequest,
	"user.password_too_short":    fiber.StatusBadRequest,
	"user.invalid_credentials":   fiber.StatusUnauthorized,
	"user.refresh_token_required": fiber.StatusUnauthorized,
	"user.invalid_refresh_token": fiber.StatusUnauthorized,
}
