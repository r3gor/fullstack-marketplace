CREATE TABLE IF NOT EXISTS order_items (
    id                TEXT    PRIMARY KEY,
    order_id          TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id        INTEGER NOT NULL,
    quantity          INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase REAL    NOT NULL
);
