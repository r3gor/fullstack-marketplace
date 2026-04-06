import { cookies } from 'next/headers'
import { request } from './client'
import type { UserResponse } from './types/auth'
import type { OrderResponse } from './types/orders'
import type { FavoriteResponse } from './types/favorites'

// Forwards the request cookies to the backend for server-side fetches (RSC).
async function cookieHeader(): Promise<HeadersInit> {
  const cookieStore = await cookies()
  return { Cookie: cookieStore.toString() }
}

export const serverUser = {
  me: async () => {
    const headers = await cookieHeader()
    return request<UserResponse>('/api/v1/users/me', { headers })
  },
}

export const serverFavorites = {
  list: async () => {
    const headers = await cookieHeader()
    return request<FavoriteResponse[]>('/api/v1/favorites', { headers })
  },
}

export const serverOrders = {
  list: async () => {
    const headers = await cookieHeader()
    return request<OrderResponse[]>('/api/v1/orders', { headers })
  },

  get: async (id: string) => {
    const headers = await cookieHeader()
    return request<OrderResponse>(`/api/v1/orders/${id}`, { headers })
  },
}
