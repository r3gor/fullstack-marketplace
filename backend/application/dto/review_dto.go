package dto

type CreateReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

type ReviewResponse struct {
	ProductID int64  `json:"product_id"`
	Rating    int    `json:"rating"`
	Comment   string `json:"comment"`
	Status    string `json:"status"`
}
