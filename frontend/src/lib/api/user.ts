import { request } from './client'
import type { UserResponse } from './types/auth'
import type { UpdateUserRequest } from './types/user'

export const user = {
  me: () =>
    request<UserResponse>('/api/v1/users/me'),

  update: (body: UpdateUserRequest) =>
    request<UserResponse>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
}
