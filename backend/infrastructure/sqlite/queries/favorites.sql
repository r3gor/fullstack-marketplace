-- name: AddFavorite :exec
INSERT INTO favorites (user_id, product_id) VALUES (?, ?);

-- name: RemoveFavorite :exec
DELETE FROM favorites WHERE user_id = ? AND product_id = ?;

-- name: ListFavoritesByUserID :many
SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC;

-- name: IsFavorite :one
SELECT COUNT(*) as count FROM favorites
WHERE user_id = ? AND product_id = ?
LIMIT 1;
