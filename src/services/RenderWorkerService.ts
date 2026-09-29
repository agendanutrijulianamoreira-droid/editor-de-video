import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { RenderJob, RenderJobStatus } from '../types/renderJob';
import { ASSGenerator } from '../utils/ASSGenerator';
import { TimelineMapper } from '../utils/TimelineMapper';
import { FFmpegCommandBuilder } from '../engine/FFmpegCommandBuilder';

export class RenderWorkerService {
  private db = getFirestore();
  private storage = getStorage();
  private workerId: string;
  private isRunning = false;
  private currentJobProcess: any = null;
  private maxConcurrent = parseInt(process.env.MAX_CONCURRENT_RENDERS || '1');
  private maxVideoDuration = parseInt(process.env.MAX_VIDEO_DURATION || '300'); // 5 min
  private maxRenderAttempts = parseInt(process.env.MAX_RENDER_ATTEMPTS || '3');
  private leaseDurationMs = 120000; // 2 minutes

  constructor(workerId: string) {
    this.workerId = workerId;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Worker ${this.workerId}] Started polling...`);
    this.poll();
  }

  async stop() {
    this.isRunning = false;
    if (this.currentJobProcess) {
       this.currentJobProcess.kill('SIGTERM');
    }
  }

  private async poll() {
    while (this.isRunning) {
      try {
        const job = await this.claimJob();
        if (job) {
          console.log(`[Worker ${this.workerId}] Claimed job ${job.id}`);
          await this.processJob(job);
        } else {
          // No jobs found, wait 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`[Worker ${this.workerId}] Polling error:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async claimJob(): Promise<RenderJob | null> {
    const jobsColl = this.db.collection('render_jobs');
    const now = Timestamp.now();

    // Find a job that is 'queued' OR 'claimed' but lease expired
    const q = jobsColl
      .where('status', 'in', ['queued', 'claimed'])
      .orderBy('startedAt', 'asc')
      .limit(20);

    const snapshot = await q.get();
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as RenderJob;
      
      const isQueued = data.status === 'queued';
      const isExpired = data.status === 'claimed' && data.leaseExpiresAt && (new Timestamp(data.leaseExpiresAt as any, (data.leaseExpiresAt as any)._nanoseconds || 0).toMillis() < now.toMillis());

      if ((isQueued || isExpired) && (data.attempt || 0) < this.maxRenderAttempts) {
        // Try atomic claim
        try {
          const claimedJob = await this.db.runTransaction(async (t) => {
            const freshDoc = await t.get(doc.ref);
            const freshData = freshDoc.data() as RenderJob;
            
            // Re-verify condition inside transaction
            const stillQueued = freshData.status === 'queued';
            const stillExpired = freshData.status === 'claimed' && freshData.leaseExpiresAt && (new Timestamp(freshData.leaseExpiresAt as any, (freshData.leaseExpiresAt as any)._nanoseconds || 0).toMillis() < now.toMillis());

            if (stillQueued || stillExpired) {
              const leaseExpiresAt = new Date(Date.now() + this.leaseDurationMs);
              const update: Partial<RenderJob> = {
                status: 'claimed',
                claimedBy: this.workerId,
                claimedAt: new Date().toISOString(),
                heartbeatAt: new Date().toISOString(),
                leaseExpiresAt: leaseExpiresAt.toISOString() as any,
                attempt: (freshData.attempt || 0) + 1,
                updatedAt: FieldValue.serverTimestamp() as any
              };
              t.update(doc.ref, update);
              return { ...freshData, ...update, id: freshDoc.id };
            }
            return null;
          });
          
          if (claimedJob) return claimedJob as RenderJob;
        } catch (e) {
          console.warn(`[Worker ${this.workerId}] Transaction failed for job ${doc.id}:`, e);
          continue;
        }
      }
    }

    return null;
  }

  private async processJob(job: RenderJob) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'videoflow-'));
    const jobIdDir = path.join(tmpDir, job.id);
    fs.mkdirSync(jobIdDir, { recursive: true });

    const inputPath = path.join(jobIdDir, 'input.mp4');
    const outputPath = path.join(jobIdDir, 'output.mp4');
    const assPath = path.join(jobIdDir, 'subs.ass');
    
    // In-memory reference for cleanup and progress
    const plan = (job as any).renderPlan || await this.getRenderPlan(job);
    if (!plan) {
       await this.failJob(job.id, 'Render plan not found');
       return;
    }

    const heartbeatInterval = setInterval(() => this.updateHeartbeat(job.id), 30000);

    try {
      // Check idempotency: If valid output already exists for this hash, we could skip.
      // For now, we always render if the job was triggered.

      // 1. Prepare Files
      await this.updateStatus(job.id, 'preparing', 5, 'Baixando vídeo original...');
      const videoRes = await fetch(plan.source.videoUrl);
      if (!videoRes.ok) throw new Error(`Falha ao baixar vídeo: ${videoRes.statusText}`);
      const videoBuffer = await videoRes.arrayBuffer();
      fs.writeFileSync(inputPath, Buffer.from(videoBuffer));

      if (this.isCancelled(job.id)) throw new Error('CANCELLED');

      // Probe Metadata
      const probeInput = await this.ffprobe(inputPath);
      const sourceDuration = parseFloat(probeInput.format.duration);
      if (sourceDuration > this.maxVideoDuration) {
         throw new Error(`Duração do vídeo (${sourceDuration}s) excede o limite de ${this.maxVideoDuration}s.`);
      }

      const videoStream = probeInput.streams.find((s: any) => s.codec_type === 'video');
      
      // Generate ASS if needed
      const captionsOp = plan.operations.find((o: any) => o.type === 'captions');
      if (captionsOp) {
        await this.updateStatus(job.id, 'preparing', 15, 'Gerando legendas ASS...');
        const timelineMapper = new TimelineMapper(plan.timeline.segments);
        const assContent = ASSGenerator.generate(
          captionsOp.config.blocks,
          captionsOp.config.highlights,
          timelineMapper,
          captionsOp.config.style
        );
        fs.writeFileSync(assPath, assContent);
      }

      // 2. Build FFmpeg Command
      const cmd = FFmpegCommandBuilder.build(plan, inputPath, captionsOp ? assPath : undefined);
      const args = [
        ...cmd.inputs.flatMap(i => ['-i', i]),
        '-filter_complex', cmd.filterComplex,
        ...cmd.outputArgs,
        outputPath
      ];

      await this.updateStatus(job.id, 'rendering', 25, 'Executando FFmpeg...');

      // 3. Execute FFmpeg
      const startTime = Date.now();
      const ffmpeg = spawn('ffmpeg', args);
      this.currentJobProcess = ffmpeg;

      ffmpeg.stderr.on('data', (data) => {
        const log = data.toString();
        const timeMatch = log.match(/time=(\d{2}:\d{2}:\d{2}.\d{2})/);
        if (timeMatch) {
           const timeStr = timeMatch[1];
           const [h, m, s] = timeStr.split(':').map(parseFloat);
           const currentTime = h * 3600 + m * 60 + s;
           const progress = Math.min(85, 25 + Math.round((currentTime / plan.timeline.totalDuration) * 60));
           this.updateStatus(job.id, 'rendering', progress, 'Processando frames...').catch(() => {});
        }
      });

      const exitCode = await new Promise<number>((resolve) => {
        ffmpeg.on('close', (code) => resolve(code || 0));
        
        // Polling cancellation inside ffmpeg loop
        const cancelCheck = setInterval(async () => {
           if (await this.isCancelled(job.id)) {
              ffmpeg.kill('SIGTERM');
              clearInterval(cancelCheck);
           }
        }, 5000);
      });

      this.currentJobProcess = null;
      if (await this.isCancelled(job.id)) throw new Error('CANCELLED');
      if (exitCode !== 0) throw new Error(`FFmpeg finalizou com código ${exitCode}`);

      // 4. Upload
      await this.updateStatus(job.id, 'uploading', 90, 'Enviando resultado...');
      const bucket = this.storage.bucket();
      const destination = `users/${plan.userId}/${plan.projectId}/renders/${job.id}/video.mp4`;
      
      await bucket.upload(outputPath, {
        destination,
        metadata: { contentType: 'video/mp4' }
      });

      const file = bucket.file(destination);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
      });

      // Probe Output for Diagnostics
      const probeOutput = await this.ffprobe(outputPath);
      const outVideo = probeOutput.streams?.find((s: any) => s.codec_type === 'video') || {};
      const outAudio = probeOutput.streams?.find((s: any) => s.codec_type === 'audio') || {};
      const outFormat = probeOutput.format || {};
      const stats = fs.statSync(outputPath);

      const diagnostics = {
        sourceDuration,
        expectedDuration: plan.timeline.totalDuration,
        outputDuration: parseFloat(outFormat.duration || 0),
        sourceWidth: parseInt(videoStream.width),
        sourceHeight: parseInt(videoStream.height),
        outputWidth: parseInt(outVideo.width || 0),
        outputHeight: parseInt(outVideo.height || 0),
        sourceFPS: eval(videoStream.r_frame_rate),
        outputFPS: eval(outVideo.r_frame_rate || '0'),
        audioCodec: outAudio.codec_name || 'unknown',
        videoCodec: outVideo.codec_name || 'unknown',
        audioSampleRate: parseInt(outAudio.sample_rate || 0),
        removedDuration: sourceDuration - plan.timeline.totalDuration,
        numberOfCuts: plan.timeline.segments.length - 1,
        numberOfCaptions: captionsOp?.config.blocks.length || 0,
        numberOfHighlights: captionsOp?.config.highlights.length || 0,
        numberOfZoomEvents: plan.operations.find((o: any) => o.type === 'zoom')?.config.events.length || 0,
        renderDurationMs: Date.now() - startTime,
        outputFileSize: stats.size,
        ffmpegExitCode: exitCode,
        commandBuilt: args
      };

      await this.updateStatus(job.id, 'completed', 100, 'Finalizado.', undefined, {
        outputPath: destination,
        outputUrl: url,
        finalSize: parseFloat((stats.size / (1024 * 1024)).toFixed(1)),
        finalDuration: diagnostics.outputDuration,
        diagnostics
      });

      console.log(`[Worker ${this.workerId}] Job ${job.id} completed successfully.`);

    } catch (err: any) {
      if (err.message === 'CANCELLED') {
         console.log(`[Worker ${this.workerId}] Job ${job.id} cancelled.`);
         await this.updateStatus(job.id, 'cancelled', 0, 'Cancelado pelo usuário.');
      } else {
         console.error(`[Worker ${this.workerId}] Job ${job.id} failed:`, err);
         await this.failJob(job.id, err.message);
      }
    } finally {
      clearInterval(heartbeatInterval);
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  private async updateStatus(jobId: string, status: RenderJobStatus, progress: number, currentOperation?: string, error?: string, extras?: any) {
    const docRef = this.db.collection('render_jobs').doc(jobId);
    const update: any = { 
      status, 
      progress, 
      updatedAt: FieldValue.serverTimestamp(),
      heartbeatAt: FieldValue.serverTimestamp(),
      leaseExpiresAt: new Date(Date.now() + this.leaseDurationMs).toISOString()
    };
    if (currentOperation) update.currentOperation = currentOperation;
    if (error) update.error = error;
    if (status === 'completed') update.completedAt = FieldValue.serverTimestamp();
    if (extras) Object.assign(update, extras);
    await docRef.update(update);
  }

  private async failJob(jobId: string, error: string) {
    await this.db.collection('render_jobs').doc(jobId).update({
      status: 'failed',
      error,
      updatedAt: FieldValue.serverTimestamp(),
      progress: 0
    });
  }

  private async updateHeartbeat(jobId: string) {
    try {
      await this.db.collection('render_jobs').doc(jobId).update({
        heartbeatAt: FieldValue.serverTimestamp(),
        leaseExpiresAt: new Date(Date.now() + this.leaseDurationMs).toISOString(),
        updatedAt: FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.warn(`[Worker ${this.workerId}] Failed heartbeat for ${jobId}`, e);
    }
  }

  private async isCancelled(jobId: string): Promise<boolean> {
    const doc = await this.db.collection('render_jobs').doc(jobId).get();
    return (doc.data() as RenderJob)?.cancelRequested === true;
  }

  private async getRenderPlan(job: RenderJob): Promise<any | null> {
     // If plan is too big, it might be stored in a subcollection or separate file
     // For now we expect it in the doc. If not present, we can't proceed.
     return (job as any).renderPlan;
  }

  private async ffprobe(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', path]);
      let output = '';
      ffprobe.stdout.on('data', d => output += d);
      ffprobe.on('close', () => resolve(JSON.parse(output)));
      ffprobe.on('error', reject);
    });
  }
}
