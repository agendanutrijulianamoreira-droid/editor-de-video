export type UsageOperation = 
  | 'transcription' 
  | 'semantic_analysis' 
  | 'title_generation' 
  | 'highlight_generation';

export interface UsageEvent {
  id: string;
  projectId: string;
  userId: string;
  operation: UsageOperation;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  durationSeconds?: number;
  estimatedCost?: number;
  createdAt: string;
}
