export type NodeCategory =
  | 'Entrada'
  | 'Áudio'
  | 'Edição'
  | 'Inteligência'
  | 'Branding'
  | 'Revisão'
  | 'Saída';

export type NodeType =
  | 'video-input'
  | 'transcribe'
  | 'cleanup'
  | 'zoom'
  | 'format'
  | 'subtitles'
  | 'speech-errors'
  | 'highlights'
  | 'title'
  | 'brand'
  | 'preview'
  | 'export';

export type NodeExecutionStatus = 'idle' | 'queued' | 'running' | 'success' | 'error';

export interface BaseNodeConfig {
  [key: string]: unknown;
}

export interface CleanupNodeConfig extends BaseNodeConfig {
  removerSilencio: boolean;
  duracaoMinimaSilencioSec: number; // ex: 0.4s
  preservarPausasNaturais: boolean;
  removerRepeticoes: boolean;
  agressividade: 'baixa' | 'media' | 'alta';
  comportamentoDuvida: 'manter' | 'remover' | 'marcar-revisao';
}

export interface SubtitleNodeConfig extends BaseNodeConfig {
  stylePresetId?: string;
  fonte: string;
  tamanho: number;
  posicao: 'inferior' | 'centro' | 'superior';
  maximoPalavras: number;
  maximoLinhas: number;
  animacao: 'nenhuma' | 'fade' | 'pop' | 'typewriter';
  destaquePalavras: boolean;
}

export interface HighlightsNodeConfig extends BaseNodeConfig {
  numeros: boolean;
  dores: boolean;
  beneficios: boolean;
  alertas: boolean;
  palavrasChave: boolean;
  quantidadeMaximaDestaques: number;
  intensidadeVisual: 'sutil' | 'moderada' | 'chamativa';
}

export interface TitleNodeConfig extends BaseNodeConfig {
  geracaoAutomatica: boolean;
  objetivo: 'retencao' | 'autoridade' | 'viralizacao' | 'didatico';
  maximoPalavras: number;
  tom: 'direto' | 'curioso' | 'urgente' | 'educativo';
  posicao: 'topo' | 'centro' | 'banner-dinamico';
  duracaoSec: number;
  evitarClickbait: boolean;
  evitarPromessasExageradas: boolean;
}

export interface ZoomNodeConfig extends BaseNodeConfig {
  ativar: boolean;
  frequencia: 'baixa' | 'media' | 'alta' | 'enfase-destaques';
  intensidade: 'suave' | 'padrao' | 'impacto';
  escalaMaximaPercent: number; // ex: 115%
  evitarMudancasBruscas: boolean;
}

export interface FormatNodeConfig extends BaseNodeConfig {
  aspectRatio: '9:16' | '4:5' | '16:9';
  enquadramentoInteligente: boolean;
  preenchimentoFundo: 'desfoque' | 'preto' | 'cor-solida';
}

export interface VideoInputNodeConfig extends BaseNodeConfig {
  origem: 'upload' | 'camera' | 'url';
  resolucaoDesejada: 'original' | '1080p' | '4k';
  framerateFps: 30 | 60;
  maxDuracaoMinutos: number;
}

export interface TranscribeNodeConfig extends BaseNodeConfig {
  idioma: 'pt-BR' | 'en-US' | 'es-ES' | 'auto';
  deteccaoLocutores: boolean;
  pontuacaoAutomatica: boolean;
  removerRuidoAudio: boolean;
}

export interface SpeechErrorsNodeConfig extends BaseNodeConfig {
  removerGagueira: boolean;
  removerViciosLinguagem: boolean; // né, tipo, éee
  removerFalsosInicios: boolean;
  sensibilidade: 'rigorosa' | 'equilibrada' | 'conservadora';
}

export interface BrandNodeConfig extends BaseNodeConfig {
  logoUrl?: string;
  posicao: 'topo-direita' | 'topo-esquerda' | 'rodape-direita' | 'rodape-esquerda';
  opacidadePercent: number;
  tamanhoPercent: number;
  marcaDaguaAtiva: boolean;
}

export interface PreviewNodeConfig extends BaseNodeConfig {
  qualidadePreview: 'rapida' | 'alta' | 'original';
  mostrarZonasSeguras: boolean;
  audioMonitorAtivo: boolean;
}

export interface ExportNodeConfig extends BaseNodeConfig {
  formatoContainer: 'mp4' | 'mov';
  codecVideo: 'h264' | 'hevc' | 'prores';
  taxaBitsKbps: number;
  taxaAudioKbps: number;
  otimizarWeb: boolean;
}

export type AnyNodeConfig =
  | CleanupNodeConfig
  | SubtitleNodeConfig
  | HighlightsNodeConfig
  | TitleNodeConfig
  | ZoomNodeConfig
  | FormatNodeConfig
  | VideoInputNodeConfig
  | TranscribeNodeConfig
  | SpeechErrorsNodeConfig
  | BrandNodeConfig
  | PreviewNodeConfig
  | ExportNodeConfig
  | BaseNodeConfig;

export interface WorkflowNodeData {
  name: string;
  category: NodeCategory;
  nodeType: NodeType;
  version: number;
  status: NodeExecutionStatus;
  errorMessage?: string;
  config: AnyNodeConfig;
  onRetry?: (nodeId: string) => void;
}

export interface WorkflowNode {
  id: string;
  type: string; // 'customWorkflowNode'
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  version: number;
  stylePresetId: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
