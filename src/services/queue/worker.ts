import fs from 'fs';
import path from 'path';
import prisma from '../../db/prisma';
import ResumeParserService from '../resume/parser';
import GitHubService from '../github/github';
import ClaimVerificationEngine from '../screening/verifier';
import AIProvider from '../ai/ai';
import ATSScoringService from '../scoring/ats';

export class BackgroundQueueProcessor {
  private static isRunning = false;
  private static workerInterval: NodeJS.Timeout | null = null;
  private static storageDir = path.join(process.cwd(), 'storage', 'jobs');

  /**
   * Start the background polling worker
   */
  public static startWorker() {
    if (this.workerInterval) return;

    console.log('🔄 Starting Background Job Queue Processor...');
    
    // Ensure the job storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    // Poll the database for queued jobs every 3 seconds
    this.workerInterval = setInterval(() => {
      this.pollAndProcess();
    }, 3000);
  }

  /**
   * Stop the background worker
   */
  public static stopWorker() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
      console.log('🛑 Background Job Queue Processor stopped.');
    }
  }

  /**
   * Poll database for queued background jobs
   */
  private static async pollAndProcess() {
    if (this.isRunning) return;
    
    try {
      // Find the oldest queued job
      const nextJob = await prisma.backgroundJob.findFirst({
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' },
        include: { job: true }
      });

      if (nextJob) {
        this.isRunning = true;
        await this.processJob(nextJob.id);
      }
    } catch (e) {
      console.error('Error polling queue jobs:', e);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single BackgroundJob
   */
  private static async processJob(jobId: string) {
    console.log(`🚀 Starting processing for Background Job: ${jobId}`);
    
    // Update status to PROCESSING
    await prisma.backgroundJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', updatedAt: new Date() }
    });

    const jobFolder = path.join(this.storageDir, jobId);
    
    try {
      if (!fs.existsSync(jobFolder)) {
        throw new Error(`Job directory ${jobFolder} does not exist.`);
      }

      // Read metadata file if present, or scan the folder for files
      const files = fs.readdirSync(jobFolder).filter(f => f !== 'metadata.json');
      
      // Update total items count
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: { totalItems: files.length }
      });

      const dbJob = await prisma.backgroundJob.findUnique({
        where: { id: jobId },
        include: { job: true }
      });

      if (!dbJob) throw new Error(`Job ${jobId} not found in DB`);

      const targetJob = dbJob.job;
      let completedCount = 0;
      let failedCount = 0;

      // Extract required skills from Job
      const requiredSkills = JSON.parse(targetJob.requirements) as Array<{ skill: string; weight: string }>;
      const preferredSkills = JSON.parse(targetJob.preferredSkills) as Array<{ skill: string; weight: string }>;

      // Process each file
      for (const fileName of files) {
        const filePath = path.join(jobFolder, fileName);
        
        try {
          console.log(`📄 Processing file [${fileName}] for Job: ${targetJob.title}`);
          const buffer = fs.readFileSync(filePath);
          
          // Determine mime type based on extension
          let mimeType = 'text/plain';
          if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
          else if (fileName.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

          // 1. Parse Resume
          const candidateDetails = await ResumeParserService.parseFile(buffer, fileName, mimeType);
          
          // 2. Fetch GitHub evidence
          const githubUrl = candidateDetails.links.github || candidateDetails.links.portfolio || '';
          const githubEvidence = await GitHubService.fetchEvidence(githubUrl, candidateDetails.skills);
          
          // 3. Verify Claims
          const claims = candidateDetails.skills.slice(0, 5).map(s => `Expert in ${s}`);
          if (candidateDetails.experience[0]) {
            claims.push(candidateDetails.experience[0].title);
          }
          const verificationSignals = await ClaimVerificationEngine.verify(claims, githubEvidence);

          // 4. Job-Specific Match
          const matchResult = await AIProvider.matchCandidate(
            {
              title: targetJob.title,
              requiredSkills,
              preferredSkills,
              experience: targetJob.experience,
            },
            {
              skills: candidateDetails.skills,
              experience: candidateDetails.experience,
              github: githubEvidence,
              claims,
            }
          );

          // 5. ATS Score Breakdown
          const atsBreakdown = ATSScoringService.calculateBreakdown(
            {
              requiredSkills,
              preferredSkills,
              experience: targetJob.experience,
              education: targetJob.education,
            },
            {
              skills: candidateDetails.skills,
              experience: candidateDetails.experience,
              projects: candidateDetails.projects,
              education: candidateDetails.education,
            }
          );

          // 6. Create or update Applicant
          let applicant = await prisma.applicant.findUnique({
            where: { email: candidateDetails.email }
          });

          if (!applicant) {
            applicant = await prisma.applicant.create({
              data: {
                name: candidateDetails.name || fileName.split('.')[0],
                email: candidateDetails.email,
                phone: candidateDetails.phone,
                location: candidateDetails.location,
                githubUrl: candidateDetails.links.github,
                portfolioUrl: candidateDetails.links.portfolio,
              }
            });
          } else {
            // Update links if found
            await prisma.applicant.update({
              where: { id: applicant.id },
              data: {
                githubUrl: candidateDetails.links.github || applicant.githubUrl,
                portfolioUrl: candidateDetails.links.portfolio || applicant.portfolioUrl,
                phone: candidateDetails.phone || applicant.phone,
                location: candidateDetails.location || applicant.location,
              }
            });
          }

          // 7. Save Application
          await prisma.application.upsert({
            where: {
              jobId_applicantId: {
                jobId: targetJob.id,
                applicantId: applicant.id
              }
            },
            update: {
              status: 'AI_SCREENED',
              jobMatchScore: matchResult.jobMatchScore,
              atsScore: atsBreakdown.atsScore,
              portfolioScore: matchResult.portfolioScore,
              technicalEvidenceScore: matchResult.technicalEvidenceScore,
              confidence: matchResult.confidence,
              aiSummary: matchResult.aiSummary,
              skillsAnalysis: JSON.stringify(matchResult.skillsAnalysis),
              strengths: JSON.stringify(matchResult.strengths),
              gaps: JSON.stringify(matchResult.gaps),
              verificationSignals: JSON.stringify(verificationSignals),
              interviewQuestions: JSON.stringify(matchResult.interviewQuestions),
            },
            create: {
              jobId: targetJob.id,
              applicantId: applicant.id,
              status: 'AI_SCREENED',
              jobMatchScore: matchResult.jobMatchScore,
              atsScore: atsBreakdown.atsScore,
              portfolioScore: matchResult.portfolioScore,
              technicalEvidenceScore: matchResult.technicalEvidenceScore,
              confidence: matchResult.confidence,
              aiSummary: matchResult.aiSummary,
              skillsAnalysis: JSON.stringify(matchResult.skillsAnalysis),
              strengths: JSON.stringify(matchResult.strengths),
              gaps: JSON.stringify(matchResult.gaps),
              verificationSignals: JSON.stringify(verificationSignals),
              interviewQuestions: JSON.stringify(matchResult.interviewQuestions),
            }
          });

          // 8. Create Audit Logs
          await prisma.auditLog.create({
            data: {
              organizationId: targetJob.organizationId,
              action: 'APPLICANT_UPLOADED',
              details: `Uploaded and parsed resume for applicant ${applicant.name} via bulk job ${jobId}`,
            }
          });

          await prisma.auditLog.create({
            data: {
              organizationId: targetJob.organizationId,
              action: 'ANALYSIS_COMPLETED',
              details: `Completed AI matching evaluation for ${applicant.name} on role '${targetJob.title}'`,
            }
          });

          completedCount++;
        } catch (fileErr) {
          console.error(`Error processing file ${fileName} in job ${jobId}:`, fileErr);
          failedCount++;
        }

        // Update progress in database
        await prisma.backgroundJob.update({
          where: { id: jobId },
          data: {
            completedItems: completedCount,
            failedItems: failedCount,
            updatedAt: new Date()
          }
        });
      }

      // Finish job processing successfully
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      console.log(`✅ Background Job Completed: ${jobId}. Success: ${completedCount}, Failed: ${failedCount}`);

      // Clean up files in job directory (optional: keeping folder, deleting files for disk safety)
      files.forEach(f => {
        try {
          fs.unlinkSync(path.join(jobFolder, f));
        } catch {}
      });
      try {
        fs.rmdirSync(jobFolder);
      } catch {}

    } catch (jobErr: any) {
      console.error(`❌ Critical error in Background Job ${jobId}:`, jobErr);
      
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: jobErr.message || String(jobErr),
          updatedAt: new Date()
        }
      });
    }
  }
}
export default BackgroundQueueProcessor;
