import { request } from './client'
import type { RegisterRequest, LoginRequest, UserResponse } from './types/auth'

export const auth = {
  register: (body: RegisterRequest) =>
    request<UserResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: LoginRequest) =>
    request<UserResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<void>('/api/v1/auth/logout', { method: 'POST' }),

  refresh: () =>
    request<UserResponse>('/api/v1/auth/refresh', { method: 'POST' }),
}
