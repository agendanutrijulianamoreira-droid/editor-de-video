/**
 * Interfaces e Contratos para o Engine do VideoFlow AI.
 * 
 * Camada agnóstica de infraestrutura:
 * Permite plugar futuramente provedores reais como FFmpeg WASM/Server,
 * APIs de IA (Gemini), Transcrição (Whisper/Gemini), Armazenamento de Mídia (S3/Supabase),
 * e Filas Distribuídas (BullMQ/Cloud Tasks) sem alterar os componentes de UI.
 */

import { Workflow, WorkflowNode, AnyNodeConfig } from '../types/workflow';

export interface StorageUploadResult {
  fileId: string;
  storageUrl: string;
  bytes: number;
  mimeType: string;
}

export interface IVideoStorageAdapter {
  uploadVideo(file: Blob | File, path: string): Promise<StorageUploadResult>;
  getVideoUrl(fileId: string): Promise<string>;
  deleteVideo(fileId: string): Promise<boolean>;
}

export interface TranscriptionWord {
  word: string;
  startSec: number;
  endSec: number;
  confidence: number;
}

export interface TranscriptionSegment {
  speakerId: string;
  text: string;
  startSec: number;
  endSec: number;
  words: TranscriptionWord[];
}

export interface TranscriptionResult {
  fullText: string;
  language: string;
  durationSec: number;
  segments: TranscriptionSegment[];
}

export interface ITranscriptionAdapter {
  transcribe(audioSourceUrl: string, language?: string): Promise<TranscriptionResult>;
}

export interface IAIGeminiAdapter {
  suggestTitles(transcript: string, objective: string, tone: string): Promise<string[]>;
  detectHighlights(transcript: string, maxHighlights: number): Promise<Array<{ text: string; category: string; startSec: number; endSec: number }>>;
  detectSpeechErrors(transcript: string): Promise<Array<{ text: string; errorType: string; startSec: number; endSec: number }>>;
}

export interface VideoProcessingJobParams {
  jobId: string;
  workflowId: string;
  inputMediaUrl: string;
  targetFormat: '9:16' | '4:5' | '16:9';
  cuts: Array<{ startSec: number; endSec: number; action: 'keep' | 'drop' }>;
  subtitles?: {
    segments: TranscriptionSegment[];
    presetConfig: unknown;
  };
  outputOptions: {
    codec: string;
    bitrate: number;
    container: string;
  };
}

export interface IFFmpegProcessorAdapter {
  executeCuts(inputUrl: string, cuts: Array<{ startSec: number; endSec: number }>): Promise<string>;
  burnSubtitles(videoUrl: string, subtitleConfig: unknown): Promise<string>;
  applySmartFraming(videoUrl: string, targetAspect: string): Promise<string>;
  renderFullPipeline(params: VideoProcessingJobParams): Promise<{ outputUrl: string; renderTimeSec: number }>;
}

export interface JobQueueItem {
  id: string;
  workflowId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  resultUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IJobQueueAdapter {
  enqueue(params: VideoProcessingJobParams): Promise<JobQueueItem>;
  getJobStatus(jobId: string): Promise<JobQueueItem>;
  cancelJob(jobId: string): Promise<boolean>;
}

export interface IDatabaseAdapter {
  saveWorkflow(workflow: Workflow): Promise<Workflow>;
  getWorkflow(id: string): Promise<Workflow | null>;
  listWorkflows(): Promise<Workflow[]>;
  deleteWorkflow(id: string): Promise<boolean>;
}

/**
 * Contrato de execução por Nó:
 * INPUT -> PROCESSAMENTO -> OUTPUT
 */
export interface NodeExecutionContext<TConfig = AnyNodeConfig> {
  workflowId: string;
  node: WorkflowNode;
  config: TConfig;
  inputs: Record<string, unknown>;
  simulateError?: boolean;
}

export interface NodeExecutionOutput {
  success: boolean;
  data: Record<string, unknown>;
  logMessage: string;
  durationMs: number;
  error?: string;
}

export interface INodeRunner {
  run(context: NodeExecutionContext): Promise<NodeExecutionOutput>;
}
