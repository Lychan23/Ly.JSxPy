import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Check if the user is authenticated by verifying the auth token cookie
  const token = req.cookies.get('auth-token');

  if (!token) {
    // If no token, redirect to the login page
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If the token is valid, proceed to the next middleware or route handler
  return NextResponse.next();
}

// Specify the paths where the middleware should be applied
export const config = {
  matcher: ['/control-panel/:path*'],
};
