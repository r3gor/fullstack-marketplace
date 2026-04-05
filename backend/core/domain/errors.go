package domain

import "fmt"

// AppError is the single error type used across the entire application.
// All domain and infrastructure errors are expressed as *AppError with a specific Code.
// The ErrorHandler reads Code to produce the HTTP response without needing
// per-type assertions.
type AppError struct {
	Code    string // one of the ErrCode* constants
	Message string // human-readable message sent to the client
	Err     error  // underlying cause (non-nil for internal/infra errors)
}

func (e *AppError) Error() string { return e.Message }
func (e *AppError) Unwrap() error { return e.Err }

// Error code constants — used by ErrorHandler to map to HTTP status codes.
const (
	ErrCodeValidation   = "validation_error"
	ErrCodeNotFound     = "not_found"
	ErrCodeConflict     = "conflict"
	ErrCodeUnauthorized = "unauthorized"
	ErrCodeInternal     = "internal_server_error"
)

func NewValidationError(message string) *AppError {
	return &AppError{Code: ErrCodeValidation, Message: message}
}

func NewNotFoundError(resource string) *AppError {
	return &AppError{Code: ErrCodeNotFound, Message: fmt.Sprintf("%s not found", resource)}
}

func NewConflictError(message string) *AppError {
	return &AppError{Code: ErrCodeConflict, Message: message}
}

func NewUnauthorizedError(message string) *AppError {
	return &AppError{Code: ErrCodeUnauthorized, Message: message}
}

// NewInternalError wraps an unexpected infrastructure or technical failure.
// The cause is preserved in Err so ErrorHandler can log it.
func NewInternalError(cause error) *AppError {
	return &AppError{Code: ErrCodeInternal, Message: "an unexpected error occurred", Err: cause}
}
