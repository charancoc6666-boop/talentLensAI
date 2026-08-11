import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.AUTH_SECRET || 'talentlens_jwt_secret_super_secure_key_123456';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string; // "HR" | "APPLICANT"
  orgId?: string; // Recruiter's organization ID
  orgRole?: string; // "ADMIN" | "RECRUITER" | "REVIEWER"
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    console.error('verifyToken error in auth.ts:', error);
    return null;
  }
}

export async function getSession(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res: NextResponse, session: UserSession): NextResponse {
  const token = signToken(session);
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return res;
}

export async function authenticate(req: NextRequest): Promise<UserSession> {
  const session = await getSession(req);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function authenticateRecruiter(req: NextRequest): Promise<UserSession & { orgId: string }> {
  const session = await authenticate(req);
  if (session.role !== 'HR' || !session.orgId) {
    throw new Error('Forbidden: Recruiter access required');
  }
  return session as UserSession & { orgId: string };
}
