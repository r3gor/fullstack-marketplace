export interface OrderItemResponse {
  id: string
  product_id: number
  quantity: number
  price_at_purchase: number
}

export interface OrderResponse {
  id: string
  total_amount: number
  status: string
  items: OrderItemResponse[]
  created_at: string
}

export interface CreateOrderRequest {
  items: {
    product_id: number
    quantity: number
    price_at_purchase: number
  }[]
}
