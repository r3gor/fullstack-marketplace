package domain

import "fmt"

// User and authentication domain errors.

func ErrUserNotFound() *AppError {
	return NewNotFoundError("user")
}

func ErrEmailAlreadyInUse() *AppError {
	return NewConflictError("email already in use")
}

// ErrInvalidName is returned when the user's name does not meet length requirements.
func ErrInvalidName(min, max int) *AppError {
	return NewValidationError(fmt.Sprintf("name must be between %d and %d characters", min, max))
}

func ErrInvalidEmail() *AppError {
	return NewValidationError("invalid email address")
}

// ErrPasswordTooShort is returned when the password is shorter than the minimum length.
func ErrPasswordTooShort(min int) *AppError {
	return NewValidationError(fmt.Sprintf("password must be at least %d characters", min))
}

// ErrInvalidCredentials is returned for both "email not found" and "wrong password"
// to prevent user enumeration attacks.
func ErrInvalidCredentials() *AppError {
	return NewUnauthorizedError("invalid email or password")
}

func ErrRefreshTokenRequired() *AppError {
	return NewUnauthorizedError("refresh token required")
}

func ErrInvalidRefreshToken() *AppError {
	return NewUnauthorizedError("invalid or expired refresh token")
}
