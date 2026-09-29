import React from 'react';
import {
  Plus,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Scissors,
  FileVideo,
  Film,
  Layers,
} from 'lucide-react';
import { Project } from '../../types/project';
import { Workflow } from '../../types/workflow';

interface DashboardViewProps {
  projects: Project[];
  workflows: Workflow[];
  onNewVideo: () => void;
  onOpenWorkflow: (workflowId: string) => void;
  onViewAllProjects: () => void;
  onViewAllWorkflows: () => void;
  onOpenProject: (projectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  workflows,
  onNewVideo,
  onOpenWorkflow,
  onViewAllProjects,
  onViewAllWorkflows,
  onOpenProject,
}) => {
  const favoriteWorkflows = workflows.filter((w) => w.isFavorite);
  const processingProjects = projects.filter((p) => p.status === 'processing');
  const recentProjects = projects.slice(0, 4);

  // Estatísticas calculadas com base nos dados
  const totalCuts = projects.reduce((acc, p) => acc + p.cutsCount, 0);
  const totalSubtitled = projects.reduce((acc, p) => acc + p.wordsSubtitled, 0);
  const totalHoursSavedApprox = (totalCuts * 0.15).toFixed(1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Banner Principal com Chamada Rápida */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Editor Inteligente por Workflows</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Automatize a edição de vídeos verticais com nós personalizáveis
          </h2>
          <p className="mt-2 text-xs md:text-sm text-slate-400 leading-relaxed">
            Elimine pausas, sincronize legendas de alto impacto e aplique títulos virais
            através de pipelines visuais reutilizáveis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewVideo}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo vídeo</span>
          </button>
        </div>
      </div>

      {/* Estatísticas Simples (Tabular Numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Vídeos Renderizados
          </div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums">
            {projects.filter((p) => p.status === 'completed').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Em alta fidelidade 1080p
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Pausas & Erros Cortados
          </div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums">
            {totalCuts}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <Scissors className="w-3 h-3" />
            <span>Remoção cirúrgica</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Palavras Legendadas
          </div>
          <div className="text-2xl font-bold text-slate-100 tabular-nums">
            {totalSubtitled}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Com realce de ênfase
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Tempo Economizado
          </div>
          <div className="text-2xl font-bold text-blue-400 tabular-nums">
            ~{totalHoursSavedApprox}h
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Estimativa de corte manual
          </div>
        </div>
      </div>

      {/* Se houver vídeos em processamento */}
      {processingProjects.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/15">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Vídeos em processamento ativo
              </h3>
            </div>
            <span className="text-xs text-amber-400/80 font-mono">
              {processingProjects.length} na fila
            </span>
          </div>

          <div className="space-y-2">
            {processingProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Workflow: {p.workflowName} · {p.format}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                  <span>Processando pipeline...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid com Workflows Favoritos e Projetos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflows Favoritos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Workflows Favoritos</span>
            </h3>
            <button
              onClick={onViewAllWorkflows}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Ver todos ({workflows.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoriteWorkflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => onOpenWorkflow(wf.id)}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span>{wf.nodes.length} nós no canvas</span>
                    <span className="font-mono">v{wf.version}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {wf.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {wf.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[10px] uppercase tracking-wide">Abrir Editor</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 text-blue-400 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projetos Recentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-slate-400" />
              <span>Projetos Recentes</span>
            </h3>
            <button
              onClick={onViewAllProjects}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Ver todos ({projects.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {recentProjects.map((p) => {
              const isCompleted = p.status === 'completed';
              const isProcessing = p.status === 'processing';

              return (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      <Film className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{p.workflowName}</span>
                        <span>·</span>
                        <span className="font-mono">{p.format}</span>
                        <span>·</span>
                        <span className="tabular-nums">{p.durationSeconds}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Concluído
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                          <Clock className="w-3 h-3 animate-spin" />
                          Renderizando
                        </span>
                      )}
                      {!isCompleted && !isProcessing && (
                        <span className="text-[10px] text-slate-400">Rascunho</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
