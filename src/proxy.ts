import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { Role } from '@/types'
import { VALID_ROLES } from '@/types'

function generateNonce() {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

const isDev = process.env.NODE_ENV === 'development'

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce()

  // Pass nonce to Server Components via request header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  let finalResponse: NextResponse

  if (!user && pathname.startsWith('/dashboard')) {
    finalResponse = NextResponse.redirect(new URL('/login', request.url))
  } else if (user && pathname === '/login') {
    const rawRole = user.user_metadata?.role
    const role: Role = VALID_ROLES.includes(rawRole) ? rawRole : 'client'
    finalResponse = NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  } else {
    finalResponse = NextResponse.next({ request: { headers: requestHeaders } })
    // Copy Supabase session cookies from updateSession response
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie)
    })
  }

  finalResponse.headers.set('Content-Security-Policy', buildCsp(nonce))
  return finalResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
