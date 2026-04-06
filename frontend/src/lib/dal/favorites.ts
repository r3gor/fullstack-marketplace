import { cache } from 'react'
import { serverRequest } from './_request'
import type { FavoriteResponse } from '@/lib/api/types'

export const getFavorites = cache(async () =>
  serverRequest<FavoriteResponse[]>('/api/v1/favorites'),
)
