package domain

// Favorites domain errors.

func ErrAlreadyFavorite() *AppError {
	return NewConflictError("product is already in favorites")
}
