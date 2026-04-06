const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export interface ApiErrorBody {
  error: string
  message: string
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

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
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

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
