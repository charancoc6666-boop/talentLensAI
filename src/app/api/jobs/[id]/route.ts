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

    const job = await prisma.job.findFirst({
      where: {
        id,
        organizationId: session.orgId,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (e: any) {
    console.error('GET Job Detail API Error:', e);
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateRecruiter(req);
    const { id } = await params;
    const body = await req.json();

    const job = await prisma.job.findFirst({
      where: {
        id,
        organizationId: session.orgId,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Process requirements fields (ensure they are strings if objects are sent)
    const requirements = body.requirements ? (typeof body.requirements === 'string' ? body.requirements : JSON.stringify(body.requirements)) : undefined;
    const preferredSkills = body.preferredSkills ? (typeof body.preferredSkills === 'string' ? body.preferredSkills : JSON.stringify(body.preferredSkills)) : undefined;
    const responsibilities = body.responsibilities ? (typeof body.responsibilities === 'string' ? body.responsibilities : JSON.stringify(body.responsibilities)) : undefined;

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : job.title,
        description: body.description !== undefined ? body.description : job.description,
        department: body.department !== undefined ? body.department : job.department,
        location: body.location !== undefined ? body.location : job.location,
        employmentType: body.employmentType !== undefined ? body.employmentType : job.employmentType,
        salaryRange: body.salaryRange !== undefined ? body.salaryRange : job.salaryRange,
        experience: body.experience !== undefined ? body.experience : job.experience,
        education: body.education !== undefined ? body.education : job.education,
        certifications: body.certifications !== undefined ? body.certifications : job.certifications,
        requirements: requirements !== undefined ? requirements : job.requirements,
        preferredSkills: preferredSkills !== undefined ? preferredSkills : job.preferredSkills,
        responsibilities: responsibilities !== undefined ? responsibilities : job.responsibilities,
        status: body.status !== undefined ? body.status : job.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: session.orgId,
        userId: session.userId,
        action: 'JOB_UPDATED',
        details: `Updated settings/requirements for job posting "${updatedJob.title}"`,
      },
    });

    return NextResponse.json({ job: updatedJob });
  } catch (e: any) {
    console.error('PUT Job API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateRecruiter(req);
    const { id } = await params;

    const job = await prisma.job.findFirst({
      where: {
        id,
        organizationId: session.orgId,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await prisma.job.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: session.orgId,
        userId: session.userId,
        action: 'JOB_DELETED',
        details: `Deleted job posting "${job.title}"`,
      },
    });

    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (e: any) {
    console.error('DELETE Job API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
