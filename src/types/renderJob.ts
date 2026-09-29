export type RenderJobStatus =
  | 'queued'
  | 'claimed'
  | 'preparing'
  | 'rendering'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface RenderJob {
  id: string;
  projectId: string;
  userId: string;
  renderPlanHash: string;
  status: RenderJobStatus;
  progress: number;
  currentOperation: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  error: string | null;
  outputPath: string | null;
  outputUrl: string | null;
  
  // Coordination & Resilience
  attempt: number;
  claimedBy: string | null;
  claimedAt: string | null;
  heartbeatAt: string | null;
  leaseExpiresAt: string | null;
  cancelRequested: boolean;
  
  // Stats
  originalDuration?: number;
  finalDuration?: number;
  originalSize?: number;
  finalSize?: number;
  cutsCount?: number;

  diagnostics?: {
    sourceDuration: number;
    expectedDuration: number;
    outputDuration: number;
    sourceWidth: number;
    sourceHeight: number;
    outputWidth: number;
    outputHeight: number;
    sourceFPS: number;
    outputFPS: number;
    audioCodec: string;
    videoCodec: string;
    audioSampleRate: number;
    removedDuration: number;
    numberOfCuts: number;
    numberOfCaptions: number;
    numberOfHighlights: number;
    numberOfZoomEvents: number;
    renderDurationMs: number;
    outputFileSize: number;
    ffmpegExitCode: number;
    commandBuilt: string[];
  };
}
