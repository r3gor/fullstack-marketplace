package port

import "context"

type AuditEvent struct {
	Event       string
	PerformedBy string
	Target      string
	Details     map[string]string
}

type AuditLogger interface {
	Record(ctx context.Context, event AuditEvent)
}
