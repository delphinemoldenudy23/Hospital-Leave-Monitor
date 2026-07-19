import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/login',
  '/register',
  '/admin/login',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '') || 
                '';

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // If user is already logged in and on login/register, redirect to appropriate dashboard
    if ((pathname === '/login' || pathname === '/register') && token) {
      // We can't check role in middleware without decoding JWT,
      // so we'll let client-side handle re-routing from login/register pages
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Protected routes - require token
  if (!token) {
    // Redirect admin routes to admin login, others to regular login
    const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
    const loginUrl = new URL(loginPath, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|workbox-*).*)',
  ],
};