import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.AUTH_SECRET || 'talentlens_jwt_secret_super_secure_key_123456';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

async function verifyTokenEdge(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload
    const payloadStr = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    // Verify HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(JWT_SECRET);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode signature
    const sigStr = base64UrlDecode(signatureB64);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      data
    );

    return isValid ? payload : null;
  } catch (error) {
    console.error('Edge token verification error:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let API paths, auth routes, and public files bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    // If user is already logged in, redirect them away from login/register to their dashboard
    if (pathname === '/login' || pathname === '/register') {
      const token = request.cookies.get('token')?.value;
      const session = token ? await verifyTokenEdge(token) : null;
      if (session) {
        const dest = session.role === 'HR' ? '/hr/dashboard' : '/applicant/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const session = token ? await verifyTokenEdge(token) : null;

  // Redirect to login if there is no session
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    // Keep track of original destination
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect HR recruiter views
  if (pathname.startsWith('/hr') && session.role !== 'HR') {
    return NextResponse.redirect(new URL('/applicant/dashboard', request.url));
  }

  // Protect Applicant views
  if (pathname.startsWith('/applicant') && session.role !== 'APPLICANT') {
    return NextResponse.redirect(new URL('/hr/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (except /api/auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
