import { NextResponse, type NextRequest } from 'next/server'

// Auth middleware disabled — using demo mode per project requirements.
// All routes are accessible without authentication.
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/registro',
  ],
}
