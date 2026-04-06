import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIX = '/account'
const AUTH_ROUTES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value

  // Redirect unauthenticated users away from protected routes
  if (pathname.startsWith(PROTECTED_PREFIX) && !accessToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.includes(pathname) && accessToken) {
    const redirect = request.nextUrl.searchParams.get('redirect') ?? '/account'
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/login', '/register'],
}
