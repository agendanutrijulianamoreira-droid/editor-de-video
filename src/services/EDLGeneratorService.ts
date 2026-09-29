import { TranscriptionResult, TranscriptionWord } from '../types/transcription';
import { 
  EditDecisionList, 
  CaptionBlock, 
  TitleSuggestion, 
  Highlight, 
  SpeechIssue, 
  ZoomEvent,
  DecisionSource
} from '../types/edl';
import { Workflow } from '../types/workflow';
import { StylePreset } from '../types/stylePreset';
import { 
  ITranscriptionRepository, 
  IAnalysisRepository, 
  IUsageRepository 
} from '../persistence/interfaces';
import { calculateStringHash } from '../utils/hash';
import { AI_MODELS } from '../config/aiModels';

export class EDLGeneratorService {
  // Configurações de proteção de corte
  private readonly PRE_CUT_PADDING_MS = 50;
  private readonly POST_CUT_PADDING_MS = 80;

  constructor(
    private transcriptionRepo: ITranscriptionRepository,
    private analysisRepo: IAnalysisRepository,
    private usageRepo: IUsageRepository
  ) {}

  async transcribe(projectId: string, videoUrl: string, sourceHash: string): Promise<TranscriptionResult> {
    const cached = await this.transcriptionRepo.getByHash(sourceHash);
    if (cached) return cached;

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl })
    });

    if (!response.ok) throw new Error('Transcription failed');
    const result = await response.json();

    const transcription: TranscriptionResult = {
      ...result,
      projectId,
      sourceHash,
      createdAt: new Date().toISOString()
    };

    await this.transcriptionRepo.save(transcription);
    
    await this.usageRepo.log({
      projectId,
      operation: 'transcription',
      provider: 'google',
      model: AI_MODELS.transcription,
      durationSeconds: transcription.duration
    });

    return transcription;
  }

  async analyze(
    projectId: string, 
    transcription: TranscriptionResult, 
    workflow: Workflow
  ): Promise<EditDecisionList> {
    const transcriptHash = calculateStringHash(transcription.rawText || transcription.text);
    const analysisConfig = {
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      cleanup: workflow.nodes.find(n => n.data.nodeType === 'cleanup')?.data.config,
      highlights: workflow.nodes.find(n => n.data.nodeType === 'highlights')?.data.config,
      title: workflow.nodes.find(n => n.data.nodeType === 'title')?.data.config,
      subtitles: workflow.nodes.find(n => n.data.nodeType === 'subtitles')?.data.config,
    };
    const analysisConfigHash = calculateStringHash(JSON.stringify(analysisConfig));
    
    // Check cache for EDL based on transcriptHash
    const cached = await this.analysisRepo.getByTranscriptHash(transcriptHash);
    
    // Se existe cache, preservamos decisões humanas ao re-gerar ou decidir se usamos o cache
    const edl: EditDecisionList = cached || {
      edlVersion: 1,
      workflowVersion: workflow.version,
      projectId,
      sourceHash: transcription.sourceHash,
      transcriptHash,
      analysisConfigHash,
      segments: transcription.segments,
      captions: [],
      speechIssues: [],
      highlights: [],
      titleSuggestions: [],
      activeTitle: null,
      zoomEvents: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        transcriptionProvider: AI_MODELS.transcription,
        analysisProvider: AI_MODELS.semanticAnalysis
      }
    };

    // Preservar decisões humanas se estivermos invalidando por config
    const previousHumanIssues = cached ? cached.speechIssues.filter(i => i.humanDecision !== 'none') : [];

    // 1. Speech Issues (Cuts & Gaps)
    if (edl.speechIssues.length === 0 || edl.analysisConfigHash !== analysisConfigHash) {
      const cleanupConfig = analysisConfig.cleanup;
      
      // A. Automatic Speech Gap Detection (Technical analysis)
      const speechGaps = this.detectSpeechGaps(transcription, cleanupConfig);
      
      // B. Semantic Analysis via Gemini (Errors, Repetitions)
      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcription, cleanupConfig })
      });
      const { speechIssues: semanticResults } = await response.json();
      
      const semanticIssues = this.mapResultsToIssues(semanticResults, transcription, 'suggested');
      
      let combinedIssues = [...speechGaps, ...semanticIssues];
      
      // Merge with previous human decisions
      if (previousHumanIssues.length > 0) {
        combinedIssues = combinedIssues.map(newIssue => {
          const match = previousHumanIssues.find(old => 
            Math.abs(old.start - newIssue.start) < 0.1 && Math.abs(old.end - newIssue.end) < 0.1
          );
          return match ? { ...newIssue, humanDecision: match.humanDecision, decisionSource: match.decisionSource } : newIssue;
        });
        
        // Add human-only issues that might have been lost
        previousHumanIssues.forEach(old => {
          if (!combinedIssues.some(newI => Math.abs(newI.start - old.start) < 0.1)) {
            combinedIssues.push(old);
          }
        });
      }

      edl.speechIssues = this.validateAndCleanIssues(combinedIssues, transcription.duration);
      edl.analysisConfigHash = analysisConfigHash;

      await this.usageRepo.log({
        projectId,
        operation: 'semantic_analysis',
        provider: 'google',
        model: AI_MODELS.semanticAnalysis
      });
    }

    // 2. Titles
    if (edl.titleSuggestions.length === 0 || edl.analysisConfigHash !== analysisConfigHash) {
      const titleConfig = analysisConfig.title;
      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcription, titleConfig })
      });
      const { suggestions } = await response.json();
      edl.titleSuggestions = suggestions.map((s: any) => ({
        ...s,
        id: `title-${Math.random().toString(36).substr(2, 9)}`
      }));

      await this.usageRepo.log({
        projectId,
        operation: 'title_generation',
        provider: 'google',
        model: AI_MODELS.titleGeneration
      });
    }

    // 3. Highlights
    if (edl.highlights.length === 0 || edl.analysisConfigHash !== analysisConfigHash) {
      const highlightConfig = analysisConfig.highlights;
      const response = await fetch('/api/generate-highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcription, highlightConfig })
      });
      const { highlights: highlightResults } = await response.json();
      edl.highlights = this.mapResultsToHighlights(highlightResults, transcription);

      await this.usageRepo.log({
        projectId,
        operation: 'highlight_generation',
        provider: 'google',
        model: AI_MODELS.highlightAnalysis
      });
    }

    // 4. Captions
    if (edl.captions.length === 0 || edl.analysisConfigHash !== analysisConfigHash) {
      edl.captions = this.generateCaptions(transcription, workflow);
    }

    // 5. Zoom Events
    if (edl.zoomEvents.length === 0 || edl.analysisConfigHash !== analysisConfigHash) {
      edl.zoomEvents = edl.highlights
        .filter(h => h.importance >= 0.8)
        .map(h => ({
          id: `zoom-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: h.start,
          duration: h.end - h.start,
          scale: 1.1,
          reason: `Emphasis: ${h.category}`,
          decisionSource: 'automatic'
        }));
    }

    await this.analysisRepo.save(edl);
    return edl;
  }

  private detectSpeechGaps(transcription: TranscriptionResult, cleanupConfig: any): SpeechIssue[] {
    const gaps: SpeechIssue[] = [];
    const minGap = cleanupConfig?.duracaoMinimaSilencioSec || 0.4;
    const words = transcription.words;
    
    if (words.length < 2) return gaps;

    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i+1];
      const gap = nextWord.start - currentWord.end;

      if (gap >= minGap) {
        let status: any = 'keep';
        let message = 'Pausa de fala natural';
        
        if (gap > 1.5) {
          status = 'auto_remove_candidate';
          message = 'Espaço de fala longo (vazio)';
        } else if (gap > 0.7) {
          status = 'review';
          message = 'Hesitação técnica';
        }

        gaps.push({
          id: `gap-${i}`,
          type: 'silence',
          start: currentWord.end,
          end: nextWord.start,
          duration: gap,
          confidence: 1.0,
          status,
          humanDecision: 'none',
          decisionSource: 'automatic',
          message
        });
      }
    }

    return gaps;
  }

  private mapResultsToIssues(results: any[], transcription: TranscriptionResult, source: DecisionSource): SpeechIssue[] {
    return results.map(res => {
      const startWord = transcription.words.find(w => w.id === res.startWordId);
      const endWord = transcription.words.find(w => w.id === res.endWordId);
      
      if (!startWord || !endWord) return null;

      // Aplicar padding com proteção (não invadir palavras vizinhas)
      const start = Math.max(0, startWord.start - (this.PRE_CUT_PADDING_MS / 1000));
      const end = Math.min(transcription.duration, endWord.end + (this.POST_CUT_PADDING_MS / 1000));

      return {
        id: `si-${Math.random().toString(36).substr(2, 9)}`,
        type: res.type,
        start,
        end,
        duration: end - start,
        confidence: res.confidence,
        status: res.confidence >= 0.90 ? 'auto_remove_candidate' : (res.confidence >= 0.65 ? 'review' : 'keep'),
        humanDecision: 'none',
        decisionSource: source,
        message: res.message
      } as SpeechIssue;
    }).filter(i => i !== null) as SpeechIssue[];
  }

  private mapResultsToHighlights(results: any[], transcription: TranscriptionResult): Highlight[] {
    return results.map(res => {
      const startWord = transcription.words.find(w => w.id === res.startWordId);
      const endWord = transcription.words.find(w => w.id === res.endWordId);
      if (!startWord || !endWord) return null;

      return {
        id: `h-${Math.random().toString(36).substr(2, 9)}`,
        text: res.text,
        start: startWord.start,
        end: endWord.end,
        category: res.category,
        importance: res.importance,
        decisionSource: 'suggested'
      } as Highlight;
    }).filter(h => h !== null) as Highlight[];
  }

  private validateAndCleanIssues(issues: SpeechIssue[], maxDuration: number): SpeechIssue[] {
    // 1. Validar invariantes técnicos
    let valid = issues.filter(i => 
      i.start >= 0 && 
      i.end > i.start && 
      i.end <= maxDuration
    );

    // 2. Ordenar por tempo
    valid.sort((a, b) => a.start - b.start);

    // 3. Unificar sobreposições ou adjacentes
    if (valid.length < 2) return valid;

    const merged: SpeechIssue[] = [];
    let current = { ...valid[0] };

    for (let i = 1; i < valid.length; i++) {
      const next = valid[i];
      
      // Se houver sobreposição ou gap muito pequeno (< 0.05s)
      if (next.start <= current.end + 0.05) {
        current.end = Math.max(current.end, next.end);
        current.duration = current.end - current.start;
        current.message = `${current.message} + ${next.message}`;
        current.confidence = (current.confidence + next.confidence) / 2;
        // Se um for auto-remove, o conjunto tende a ser
        if (next.status === 'auto_remove_candidate') current.status = 'auto_remove_candidate';
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);

    return merged;
  }

  private generateCaptions(transcription: TranscriptionResult, workflow: Workflow): CaptionBlock[] {
    const subConfig = workflow.nodes.find(n => n.data.nodeType === 'subtitles')?.data.config as any;
    const wordsPerBlock = subConfig?.maximoPalavras || 3;
    
    const blocks: CaptionBlock[] = [];
    const words = transcription.words;
    
    for (let i = 0; i < words.length; i += wordsPerBlock) {
      const blockWords = words.slice(i, i + wordsPerBlock);
      if (blockWords.length === 0) continue;

      blocks.push({
        id: `cap-${i}`,
        start: blockWords[0].start,
        end: blockWords[blockWords.length - 1].end,
        text: blockWords.map(w => w.word).join(' '),
        words: blockWords.map(w => ({
          text: w.word,
          start: w.start,
          end: w.end
        }))
      });
    }

    return blocks;
  }
}
