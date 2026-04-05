package httperrors

import "github.com/gofiber/fiber/v2"

// FavoriteCodes maps favorite domain error codes to HTTP status codes.
var FavoriteCodes = map[string]int{
	"favorite.already_added": fiber.StatusConflict,
}
