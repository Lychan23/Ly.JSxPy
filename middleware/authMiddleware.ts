<<<<<<< HEAD
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token');

  if (!token && !req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/app/dashboard/:path*', '/dashboard', '/app/dashboard', '/:path*'],
};
=======
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token');

  if (!token && !req.nextUrl.pathname.startsWith('/login') && !req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/app/dashboard/:path*', '/dashboard', '/app/dashboard', '/:path*'],
};
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
