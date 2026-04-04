package domain

import "fmt"

// ValidationError is returned when input data is invalid.
type ValidationError struct{ Message string }

func (e *ValidationError) Error() string { return e.Message }

// NotFoundError is returned when a requested resource does not exist.
type NotFoundError struct{ Resource string }

func (e *NotFoundError) Error() string { return fmt.Sprintf("%s not found", e.Resource) }

// ConflictError is returned when a resource already exists.
type ConflictError struct{ Message string }

func (e *ConflictError) Error() string { return e.Message }

// UnauthorizedError is returned when credentials are missing or invalid.
type UnauthorizedError struct{ Message string }

func (e *UnauthorizedError) Error() string { return e.Message }
