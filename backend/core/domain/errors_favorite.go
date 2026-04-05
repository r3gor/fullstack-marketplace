package domain

// Favorites domain errors.

func ErrAlreadyFavorite() *AppError {
	return &AppError{Code: "favorite.already_added", Message: "product is already in favorites"}
}
