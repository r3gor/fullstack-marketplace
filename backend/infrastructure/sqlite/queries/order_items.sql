-- name: CreateOrderItem :one
INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase)
VALUES (?, ?, ?, ?, ?)
RETURNING *;

-- name: ListOrderItemsByOrderID :many
SELECT * FROM order_items WHERE order_id = ?;

-- name: ExistsOrderItemByUserAndProduct :one
SELECT COUNT(*) as count FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('paid', 'shipped', 'delivered')
LIMIT 1;
