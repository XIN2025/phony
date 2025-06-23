import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ valid: false, error: 'Missing userId or email' }, { status: 400 });
    }

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/validate-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      return NextResponse.json({ valid: false, error: 'Backend validation failed' }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json({ valid: result.valid, user: result.user });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
