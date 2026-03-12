import { NextResponse, type NextRequest } from 'next/server';

// Inlined from @asko/shared REFRESH_TOKEN.cookie.name
// to avoid pulling Node.js APIs into Edge Runtime
const REFRESH_TOKEN_COOKIE = 'refreshTkn';

const PROTECTED_PREFIX = '/account';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(PROTECTED_PREFIX)) {
    const hasRefreshToken = request.cookies.has(REFRESH_TOKEN_COOKIE);

    if (!hasRefreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*'],
};
