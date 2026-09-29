import { Workflow } from '../types/workflow';
import { StylePreset } from '../types/stylePreset';
import { Project } from '../types/project';
import { TranscriptionResult } from '../types/transcription';
import { EditDecisionList } from '../types/edl';
import { UsageEvent } from '../types/usage';
import { RenderJob } from '../types/renderJob';

export interface IWorkflowRepository {
  getAll(): Promise<Workflow[]>;
  getById(id: string): Promise<Workflow | null>;
  save(workflow: Workflow): Promise<void>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Workflow | null>;
  toggleFavorite(id: string): Promise<void>;
}

export interface IStylePresetRepository {
  getAll(): Promise<StylePreset[]>;
  getById(id: string): Promise<StylePreset | null>;
  save(preset: StylePreset): Promise<void>;
}

export interface IProjectRepository {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ITranscriptionRepository {
  getByHash(hash: string): Promise<TranscriptionResult | null>;
  save(transcription: TranscriptionResult): Promise<void>;
}

export interface IAnalysisRepository {
  getByTranscriptHash(hash: string): Promise<EditDecisionList | null>;
  save(analysis: EditDecisionList): Promise<void>;
}

export interface IUsageRepository {
  log(event: Omit<UsageEvent, 'id' | 'createdAt' | 'userId'>): Promise<void>;
}

export interface IRenderRepository {
  getById(id: string): Promise<RenderJob | null>;
  getAllByProject(projectId: string): Promise<RenderJob[]>;
  save(job: RenderJob): Promise<void>;
  updateStatus(id: string, status: any, progress: number, currentOperation?: string, error?: string): Promise<void>;
}

export interface IVideoStorageAdapter {
  upload(file: File, path: string, onProgress?: (pct: number) => void): Promise<string>;
  getSignedUrl(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}
