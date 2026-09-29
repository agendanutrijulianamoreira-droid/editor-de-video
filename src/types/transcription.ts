export interface TranscriptionWord {
  id: string; // Unique ID for the word in this transcription
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  id?: string;
  projectId: string;
  sourceHash: string;
  text: string;
  rawText?: string; // Literal text including disfluencies
  language: string;
  duration: number;
  segments: TranscriptionSegment[];
  words: TranscriptionWord[];
  createdAt: string;
}
