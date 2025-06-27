import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  if (token?.error && (token.error === 'UserNotFound' || token.error === 'InvalidToken')) {
    return NextResponse.redirect(new URL('/client/auth', request.url));
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
