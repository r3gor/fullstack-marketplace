package application

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users         port.UserRepository
	tokens        port.RefreshTokenRepository
	auditLogger   port.AuditLogger
	refreshExpiry time.Duration
}

func NewAuthService(
	users port.UserRepository,
	tokens port.RefreshTokenRepository,
	audit port.AuditLogger,
	refreshExpiry time.Duration,
) *AuthService {
	return &AuthService{
		users:         users,
		tokens:        tokens,
		auditLogger:   audit,
		refreshExpiry: refreshExpiry,
	}
}

func (s *AuthService) Register(ctx context.Context, req dto.RegisterRequest) (domain.User, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if err := domain.ValidateUserInput(req.Name, req.Email); err != nil {
		return domain.User{}, err
	}
	if len(req.Password) < 8 {
		return domain.User{}, domain.ErrPasswordTooShort(8)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return domain.User{}, fmt.Errorf("failed to hash password: %w", err)
	}

	user := domain.User{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
	}

	created, err := s.users.Create(ctx, user)
	if err != nil {
		return domain.User{}, err
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "user_registered",
		PerformedBy: created.ID,
		Target:      created.ID,
	})

	return created, nil
}

func (s *AuthService) Login(ctx context.Context, req dto.LoginRequest) (domain.User, string, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		// Always return the same message to avoid user enumeration
		return domain.User{}, "", domain.ErrInvalidCredentials()
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return domain.User{}, "", domain.ErrInvalidCredentials()
	}

	refreshToken, err := s.createRefreshToken(ctx, user.ID)
	if err != nil {
		return domain.User{}, "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "user_logged_in",
		PerformedBy: user.ID,
		Target:      user.ID,
	})

	return user, refreshToken, nil
}

func (s *AuthService) Logout(ctx context.Context, rawRefreshToken, userID string) error {
	if rawRefreshToken != "" {
		hash := HashToken(rawRefreshToken)
		_ = s.tokens.DeleteByHash(ctx, hash)
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "user_logged_out",
		PerformedBy: userID,
		Target:      userID,
	})

	return nil
}

func (s *AuthService) Refresh(ctx context.Context, rawToken string) (domain.User, string, error) {
	if rawToken == "" {
		return domain.User{}, "", domain.ErrRefreshTokenRequired()
	}

	hash := HashToken(rawToken)

	stored, err := s.tokens.GetByHash(ctx, hash)
	if err != nil {
		return domain.User{}, "", domain.ErrInvalidRefreshToken()
	}

	// Rotate: delete old token before issuing new one
	if err := s.tokens.DeleteByHash(ctx, hash); err != nil {
		return domain.User{}, "", fmt.Errorf("failed to invalidate old token: %w", err)
	}

	user, err := s.users.GetByID(ctx, stored.UserID)
	if err != nil {
		return domain.User{}, "", err
	}

	newToken, err := s.createRefreshToken(ctx, user.ID)
	if err != nil {
		return domain.User{}, "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	return user, newToken, nil
}

func (s *AuthService) createRefreshToken(ctx context.Context, userID string) (string, error) {
	raw, err := generateSecureToken()
	if err != nil {
		return "", err
	}

	token := port.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    userID,
		TokenHash: HashToken(raw),
		ExpiresAt: time.Now().Add(s.refreshExpiry),
	}

	if _, err := s.tokens.Create(ctx, token); err != nil {
		return "", err
	}

	return raw, nil
}

func generateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate secure token: %w", err)
	}
	return hex.EncodeToString(b), nil
}

// HashToken produces a SHA-256 hex digest. Exported for use in repositories.
func HashToken(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}
