import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });

  const response = NextResponse.redirect(new URL('/client/auth', request.url));

  response.cookies.set('next-auth.session-token', '', {
    expires: new Date(0),
    path: '/',
  });

  response.cookies.set('__Secure-next-auth.session-token', '', {
    expires: new Date(0),
    path: '/',
    secure: true,
  });

  return response;
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });

  const response = NextResponse.json({ success: true });

  response.cookies.set('next-auth.session-token', '', {
    expires: new Date(0),
    path: '/',
  });

  response.cookies.set('__Secure-next-auth.session-token', '', {
    expires: new Date(0),
    path: '/',
    secure: true,
  });

  return response;
}
