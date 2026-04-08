import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // For now, disable middleware checks to allow navigation
  // The server components will handle auth checks
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/driver/:path*',
    '/collections/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
