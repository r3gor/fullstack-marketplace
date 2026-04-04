CREATE TABLE IF NOT EXISTS favorites (
    user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, product_id)
);
