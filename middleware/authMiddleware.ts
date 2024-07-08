import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token');
  console.log('auth-token:', token);
  console.log('Pathname:', req.nextUrl.pathname);

  // Redirect to login if not authenticated and trying to access protected routes
  if (!token && !req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/api/')) {
    console.log('Redirecting to login');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/control-panel/:path*', '/app/control-panel/:path*', '/control-panel', '/app/control-panel', '/:path*'],
};
