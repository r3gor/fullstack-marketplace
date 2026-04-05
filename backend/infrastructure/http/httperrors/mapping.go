package httperrors

import "github.com/gofiber/fiber/v2"

// statusMap is the merged lookup table of all domain error codes → HTTP status.
// It is built once at startup from the per-entity maps.
var statusMap map[string]int

func init() {
	sources := []map[string]int{
		UserCodes,
		OrderCodes,
		ReviewCodes,
		FavoriteCodes,
		requestCodes,
	}
	statusMap = make(map[string]int)
	for _, m := range sources {
		for code, status := range m {
			statusMap[code] = status
		}
	}
	// Generic fallback codes used by NewInternalError and fiber.Error handling.
	statusMap["internal_server_error"] = fiber.StatusInternalServerError
}

// StatusFor returns the HTTP status code for a given domain error code.
// Falls back to 500 for any unknown code so unregistered errors are safe.
func StatusFor(code string) int {
	if status, ok := statusMap[code]; ok {
		return status
	}
	return fiber.StatusInternalServerError
}
