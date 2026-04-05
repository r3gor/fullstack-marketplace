package domain

func ErrInvalidRequestBody() *AppError {
	return &AppError{
		Code:    "request.invalid_body",
		Message: "invalid or malformed request body",
	}
}

func ErrInvalidProductID() *AppError {
	return &AppError{
		Code:    "request.invalid_product_id",
		Message: "invalid product ID",
	}
}
