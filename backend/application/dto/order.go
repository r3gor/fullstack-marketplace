package dto

type OrderItemRequest struct {
	ProductID       int64   `json:"product_id"`
	Quantity        int     `json:"quantity"`
	PriceAtPurchase float64 `json:"price_at_purchase"`
}

type CreateOrderRequest struct {
	Items []OrderItemRequest `json:"items"`
}

type OrderItemResponse struct {
	ID              string  `json:"id"`
	ProductID       int64   `json:"product_id"`
	Quantity        int64   `json:"quantity"`
	PriceAtPurchase float64 `json:"price_at_purchase"`
}

type OrderResponse struct {
	ID          string              `json:"id"`
	TotalAmount float64             `json:"total_amount"`
	Status      string              `json:"status"`
	Items       []OrderItemResponse `json:"items"`
	CreatedAt   string              `json:"created_at"`
}
