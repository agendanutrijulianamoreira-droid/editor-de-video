import dotenv from 'dotenv';
import { initializeApp, getApps } from 'firebase-admin/app';
import { RenderWorkerService } from './src/services/RenderWorkerService';
import express from 'express';
import os from 'os';
import { spawnSync } from 'child_process';

dotenv.config();

// Initialize Firebase Admin for Worker
if (getApps().length === 0) {
  initializeApp();
}

const workerId = process.env.WORKER_ID || `worker-${os.hostname()}-${Math.random().toString(36).substring(7)}`;
const worker = new RenderWorkerService(workerId);

// Health Check Server
const app = express();
const port = process.env.WORKER_PORT || 3001;

app.get('/health', (req, res) => {
  const ffmpegVersion = spawnSync('ffmpeg', ['-version']).stdout?.toString()?.split('\n')[0] || 'not available';
  res.json({
    workerId,
    status: 'healthy',
    uptime: process.uptime(),
    ffmpeg: ffmpegVersion,
    os: {
      platform: os.platform(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length
    },
    config: {
      maxConcurrent: process.env.MAX_CONCURRENT_RENDERS || '1',
      maxVideoDuration: process.env.MAX_VIDEO_DURATION || '300'
    }
  });
});

app.listen(port, () => {
  console.log(`[Worker ${workerId}] Health check server running on port ${port}`);
});

// Start Processing Jobs
worker.start().catch(err => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Stopping worker...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Stopping worker...');
  await worker.stop();
  process.exit(0);
});
