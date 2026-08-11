import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { authenticateRecruiter } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRecruiter(req);
    const { searchParams } = req.nextUrl;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId search parameter is required.' },
        { status: 400 }
      );
    }

    // Verify job belongs to this recruiter's org
    const job = await prisma.job.findFirst({
      where: { id: jobId, organizationId: session.orgId }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const statusFilter = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';
    const minScoreStr = searchParams.get('minScore');
    const minScore = minScoreStr ? parseInt(minScoreStr, 10) : undefined;

    // Fetch applications matching criteria
    const applications = await prisma.application.findMany({
      where: {
        jobId,
        status: statusFilter,
        jobMatchScore: minScore ? { gte: minScore } : undefined,
        applicant: search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { location: { contains: search } },
          ]
        } : undefined
      },
      include: {
        applicant: true
      },
      orderBy: [
        { jobMatchScore: 'desc' }, // Higher scores first
        { atsScore: 'desc' }
      ]
    });

    return NextResponse.json({ applications });
  } catch (e: any) {
    console.error('GET Applications API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
