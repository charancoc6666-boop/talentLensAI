import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { authenticate } from '@/lib/auth';

/**
 * GET /api/applicants/me
 * Retrieve the currently logged-in applicant's profile and their application statuses.
 * Scoped by the applicant's userId.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await authenticate(req);
    
    if (session.role !== 'APPLICANT') {
      return NextResponse.json({ error: 'Applicant access required' }, { status: 403 });
    }

    // Find the applicant record linked to this user
    const applicant = await prisma.applicant.findFirst({
      where: { userId: session.userId },
      include: {
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                department: true,
                location: true,
                salaryRange: true,
                organization: {
                  select: { name: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!applicant) {
      // Return empty profile — applicant hasn't submitted anything yet
      return NextResponse.json({
        profile: {
          name: session.name,
          email: session.email,
          phone: null,
          location: null,
          githubUrl: null,
          portfolioUrl: null,
          resumeUrl: null,
        },
        applications: []
      });
    }

    return NextResponse.json({
      profile: {
        id: applicant.id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        location: applicant.location,
        githubUrl: applicant.githubUrl,
        portfolioUrl: applicant.portfolioUrl,
        resumeUrl: applicant.resumeUrl,
      },
      applications: applicant.applications.map(app => ({
        id: app.id,
        jobTitle: app.job.title,
        department: app.job.department,
        company: app.job.organization.name,
        location: app.job.location,
        salaryRange: app.job.salaryRange,
        status: app.status,
        jobMatchScore: app.jobMatchScore,
        atsScore: app.atsScore,
        strengths: app.strengths,
        gaps: app.gaps,
        aiSummary: app.aiSummary,
        appliedAt: app.createdAt,
      }))
    });
  } catch (e: any) {
    console.error('GET Applicant Profile Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/applicants/me
 * Update the currently logged-in applicant's profile details.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await authenticate(req);
    
    if (session.role !== 'APPLICANT') {
      return NextResponse.json({ error: 'Applicant access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, location, githubUrl, portfolioUrl } = body;

    // Find or create the applicant record
    let applicant = await prisma.applicant.findFirst({
      where: { userId: session.userId }
    });

    if (!applicant) {
      applicant = await prisma.applicant.create({
        data: {
          userId: session.userId,
          name: name || session.name,
          email: session.email,
          phone: phone || null,
          location: location || null,
          githubUrl: githubUrl || null,
          portfolioUrl: portfolioUrl || null,
        }
      });
    } else {
      applicant = await prisma.applicant.update({
        where: { id: applicant.id },
        data: {
          name: name !== undefined ? name : applicant.name,
          phone: phone !== undefined ? phone : applicant.phone,
          location: location !== undefined ? location : applicant.location,
          githubUrl: githubUrl !== undefined ? githubUrl : applicant.githubUrl,
          portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : applicant.portfolioUrl,
        }
      });
    }

    return NextResponse.json({ profile: applicant, message: 'Profile updated successfully.' });
  } catch (e: any) {
    console.error('PUT Applicant Profile Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
