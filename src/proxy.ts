import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { Role } from '@/types'
import { VALID_ROLES } from '@/types'

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    const rawRole = user.user_metadata?.role
    const role: Role = VALID_ROLES.includes(rawRole) ? rawRole : 'client'
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
