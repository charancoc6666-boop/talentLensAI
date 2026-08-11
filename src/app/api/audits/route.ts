import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { authenticateRecruiter } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRecruiter(req);

    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: session.orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Capped for performance
    });

    return NextResponse.json({ logs });
  } catch (e: any) {
    console.error('Audit Logs API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
