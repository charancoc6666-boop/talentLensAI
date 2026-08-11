import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { authenticateRecruiter } from '@/lib/auth';
import AIProvider from '@/services/ai/ai';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRecruiter(req);
    
    // Fetch jobs with application count
    const jobs = await prisma.job.findMany({
      where: { organizationId: session.orgId },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all applications in the organization to calculate KPI aggregates
    const applications = await prisma.application.findMany({
      where: {
        job: { organizationId: session.orgId }
      },
      include: {
        applicant: true,
        job: true
      }
    });

    const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
    const totalApplicants = applications.length;
    const screenedCount = applications.filter(a => a.status !== 'NEW').length;
    const shortlistedCount = applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW').length;
    
    let sumATS = 0;
    applications.forEach(a => sumATS += a.atsScore);
    const averageATS = totalApplicants > 0 ? Math.round(sumATS / totalApplicants) : 0;

    // Find top matching candidate
    let topCandidate = null;
    if (applications.length > 0) {
      const sorted = [...applications].sort((a, b) => b.jobMatchScore - a.jobMatchScore);
      const top = sorted[0];
      topCandidate = {
        name: top.applicant.name,
        score: top.jobMatchScore,
        atsScore: top.atsScore,
        jobTitle: top.job.title,
        experience: top.job.experience || 'N/A'
      };
    }

    const metrics = {
      activeJobs,
      totalApplicants,
      screenedCount,
      shortlistedCount,
      averageATS,
      topCandidate
    };

    return NextResponse.json({ jobs, metrics });
  } catch (e: any) {
    console.error('GET Jobs API Error:', e);
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRecruiter(req);
    const { title, description, department, location, employmentType, salaryRange } = await req.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Job title and description are required' },
        { status: 400 }
      );
    }

    // Call AI to extract details, requirements, and weights from the description
    const aiAnalysis = await AIProvider.analyzeJobDescription(description);

    const job = await prisma.job.create({
      data: {
        organizationId: session.orgId,
        title: title || aiAnalysis.title,
        description,
        department: department || aiAnalysis.department || 'Engineering',
        location: location || aiAnalysis.location || 'Remote',
        employmentType: employmentType || 'Full-time',
        salaryRange: salaryRange || 'TBD',
        experience: aiAnalysis.experienceRequired || '3+ years',
        education: aiAnalysis.education || "Bachelor's Degree",
        requirements: JSON.stringify(aiAnalysis.requiredSkills),
        preferredSkills: JSON.stringify(aiAnalysis.preferredSkills),
        responsibilities: JSON.stringify(aiAnalysis.responsibilities),
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: session.orgId,
        userId: session.userId,
        action: 'JOB_CREATED',
        details: `Created job posting "${job.title}" and auto-extracted requirements using AI.`,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (e: any) {
    console.error('POST Jobs API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
