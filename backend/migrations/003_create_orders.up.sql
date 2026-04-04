CREATE TABLE IF NOT EXISTS orders (
    id           TEXT     PRIMARY KEY,
    user_id      TEXT     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount REAL     NOT NULL,
    status       TEXT     NOT NULL DEFAULT 'pending',
    created_at   DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at   DATETIME NOT NULL DEFAULT (datetime('now')),
    CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled'))
);
