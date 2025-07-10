// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { envConfigServer } from '@/config/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: envConfigServer.nextAuthSecret || 'fallback-secret-for-build',
    secureCookie: request.nextUrl.protocol === 'https:',
  });
  const { pathname } = request.nextUrl;

  if (token?.error && (token.error === 'UserNotFound' || token.error === 'InvalidToken')) {
    return NextResponse.redirect(new URL('/client/auth', request.url));
  }

  // Allow access to invitation signup flow without authentication
  const invitationSignupRoutes = [
    '/client/auth/signup',
    '/client/personal-details',
    '/client/medical-details',
    '/client/response-sent',
  ];

  const isInvitationSignupRoute = invitationSignupRoutes.some((route) => pathname.startsWith(route));

  if (isInvitationSignupRoute) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/practitioner') && !pathname.includes('/auth')) {
    if (!token) {
      return NextResponse.redirect(new URL('/practitioner/auth', request.url));
    }
    if (token.role !== 'PRACTITIONER') {
      return NextResponse.redirect(new URL('/client/auth', request.url));
    }
  }

  if (pathname.startsWith('/client') && !pathname.includes('/auth')) {
    if (!token) {
      return NextResponse.redirect(new URL('/client/auth', request.url));
    }
    if (token.role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/practitioner/auth', request.url));
    }

    // Handle client status-based redirects for authenticated clients
    // Don't redirect users who are on intake-related pages (intake, response-sent)
    // as they might be in the middle of completing the intake flow
    const isOnIntakeFlow = pathname.includes('/intake') || pathname.includes('/response-sent');

    // Also don't redirect if they have a token in the URL (likely coming from intake flow)
    const hasToken = request.nextUrl.searchParams.has('token');

    // Check referrer to see if user is coming from response-sent or intake pages
    const referrer = request.headers.get('referer') || '';
    const isFromIntakeFlow = referrer.includes('/client/response-sent') || referrer.includes('/client/intake');

    // If user is going to main dashboard (/client) and coming from intake flow, allow it regardless of status
    // This handles the case where the session token hasn't been updated yet but they just completed intake
    const isGoingToDashboard = pathname === '/client';
    const allowDashboardFromIntake = isGoingToDashboard && isFromIntakeFlow;

    if (token.clientStatus === 'NEEDS_INTAKE' && !isOnIntakeFlow && !hasToken && !allowDashboardFromIntake) {
      return NextResponse.redirect(new URL('/client/intake', request.url));
    }
  }

  const publicRoutes = ['/', '/practitioner/auth', '/client/auth', '/auth', '/invitations/token'];

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (!isPublicRoute && !token) {
    if (pathname.startsWith('/practitioner')) {
      return NextResponse.redirect(new URL('/practitioner/auth', request.url));
    }
    return NextResponse.redirect(new URL('/client/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
