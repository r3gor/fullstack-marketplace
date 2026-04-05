package domain

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

// NewInternalError wraps an unexpected infrastructure or technical failure.
// The cause is preserved in Err so ErrorHandler can log it.
func NewInternalError(cause error) *AppError {
	return &AppError{Code: "internal_server_error", Message: "an unexpected error occurred", Err: cause}
}
