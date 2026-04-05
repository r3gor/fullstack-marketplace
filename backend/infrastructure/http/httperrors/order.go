package httperrors

import "github.com/gofiber/fiber/v2"

// OrderCodes maps order domain error codes to HTTP status codes.
var OrderCodes = map[string]int{
	"order.not_found":             fiber.StatusNotFound,
	"order.empty":                 fiber.StatusBadRequest,
	"order.invalid_item_quantity": fiber.StatusBadRequest,
	"order.invalid_item_price":    fiber.StatusBadRequest,
}
