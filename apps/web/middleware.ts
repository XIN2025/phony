import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    // Handle critical session errors that require immediate redirect
    if (token?.error && (token.error === 'UserNotFound' || token.error === 'InvalidToken')) {
      if (pathname.startsWith('/practitioner/') && !pathname.includes('/auth')) {
        return NextResponse.redirect(new URL('/practitioner/auth', req.url));
      } else if (pathname.startsWith('/client/') && !pathname.includes('/auth')) {
        return NextResponse.redirect(new URL('/client/auth', req.url));
      }
    }
    // Handle role-based routing only for main dashboard routes
    if (token?.role && (pathname === '/practitioner' || pathname === '/client')) {
      const userRole = token.role as string;
      if (pathname === '/client' && userRole !== 'CLIENT') {
        if (userRole === 'PRACTITIONER') {
          return NextResponse.redirect(new URL('/practitioner', req.url));
        } else {
          return NextResponse.redirect(new URL('/client/auth', req.url));
        }
      }
      if (pathname === '/practitioner' && userRole !== 'PRACTITIONER') {
        if (userRole === 'CLIENT') {
          return NextResponse.redirect(new URL('/client', req.url));
        } else {
          return NextResponse.redirect(new URL('/practitioner/auth', req.url));
        }
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Define public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/client/auth',
          '/practitioner/auth',
          '/api/auth',
          '/_next',
          '/favicon.ico',
          '/api/practitioner/invitations/token',
          '/api/practitioner/invitations',
          '/debug-session', // Allow debug page
          '/test-auth', // Allow test page
        ];
        const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route) || pathname === route);
        if (isPublicRoute) {
          return true;
        }
        // For protected routes, require a valid token
        // Backend JWT strategy will handle detailed validation
        if (!token || !token.id || !token.email || !token.role) {
          // For auth pages, allow access even without token (during login process)
          if (pathname.includes('/auth')) {
            return true;
          }
          // Redirect to appropriate auth page based on the route
          if (pathname.startsWith('/practitioner/')) {
            return false; // This will trigger redirect to /practitioner/auth
          } else if (pathname.startsWith('/client/')) {
            return false; // This will trigger redirect to /client/auth
          } else {
            return false; // Default to client auth
          }
        }
        return true;
      },
    },
  },
);
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'],
};
