import { request } from './client'
import type { OrderResponse, CreateOrderRequest } from './types/orders'

export const orders = {
  list: () =>
    request<OrderResponse[]>('/api/v1/orders'),

  get: (id: string) =>
    request<OrderResponse>(`/api/v1/orders/${id}`),

  create: (body: CreateOrderRequest) =>
    request<OrderResponse>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
