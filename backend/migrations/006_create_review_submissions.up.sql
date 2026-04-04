CREATE TABLE IF NOT EXISTS review_submissions (
    user_id          TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id       INTEGER NOT NULL,
    strapi_review_id TEXT    NOT NULL,
    submitted_at     DATETIME NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, product_id)
);
