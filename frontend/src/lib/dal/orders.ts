import { cache } from 'react'
import { serverRequest } from './_request'
import type { OrderResponse } from '@/lib/api/types'

export const getOrders = cache(async () =>
  serverRequest<OrderResponse[]>('/api/v1/orders'),
)

export const getOrder = cache(async (id: string) =>
  serverRequest<OrderResponse>(`/api/v1/orders/${id}`),
)
