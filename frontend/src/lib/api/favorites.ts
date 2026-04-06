import { request } from './client'
import type { FavoriteResponse } from './types/favorites'

export const favorites = {
  list: () =>
    request<FavoriteResponse[]>('/api/v1/favorites'),

  add: (productId: number) =>
    request<{ product_id: number }>(`/api/v1/favorites/${productId}`, { method: 'POST' }),

  remove: (productId: number) =>
    request<{ message: string }>(`/api/v1/favorites/${productId}`, { method: 'DELETE' }),
}
