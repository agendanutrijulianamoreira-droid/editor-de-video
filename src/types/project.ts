export type ProjectStatus = 'draft' | 'uploading' | 'ready' | 'processing' | 'completed' | 'error';

export interface Project {
  id: string;
  userId: string;
  name: string;
  workflowId: string;
  workflowName: string;
  stylePresetId?: string;
  status: ProjectStatus;
  durationSeconds: number;
  format: '9:16' | '4:5' | '16:9';
  thumbnailUrl: string;
  videoUrl?: string; // Temporarily used for signed url or public url
  sourceHash?: string;
  originalVideoPath?: string;
  originalFilename?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  fileSize: number; // In MB
  mimeType?: string;
  cutsCount: number;
  wordsSubtitled: number;
  createdAt: string;
  updatedAt: string;
}
