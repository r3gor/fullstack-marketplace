package application

import (
	"context"
	"strings"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/application/dto"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/domain"
	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
)

type UserService struct {
	users       port.UserRepository
	auditLogger port.AuditLogger
}

func NewUserService(users port.UserRepository, audit port.AuditLogger) *UserService {
	return &UserService{users: users, auditLogger: audit}
}

func (s *UserService) GetMe(ctx context.Context, userID string) (domain.User, error) {
	return s.users.GetByID(ctx, userID)
}

func (s *UserService) UpdateMe(ctx context.Context, userID string, req dto.UpdateUserRequest) (domain.User, error) {
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if err := domain.ValidateUserInput(req.Name, req.Email); err != nil {
		return domain.User{}, err
	}

	updated, err := s.users.Update(ctx, userID, req.Name, req.Email)
	if err != nil {
		return domain.User{}, err
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "user_updated",
		PerformedBy: userID,
		Target:      userID,
	})

	return updated, nil
}
