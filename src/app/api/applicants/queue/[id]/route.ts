import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { authenticateRecruiter } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateRecruiter(req);
    const { id } = await params;

    const bgJob = await prisma.backgroundJob.findUnique({
      where: { id },
      include: {
        job: true
      }
    });

    if (!bgJob) {
      return NextResponse.json({ error: 'Background job not found' }, { status: 404 });
    }

    // Verify tenant organization isolation
    if (bgJob.job.organizationId !== session.orgId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    return NextResponse.json({
      id: bgJob.id,
      status: bgJob.status,
      totalItems: bgJob.totalItems,
      completedItems: bgJob.completedItems,
      failedItems: bgJob.failedItems,
      errorMessage: bgJob.errorMessage,
      updatedAt: bgJob.updatedAt
    });
  } catch (e: any) {
    console.error('Queue Status API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
