package domain

import "fmt"

// User and authentication domain errors.

func ErrUserNotFound() *AppError {
	return &AppError{Code: "user.not_found", Message: "user not found"}
}

func ErrEmailAlreadyInUse() *AppError {
	return &AppError{Code: "user.email_already_in_use", Message: "email already in use"}
}

// ErrInvalidName is returned when the user's name does not meet length requirements.
func ErrInvalidName(min, max int) *AppError {
	return &AppError{
		Code:    "user.invalid_name",
		Message: fmt.Sprintf("name must be between %d and %d characters", min, max),
	}
}

func ErrInvalidEmail() *AppError {
	return &AppError{Code: "user.invalid_email", Message: "invalid email address"}
}

// ErrPasswordTooShort is returned when the password is shorter than the minimum length.
func ErrPasswordTooShort(min int) *AppError {
	return &AppError{
		Code:    "user.password_too_short",
		Message: fmt.Sprintf("password must be at least %d characters", min),
	}
}

// ErrInvalidCredentials is returned for both "email not found" and "wrong password"
// to prevent user enumeration attacks.
func ErrInvalidCredentials() *AppError {
	return &AppError{Code: "user.invalid_credentials", Message: "invalid email or password"}
}

func ErrRefreshTokenRequired() *AppError {
	return &AppError{Code: "user.refresh_token_required", Message: "refresh token required"}
}

func ErrInvalidRefreshToken() *AppError {
	return &AppError{Code: "user.invalid_refresh_token", Message: "invalid or expired refresh token"}
}
