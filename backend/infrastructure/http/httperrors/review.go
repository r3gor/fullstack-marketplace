package httperrors

import "github.com/gofiber/fiber/v2"

// ReviewCodes maps review domain error codes to HTTP status codes.
var ReviewCodes = map[string]int{
	"review.invalid_rating":        fiber.StatusBadRequest,
	"review.comment_too_short":     fiber.StatusBadRequest,
	"review.comment_too_long":      fiber.StatusBadRequest,
	"review.product_not_purchased": fiber.StatusBadRequest,
	"review.already_submitted":     fiber.StatusConflict,
}
