package logger

import (
	"context"
	"log/slog"
	"os"

	"github.com/rogerramosparedes/fullstack-ecommerce/backend/core/port"
)

const correlationIDKey = "correlation_id"

// AuditLogger implements port.AuditLogger using structured slog output.
// Records business events — not technical logs.
type AuditLogger struct {
	log *slog.Logger
}

func NewAuditLogger() *AuditLogger {
	return &AuditLogger{
		log: slog.New(slog.NewJSONHandler(os.Stdout, nil)),
	}
}

func (l *AuditLogger) Record(ctx context.Context, event port.AuditEvent) {
	args := []any{
		"event", event.Event,
		"performed_by", event.PerformedBy,
		"target", event.Target,
	}

	if corrID, ok := ctx.Value(correlationIDKey).(string); ok && corrID != "" {
		args = append(args, correlationIDKey, corrID)
	}

	for k, v := range event.Details {
		args = append(args, k, v)
	}

	l.log.InfoContext(ctx, "audit", args...)
}
