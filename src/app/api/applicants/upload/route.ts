import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/db/prisma';
import { authenticateRecruiter } from '@/lib/auth';
import BackgroundQueueProcessor from '@/services/queue/worker';

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRecruiter(req);
    const formData = await req.formData();
    const jobId = formData.get('jobId') as string;
    const files = formData.getAll('files') as File[];

    if (!jobId || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Job ID and at least one file are required.' },
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

    // 1. Create a BackgroundJob record in DB
    const bgJob = await prisma.backgroundJob.create({
      data: {
        jobId,
        status: 'QUEUED',
        totalItems: files.length,
        completedItems: 0,
        failedItems: 0,
      }
    });

    // 2. Setup job folder on disk
    const jobFolder = path.join(process.cwd(), 'storage', 'jobs', bgJob.id);
    if (!fs.existsSync(jobFolder)) {
      fs.mkdirSync(jobFolder, { recursive: true });
    }

    // 3. Save all uploaded files to disk
    for (const file of files) {
      // Clean filename to prevent path traversal security issues
      const safeName = path.basename(file.name);
      const filePath = path.join(jobFolder, safeName);
      
      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    }

    // 4. Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: session.orgId,
        userId: session.userId,
        action: 'BULK_UPLOAD_STARTED',
        details: `Enqueued bulk upload job for ${files.length} applicant resumes. Background Job ID: ${bgJob.id}`,
      }
    });

    // 5. Start background processing worker asynchronously
    BackgroundQueueProcessor.startWorker();

    return NextResponse.json({
      message: 'Upload successful, background processing started.',
      jobId: bgJob.id,
      totalItems: files.length
    }, { status: 202 });
  } catch (e: any) {
    console.error('Upload API error:', e);
    return NextResponse.json({ error: e.message || 'Upload failed.' }, { status: 500 });
  }
}
