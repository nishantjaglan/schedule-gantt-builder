import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'gantt-auth';
export const SESSION_HOURS = 8;

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || 'dev-secret-replace-in-production-32chars'
  );
}

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { username: payload.username as string };
  } catch {
    return null;
  }
}

export function validateCredentials(username: string, password: string): boolean {
  try {
    const users: Record<string, string> = JSON.parse(process.env.AUTH_USERS || '{}');
    return Object.prototype.hasOwnProperty.call(users, username) && users[username] === password;
  } catch {
    return false;
  }
}
