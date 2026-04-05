package application

import (
	"context"
	"strconv"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
)

type FavoriteService struct {
	favorites   port.FavoriteRepository
	auditLogger port.AuditLogger
}

func NewFavoriteService(favorites port.FavoriteRepository, audit port.AuditLogger) *FavoriteService {
	return &FavoriteService{favorites: favorites, auditLogger: audit}
}

func (s *FavoriteService) List(ctx context.Context, userID string) ([]port.Favorite, error) {
	return s.favorites.List(ctx, userID)
}

func (s *FavoriteService) Add(ctx context.Context, userID string, productID int64) error {
	if err := s.favorites.Add(ctx, userID, productID); err != nil {
		return err
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "favorite_added",
		PerformedBy: userID,
		Target:      strconv.FormatInt(productID, 10),
	})

	return nil
}

func (s *FavoriteService) Remove(ctx context.Context, userID string, productID int64) error {
	if err := s.favorites.Remove(ctx, userID, productID); err != nil {
		return err
	}

	s.auditLogger.Record(ctx, port.AuditEvent{
		Event:       "favorite_removed",
		PerformedBy: userID,
		Target:      strconv.FormatInt(productID, 10),
	})

	return nil
}
