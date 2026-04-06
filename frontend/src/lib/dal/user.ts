import { cache } from 'react'
import { serverRequest } from './_request'
import type { UserResponse } from '@/lib/api/types'

export const getMe = cache(async () =>
  serverRequest<UserResponse>('/api/v1/users/me'),
)
