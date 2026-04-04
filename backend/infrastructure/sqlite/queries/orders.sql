-- name: CreateOrder :one
INSERT INTO orders (id, user_id, total_amount, status)
VALUES (?, ?, ?, ?)
RETURNING *;

-- name: GetOrderByID :one
SELECT * FROM orders WHERE id = ? LIMIT 1;

-- name: GetOrderByIDAndUserID :one
SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1;

-- name: ListOrdersByUserID :many
SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC;

-- name: UpdateOrderStatus :one
UPDATE orders
SET status = ?, updated_at = datetime('now')
WHERE id = ?
RETURNING *;
