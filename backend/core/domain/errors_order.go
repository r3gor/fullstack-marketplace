package domain

import "fmt"

// Order domain errors.

func ErrOrderNotFound() *AppError {
	return NewNotFoundError("order")
}

func ErrEmptyOrder() *AppError {
	return NewValidationError("order must contain at least one item")
}

// ErrInvalidItemQuantity is returned when an order item has a zero or negative quantity.
// itemIndex is 1-based for human-readable messages.
func ErrInvalidItemQuantity(itemIndex int) *AppError {
	return NewValidationError(fmt.Sprintf("item %d: quantity must be greater than 0", itemIndex))
}

// ErrInvalidItemPrice is returned when an order item has a zero or negative price.
// itemIndex is 1-based for human-readable messages.
func ErrInvalidItemPrice(itemIndex int) *AppError {
	return NewValidationError(fmt.Sprintf("item %d: price must be greater than 0", itemIndex))
}
