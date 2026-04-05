package domain

import "fmt"

// Review domain errors.

// ErrInvalidRating is returned when the submitted rating is outside the allowed range.
func ErrInvalidRating(min, max int) *AppError {
	return &AppError{
		Code:    "review.invalid_rating",
		Message: fmt.Sprintf("rating must be between %d and %d", min, max),
	}
}

// ErrCommentTooShort is returned when the review comment is below the minimum length.
func ErrCommentTooShort(min int) *AppError {
	return &AppError{
		Code:    "review.comment_too_short",
		Message: fmt.Sprintf("comment must be at least %d characters", min),
	}
}

// ErrCommentTooLong is returned when the review comment exceeds the maximum length.
func ErrCommentTooLong(max int) *AppError {
	return &AppError{
		Code:    "review.comment_too_long",
		Message: fmt.Sprintf("comment must be at most %d characters", max),
	}
}

func ErrProductNotPurchased() *AppError {
	return &AppError{
		Code:    "review.product_not_purchased",
		Message: "you must purchase this product before leaving a review",
	}
}

func ErrReviewAlreadySubmitted() *AppError {
	return &AppError{Code: "review.already_submitted", Message: "you have already reviewed this product"}
}
