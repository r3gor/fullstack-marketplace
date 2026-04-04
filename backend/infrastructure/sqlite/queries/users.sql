-- name: CreateUser :one
INSERT INTO users (id, name, email, password_hash)
VALUES (?, ?, ?, ?)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = ? LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = ? LIMIT 1;

-- name: UpdateUser :one
UPDATE users
SET name = ?, email = ?, updated_at = datetime('now')
WHERE id = ?
RETURNING *;
