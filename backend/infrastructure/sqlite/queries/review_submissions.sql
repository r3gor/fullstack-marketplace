-- name: CreateReviewSubmission :exec
INSERT INTO review_submissions (user_id, product_id, strapi_review_id)
VALUES (?, ?, ?);

-- name: ExistsReviewSubmission :one
SELECT COUNT(*) as count FROM review_submissions
WHERE user_id = ? AND product_id = ?
LIMIT 1;
