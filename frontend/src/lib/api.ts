const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ─── Error types ──────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error: string   // semantic code e.g. "user.invalid_credentials"
  message: string // human-readable
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface UserResponse {
  id: string
  name: string
  email: string
}

export interface FavoriteResponse {
  product_id: number
  created_at: string
}

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

// ─── Request types ────────────────────────────────────────────────────────────

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
}

export interface CreateOrderRequest {
  items: {
    product_id: number
    quantity: number
    price_at_purchase: number
  }[]
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // always send cookies (access_token, refresh_token)
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    let code = 'internal_server_error'
    let message = 'An unexpected error occurred'
    try {
      const body: ApiErrorBody = await res.json()
      code = body.error
      message = body.message
    } catch {
      // non-JSON error body — keep defaults
    }
    throw new ApiError(code, message, res.status)
  }

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

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

// ─── User ─────────────────────────────────────────────────────────────────────

export const user = {
  me: () =>
    request<UserResponse>('/api/v1/users/me'),

  update: (body: UpdateUserRequest) =>
    request<UserResponse>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export const favorites = {
  list: () =>
    request<FavoriteResponse[]>('/api/v1/favorites'),

  add: (productId: number) =>
    request<void>(`/api/v1/favorites/${productId}`, { method: 'POST' }),

  remove: (productId: number) =>
    request<void>(`/api/v1/favorites/${productId}`, { method: 'DELETE' }),
}

// ─── Orders ───────────────────────────────────────────────────────────────────

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
