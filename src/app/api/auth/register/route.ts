import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/db/prisma';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, orgName } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required registration fields' },
        { status: 400 }
      );
    }

    if (role !== 'HR' && role !== 'APPLICANT') {
      return NextResponse.json(
        { error: 'Invalid role. Must be HR or APPLICANT' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    let newUser;
    let orgId: string | undefined;
    let orgRole: string | undefined;

    if (role === 'HR') {
      if (!orgName) {
        return NextResponse.json(
          { error: 'Organization name is required for recruiters' },
          { status: 400 }
        );
      }

      // Create Org, User, and Member in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { name: orgName },
        });

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: 'HR',
          },
        });

        const member = await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: user.id,
            role: 'ADMIN',
          },
        });

        // Seed audit log
        await tx.auditLog.create({
          data: {
            organizationId: organization.id,
            userId: user.id,
            action: 'ORGANIZATION_CREATED',
            details: `Registered organization "${orgName}" under admin "${name}"`,
          },
        });

        return { user, orgId: organization.id, orgRole: member.role };
      });

      newUser = result.user;
      orgId = result.orgId;
      orgRole = result.orgRole;
    } else {
      // Applicant
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: 'APPLICANT',
          },
        });

        await tx.applicant.create({
          data: {
            userId: user.id,
            name,
            email,
          },
        });

        return user;
      });

      newUser = result;
    }

    // Create session
    const session = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      orgId,
      orgRole,
    };

    const res = NextResponse.json(
      { message: 'Registration successful', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } },
      { status: 201 }
    );
    
    return setSessionCookie(res, session);
  } catch (e: any) {
    console.error('Registration API error:', e);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
