package infrastructure

import "fmt"

// InfraError wraps a technical infrastructure failure with structured context.
// It signals that an adapter (SQLite, HTTP client, etc.) failed unexpectedly —
// NOT a domain business rule violation.
//
// Implements Unwrap() so errors.As() can still unwrap domain errors beneath it.
type InfraError struct {
	Layer     string // "sqlite", "strapi"
	Operation string // "create_user", "get_order_by_id", "create_review"
	Resource  string // table name ("users") or external resource ("/api/reviews")
	Cause     error
}

func (e *InfraError) Error() string {
	return fmt.Sprintf("[%s] %s on %s: %v", e.Layer, e.Operation, e.Resource, e.Cause)
}

func (e *InfraError) Unwrap() error { return e.Cause }
