import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login']
const IGNORED_ROUTES = ['/api/auth/', '/api/engine/', '/api/track/']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth checks for engine/cron API routes (they have their own CRON_SECRET auth)
  // and for auth callback routes
  if (IGNORED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Refresh session and get user
  const { supabaseResponse, user } = await updateSession(request)

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // If user is not authenticated and trying to access a protected route, redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (user && isPublicRoute) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
