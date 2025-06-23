import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (token?.error && !pathname.includes('/auth')) {
      if (pathname.startsWith('/practitioner/')) {
        return NextResponse.redirect(new URL('/practitioner/auth', req.url));
      } else if (pathname.startsWith('/client/')) {
        return NextResponse.redirect(new URL('/client/auth', req.url));
      } else {
        return NextResponse.redirect(new URL('/client/auth', req.url));
      }
    }

    if (token?.role) {
      const userRole = token.role as string;

      if (pathname.startsWith('/practitioner/') && userRole !== 'PRACTITIONER') {
        if (userRole === 'CLIENT') {
          return NextResponse.redirect(new URL('/client', req.url));
        } else {
          return NextResponse.redirect(new URL('/practitioner/auth', req.url));
        }
      }

      if (pathname.startsWith('/client/') && userRole !== 'CLIENT') {
        if (userRole === 'PRACTITIONER') {
          return NextResponse.redirect(new URL('/practitioner', req.url));
        } else {
          return NextResponse.redirect(new URL('/client/auth', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        const publicRoutes = ['/', '/client/auth', '/practitioner/auth', '/api/auth', '/_next', '/favicon.ico'];

        const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route) || pathname === route);

        if (isPublicRoute) {
          return true;
        }

        return !!token && !token.error;
      },
    },
  },
);

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'],
};
