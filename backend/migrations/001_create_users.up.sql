CREATE TABLE IF NOT EXISTS users (
    id            TEXT     PRIMARY KEY,
    name          TEXT     NOT NULL,
    email         TEXT     NOT NULL UNIQUE,
    password_hash TEXT     NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);
