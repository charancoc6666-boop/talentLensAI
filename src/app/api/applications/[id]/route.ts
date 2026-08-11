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

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        applicant: true,
        job: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    // Verify tenant organization isolation
    if (application.job.organizationId !== session.orgId) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (e: any) {
    console.error('GET Application Detail API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateRecruiter(req);
    const { id } = await params;
    const { status, recruiterNotes } = await req.json();

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        applicant: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    // Verify tenant isolation
    if (application.job.organizationId !== session.orgId) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const oldStatus = application.status;

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: status !== undefined ? status : application.status,
        recruiterNotes: recruiterNotes !== undefined ? recruiterNotes : application.recruiterNotes,
      }
    });

    // Write audit trail
    if (status && status !== oldStatus) {
      await prisma.auditLog.create({
        data: {
          organizationId: session.orgId,
          userId: session.userId,
          action: 'APPLICATION_STAGE_CHANGED',
          details: `Moved candidate "${application.applicant.name}" from status "${oldStatus}" to "${status}" for job "${application.job.title}"`,
        }
      });
    }

    if (recruiterNotes !== undefined && recruiterNotes !== application.recruiterNotes) {
      await prisma.auditLog.create({
        data: {
          organizationId: session.orgId,
          userId: session.userId,
          action: 'RECRUITER_NOTES_UPDATED',
          details: `Updated private recruiter notes for candidate "${application.applicant.name}"`,
        }
      });
    }

    return NextResponse.json({
      message: 'Application updated successfully.',
      application: updatedApplication
    });
  } catch (e: any) {
    console.error('PUT Application API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
