package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL          string
	JWTSecret            string
	JWTExpiry            time.Duration
	RefreshTokenExpiry   time.Duration
	StrapiAPIURL         string
	StrapiAPIToken       string
	Port                 string
	Env                  string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	jwtExpiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "15m"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRY: %w", err)
	}

	refreshExpiry, err := time.ParseDuration(getEnv("REFRESH_TOKEN_EXPIRY", "168h"))
	if err != nil {
		return nil, fmt.Errorf("invalid REFRESH_TOKEN_EXPIRY: %w", err)
	}

	return &Config{
		DatabaseURL:        getEnv("DATABASE_URL", "./data/ecommerce.db"),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		JWTExpiry:          jwtExpiry,
		RefreshTokenExpiry: refreshExpiry,
		StrapiAPIURL:       getEnv("STRAPI_API_URL", "http://localhost:1337"),
		StrapiAPIToken:     getEnv("STRAPI_API_TOKEN", ""),
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("ENV", "development"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
