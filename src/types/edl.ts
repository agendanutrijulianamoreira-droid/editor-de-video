import { TranscriptionWord, TranscriptionSegment } from './transcription';

export type SpeechIssueType = 'silence' | 'error' | 'repetition' | 'filler';
export type DecisionStatus = 'auto_remove_candidate' | 'review' | 'keep';
export type HumanDecision = 'keep' | 'remove' | 'none';
export type DecisionSource = 'automatic' | 'suggested' | 'human';

export interface SpeechIssue {
  id: string;
  type: SpeechIssueType;
  start: number;
  end: number;
  duration: number;
  confidence: number;
  status: DecisionStatus;
  humanDecision: HumanDecision;
  decisionSource: DecisionSource;
  message: string;
}

export interface Highlight {
  id: string;
  text: string;
  start: number;
  end: number;
  category: 'number' | 'pain' | 'benefit' | 'warning' | 'keyword' | 'concept';
  importance: number;
  decisionSource: DecisionSource;
}

export interface TitleSuggestion {
  id: string;
  text: string;
  strategy: string;
  confidence: number;
}

export interface ZoomEvent {
  id: string;
  timestamp: number;
  duration: number;
  scale: number;
  reason: string;
  decisionSource: DecisionSource;
}

export interface CaptionBlock {
  id: string;
  start: number;
  end: number;
  text: string;
  words: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface EditDecisionList {
  edlVersion: number;
  workflowVersion: number;
  projectId: string;
  sourceHash: string;
  transcriptHash: string;
  analysisConfigHash: string;
  
  segments: TranscriptionSegment[];
  captions: CaptionBlock[];
  speechIssues: SpeechIssue[];
  highlights: Highlight[];
  titleSuggestions: TitleSuggestion[];
  activeTitle: string | null;
  zoomEvents: ZoomEvent[];

  metadata: {
    generatedAt: string;
    transcriptionProvider: string;
    analysisProvider: string;
  };
}
