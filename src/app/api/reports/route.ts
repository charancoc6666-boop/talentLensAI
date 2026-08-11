import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { authenticateRecruiter } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRecruiter(req);
    const { searchParams } = req.nextUrl;
    const jobId = searchParams.get('jobId');
    const format = searchParams.get('format') || 'json'; // 'json' | 'csv'
    const reportType = searchParams.get('type') || 'comparison'; // 'comparison' | 'job'

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Verify job belongs to this recruiter's org
    const job = await prisma.job.findFirst({
      where: { id: jobId, organizationId: session.orgId }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch all applications
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: { applicant: true }
    });

    // Audit report generation
    await prisma.auditLog.create({
      data: {
        organizationId: session.orgId,
        userId: session.userId,
        action: 'REPORT_GENERATED',
        details: `Generated ${reportType.toUpperCase()} report in ${format.toUpperCase()} format for job "${job.title}"`,
      }
    });

    if (reportType === 'comparison') {
      if (format === 'csv') {
        let csvContent = 'Rank,Candidate Name,Email,Overall Match %,ATS Score,Portfolio Score,Technical Evidence Score,Status,Confidence,Strengths,Gaps\n';
        
        // Sort by job match score
        const sorted = [...applications].sort((a, b) => b.jobMatchScore - a.jobMatchScore);
        
        sorted.forEach((app, index) => {
          const strengths = JSON.parse(app.strengths || '[]').join(' | ').replace(/"/g, '""');
          const gaps = JSON.parse(app.gaps || '[]').map((g: any) => g.skill).join(' | ').replace(/"/g, '""');
          
          csvContent += `${index + 1},"${app.applicant.name}","${app.applicant.email}",${app.jobMatchScore},${app.atsScore},${app.portfolioScore},${app.technicalEvidenceScore},"${app.status}","${app.confidence}","${strengths}","${gaps}"\n`;
        });

        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="candidate_comparison_${jobId}.csv"`
          }
        });
      } else {
        // Return JSON format comparison
        const sorted = [...applications].sort((a, b) => b.jobMatchScore - a.jobMatchScore);
        return NextResponse.json({
          jobTitle: job.title,
          generatedAt: new Date().toISOString(),
          candidates: sorted.map((app, index) => ({
            rank: index + 1,
            name: app.applicant.name,
            email: app.applicant.email,
            jobMatchScore: app.jobMatchScore,
            atsScore: app.atsScore,
            portfolioScore: app.portfolioScore,
            technicalEvidenceScore: app.technicalEvidenceScore,
            status: app.status,
            confidence: app.confidence,
            strengths: JSON.parse(app.strengths || '[]'),
            gaps: JSON.parse(app.gaps || '[]')
          }))
        });
      }
    } 
    else if (reportType === 'job') {
      // Calculate Job metrics
      const totalApplicants = applications.length;
      
      const statusCounts = {
        ExcellentMatch: 0, // 90-100
        StrongMatch: 0,    // 75-89
        Review: 0,         // 60-74
        WeakMatch: 0       // Below 60
      };

      let sumATS = 0;
      let sumMatch = 0;

      // Calculate skill availability
      const skillCounts: Record<string, number> = {};

      applications.forEach(app => {
        sumATS += app.atsScore;
        sumMatch += app.jobMatchScore;

        // Categorize match status
        if (app.jobMatchScore >= 90) statusCounts.ExcellentMatch++;
        else if (app.jobMatchScore >= 75) statusCounts.StrongMatch++;
        else if (app.jobMatchScore >= 60) statusCounts.Review++;
        else statusCounts.WeakMatch++;

        // Parse skills
        try {
          const skillsAnalysis = JSON.parse(app.skillsAnalysis || '[]');
          skillsAnalysis.forEach((s: any) => {
            if (s.status === 'Strong Match') {
              skillCounts[s.skill] = (skillCounts[s.skill] || 0) + 1;
            }
          });
        } catch {}
      });

      const avgATS = totalApplicants > 0 ? Math.round(sumATS / totalApplicants) : 0;
      const avgMatch = totalApplicants > 0 ? Math.round(sumMatch / totalApplicants) : 0;

      const jobReport = {
        jobTitle: job.title,
        department: job.department,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalApplicants,
          averageATSScore: avgATS,
          averageJobMatchScore: avgMatch,
          excellentMatchesCount: statusCounts.ExcellentMatch,
          strongMatchesCount: statusCounts.StrongMatch,
          reviewCount: statusCounts.Review,
          weakMatchesCount: statusCounts.WeakMatch
        },
        skillAvailability: Object.entries(skillCounts)
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
      };

      if (format === 'csv') {
        let csvContent = `Job Hiring Report: ${job.title}\n`;
        csvContent += `Generated At,${jobReport.generatedAt}\n`;
        csvContent += `Department,${jobReport.department || 'N/A'}\n\n`;
        csvContent += `Metric,Value\n`;
        csvContent += `Total Applicants,${totalApplicants}\n`;
        csvContent += `Average ATS Score,${avgATS}\n`;
        csvContent += `Average Job Match Score,${avgMatch}\n`;
        csvContent += `Excellent Matches (90-100),${statusCounts.ExcellentMatch}\n`;
        csvContent += `Strong Matches (75-89),${statusCounts.StrongMatch}\n`;
        csvContent += `Review Status (60-74),${statusCounts.Review}\n`;
        csvContent += `Weak Matches (<60),${statusCounts.WeakMatch}\n\n`;
        csvContent += `Skill,Candidates demonstrating skill\n`;
        
        jobReport.skillAvailability.forEach(s => {
          csvContent += `"${s.skill}",${s.count}\n`;
        });

        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="job_hiring_report_${jobId}.csv"`
          }
        });
      } else {
        return NextResponse.json(jobReport);
      }
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (e: any) {
    console.error('Reports API Error:', e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}
