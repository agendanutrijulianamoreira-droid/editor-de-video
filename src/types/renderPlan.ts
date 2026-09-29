export type RenderOperationType =
  | 'trim'
  | 'concat'
  | 'resize'
  | 'crop'
  | 'captions'
  | 'highlights'
  | 'title'
  | 'zoom'
  | 'branding'
  | 'audio'
  | 'export';

export interface RenderOperation {
  id: string;
  type: RenderOperationType;
  enabled: boolean;
  order: number;
  config: any;
  sourceNodeId: string;
}

export interface RenderPlan {
  version: number;
  projectId: string;
  userId: string;
  sourceHash: string;
  edlVersion: number;
  workflowVersion: number;
  analysisConfigHash: string;

  source: {
    videoUrl: string;
    duration: number;
    width: number;
    height: number;
    fps: number;
  };

  timeline: {
    segments: Array<{
      start: number;
      end: number;
      duration: number;
    }>;
    totalDuration: number;
  };

  operations: RenderOperation[];

  output: {
    format: 'mp4';
    codec: 'h264';
    audioCodec: 'aac';
    resolution: {
      width: number;
      height: number;
    };
    quality: 'high' | 'balanced' | 'compact';
  };
}
