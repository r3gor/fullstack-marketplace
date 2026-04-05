package httperrors

import "github.com/gofiber/fiber/v2"

var requestCodes = map[string]int{
	"request.invalid_body":       fiber.StatusBadRequest,
	"request.invalid_product_id": fiber.StatusBadRequest,
}
