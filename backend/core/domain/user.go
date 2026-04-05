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
		return ErrInvalidName(2, 100)
	}
	if !emailRegex.MatchString(email) {
		return ErrInvalidEmail()
	}
	return nil
}
