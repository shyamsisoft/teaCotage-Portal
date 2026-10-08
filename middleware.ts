import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public Admin & Auth API Routes that do not require an active session cookie
const PUBLIC_ADMIN_ROUTES = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/api/v1/admin/auth/login',
  '/api/v1/admin/auth/forgot-password',
  '/api/v1/admin/auth/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Only intercept /admin dashboard paths & /api/v1/admin APIs
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/v1/admin')) {
    return NextResponse.next();
  }

  // 2. Allow public auth routes & login API endpoints
  if (PUBLIC_ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 3. Check Session Cookie for protected routes
  const sessionToken = request.cookies.get('cms_admin_session')?.value;

  if (!sessionToken) {
    if (pathname.startsWith('/api/v1/admin')) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/v1/admin/:path*'],
};
