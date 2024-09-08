<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const acceptedCookies = req.cookies.get('accepted_cookies');
  if (!acceptedCookies) {
    const response = NextResponse.next();
    response.cookies.set('accepted_cookies', 'false', { path: '/' });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
=======
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const acceptedCookies = req.cookies.get('accepted_cookies');
  if (!acceptedCookies) {
    const response = NextResponse.next();
    response.cookies.set('accepted_cookies', 'false', { path: '/' });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
