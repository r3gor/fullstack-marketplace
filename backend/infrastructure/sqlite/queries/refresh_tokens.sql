-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
VALUES (?, ?, ?, ?)
RETURNING *;

-- name: GetRefreshToken :one
SELECT * FROM refresh_tokens
WHERE token_hash = ? AND expires_at > datetime('now')
LIMIT 1;

-- name: DeleteRefreshToken :exec
DELETE FROM refresh_tokens WHERE token_hash = ?;

-- name: DeleteUserRefreshTokens :exec
DELETE FROM refresh_tokens WHERE user_id = ?;

-- name: DeleteExpiredRefreshTokens :exec
DELETE FROM refresh_tokens WHERE expires_at <= datetime('now');
