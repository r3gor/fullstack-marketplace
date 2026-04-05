package domain

import (
	"regexp"
	"strings"
	"time"
)

type User struct {
	ID           string
	Name         string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func ValidateUserInput(name, email string) error {
	name = strings.TrimSpace(name)
	email = strings.TrimSpace(email)

	if len(name) < 2 || len(name) > 100 {
		return NewValidationError("name must be between 2 and 100 characters")
	}
	if !emailRegex.MatchString(email) {
		return NewValidationError("invalid email address")
	}
	return nil
}
