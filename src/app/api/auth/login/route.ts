import { NextRequest, NextResponse } from 'next/server';
import { signToken, validateCredentials, COOKIE_NAME, SESSION_HOURS } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password || !validateCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await signToken(username);
  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_HOURS * 60 * 60,
    path: '/',
  });

  return response;
}
