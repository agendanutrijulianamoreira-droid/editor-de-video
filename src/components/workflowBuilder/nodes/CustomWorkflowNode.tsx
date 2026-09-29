import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Video,
  Mic,
  Scissors,
  Sparkles,
  Type,
  Zap,
  Maximize2,
  Subtitles,
  Stamp,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { WorkflowNodeData, NodeCategory, NodeType } from '../../../types/workflow';

const CATEGORY_COLORS: Record<NodeCategory, { border: string; badge: string; text: string }> = {
  Entrada: { border: 'border-blue-500/30', badge: 'bg-blue-500/10 text-blue-400', text: 'text-blue-400' },
  Áudio: { border: 'border-violet-500/30', badge: 'bg-violet-500/10 text-violet-400', text: 'text-violet-400' },
  Edição: { border: 'border-cyan-500/30', badge: 'bg-cyan-500/10 text-cyan-400', text: 'text-cyan-400' },
  Inteligência: { border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-400', text: 'text-amber-400' },
  Branding: { border: 'border-pink-500/30', badge: 'bg-pink-500/10 text-pink-400', text: 'text-pink-400' },
  Revisão: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400', text: 'text-emerald-400' },
  Saída: { border: 'border-indigo-500/30', badge: 'bg-indigo-500/10 text-indigo-400', text: 'text-indigo-400' },
};

const NODE_ICONS: Record<NodeType, React.ElementType> = {
  'video-input': Video,
  transcribe: Mic,
  cleanup: Scissors,
  'speech-errors': Zap,
  highlights: Sparkles,
  title: Type,
  zoom: Maximize2,
  format: Maximize2,
  subtitles: Subtitles,
  brand: Stamp,
  preview: Eye,
  export: Download,
};

function getNodeSummary(data: WorkflowNodeData): string {
  const { nodeType, config } = data;
  switch (nodeType) {
    case 'video-input':
      return `${(config as any)?.resolucaoDesejada || '1080p'} · ${(config as any)?.framerateFps || 60}fps`;
    case 'cleanup':
      return `Silêncio ≥ ${(config as any)?.duracaoMinimaSilencioSec || 0.4}s`;
    case 'transcribe':
      return `${(config as any)?.idioma || 'pt-BR'} · Auto pontuação`;
    case 'speech-errors':
      return 'Gagueiras & Vícios';
    case 'highlights':
      return `Até ${(config as any)?.quantidadeMaximaDestaques || 6} marcações`;
    case 'title':
      return `Tom ${(config as any)?.tom || 'urgente'}`;
    case 'zoom':
      return `Escala ${(config as any)?.escalaMaximaPercent || 115}%`;
    case 'format':
      return (config as any)?.aspectRatio || '9:16';
    case 'subtitles':
      return `${(config as any)?.maximoPalavras || 3} pal. / bloco`;
    case 'brand':
      return `Posição ${(config as any)?.posicao || 'topo-dir'}`;
    case 'preview':
      return 'Safe zones ativas';
    case 'export':
      return `${((config as any)?.taxaBitsKbps ? Math.round((config as any).taxaBitsKbps / 1000) : 18)} Mbps · MP4`;
    default:
      return 'Configurado';
  }
}

export const CustomWorkflowNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const colors = CATEGORY_COLORS[nodeData.category] || CATEGORY_COLORS.Edição;
  const IconComponent = NODE_ICONS[nodeData.nodeType] || Zap;
  const isError = nodeData.status === 'error';
  const isRunning = nodeData.status === 'running';
  const isQueued = nodeData.status === 'queued';
  const isSuccess = nodeData.status === 'success';

  return (
    <div
      className={`relative min-w-[210px] max-w-[240px] rounded-xl border bg-slate-900/95 backdrop-blur-md p-3.5 shadow-xl transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500 border-blue-400/80 shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700'
      } ${isError ? 'border-red-500/80 bg-red-950/20' : ''}`}
    >
      {/* Input Handle (exceto nós de Entrada) */}
      {nodeData.category !== 'Entrada' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !-left-1.5 !bg-slate-700 !border-2 !border-slate-900 hover:!bg-blue-400 transition-colors"
        />
      )}

      {/* Header com Categoria e Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded ${colors.badge}`}>
          {nodeData.category}
        </span>

        {/* Indicador de Status */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          {isRunning && (
            <span className="flex items-center gap-1 text-blue-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="text-[10px]">processando</span>
            </span>
          )}
          {isQueued && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3 h-3 animate-pulse" />
              <span className="text-[10px]">na fila</span>
            </span>
          )}
          {isSuccess && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px]">ok</span>
            </span>
          )}
          {isError && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px]">erro</span>
            </span>
          )}
          {nodeData.status === 'idle' && (
            <span className="w-2 h-2 rounded-full bg-slate-600" />
          )}
        </div>
      </div>

      {/* Título do Nó e Ícone */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`p-1.5 rounded-lg bg-slate-800 border ${colors.border}`}>
          <IconComponent className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="truncate">
          <h4 className="text-xs font-semibold text-slate-100 truncate">{nodeData.name}</h4>
          <p className="text-[11px] text-slate-400 truncate">{getNodeSummary(nodeData)}</p>
        </div>
      </div>

      {/* Se houver erro, exibe botão contextual "Tentar novamente" */}
      {isError && (
        <div className="mt-2 pt-2 border-t border-red-500/20">
          <div className="text-[10px] text-red-300 leading-tight mb-2 line-clamp-2">
            {nodeData.errorMessage || 'Falha de processamento'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (nodeData.onRetry) {
                nodeData.onRetry(id);
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Output Handle (exceto nós de Saída) */}
      {nodeData.category !== 'Saída' && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !-right-1.5 !bg-slate-700 !border-2 !border-slate-900 hover:!bg-blue-400 transition-colors"
        />
      )}
    </div>
  );
});

CustomWorkflowNode.displayName = 'CustomWorkflowNode';
