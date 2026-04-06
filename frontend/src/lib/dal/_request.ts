import { cookies } from 'next/headers'
import { request } from '@/lib/api/client'

export async function serverRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies()
  return request<T>(path, {
    ...options,
    headers: {
      Cookie: cookieStore.toString(),
      ...options.headers,
    },
  })
}
