package logger

import (
	"log/slog"
	"os"
)

// AppLogger is for technical/debugging logs (not business events).
type AppLogger struct {
	log *slog.Logger
}

func NewAppLogger() *AppLogger {
	return &AppLogger{
		log: slog.New(slog.NewJSONHandler(os.Stdout, nil)),
	}
}

func (l *AppLogger) Error(msg string, attrs ...any) {
	l.log.Error(msg, attrs...)
}

func (l *AppLogger) Info(msg string, attrs ...any) {
	l.log.Info(msg, attrs...)
}

func (l *AppLogger) Warn(msg string, attrs ...any) {
	l.log.Warn(msg, attrs...)
}
