import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/db/prisma';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get active organization membership (if HR)
    let orgId: string | undefined;
    let orgRole: string | undefined;

    if (user.role === 'HR' && user.members.length > 0) {
      const activeMember = user.members[0];
      orgId = activeMember.organizationId;
      orgRole = activeMember.role;
    }

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId,
      orgRole,
    };

    const res = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId,
        orgRole,
      },
    });

    // Audit login for HR users
    if (orgId) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          action: 'USER_LOGIN',
          details: `User "${user.name}" (${user.email}) logged in successfully.`,
        },
      });
    }

    return setSessionCookie(res, session);
  } catch (e: any) {
    console.error('Login API error:', e);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
