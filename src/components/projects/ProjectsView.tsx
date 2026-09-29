import React, { useState } from 'react';
import {
  FileVideo,
  Film,
  Search,
  CheckCircle2,
  Clock,
  Scissors,
  Subtitles,
  Download,
  Trash2,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Project, ProjectStatus } from '../../types/project';

interface ProjectsViewProps {
  projects: Project[];
  onNewVideo: () => void;
  onDeleteProject: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onNewVideo,
  onDeleteProject,
  onOpenProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Projetos de Vídeo
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Biblioteca de vídeos gerados, cortes e renderizações processadas.
          </p>
        </div>

        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo vídeo</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'ready', label: 'Prontos' },
            { id: 'processing', label: 'Em Processamento' },
            { id: 'completed', label: 'Concluídos' },
            { id: 'draft', label: 'Rascunhos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou workflow..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista / Grid de Projetos */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <FileVideo className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Nenhum projeto encontrado</p>
          <p className="text-xs text-slate-500">
            Experimente mudar os filtros ou crie um novo vídeo na Edição Rápida.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => {
            const isCompleted = proj.status === 'completed';
            const isProcessing = proj.status === 'processing';
            const isReady = proj.status === 'ready';

            return (
              <div
                key={proj.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Video Card */}
                <div
                  onClick={() => onOpenProject(proj.id)}
                  className="h-44 bg-slate-950 relative flex items-center justify-center cursor-pointer group overflow-hidden border-b border-slate-800/80"
                >
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />

                  <div
                    className={`rounded-lg border border-slate-800 bg-slate-900 flex flex-col items-center justify-center transition-transform group-hover:scale-105 ${
                      proj.format === '9:16'
                        ? 'w-20 h-36'
                        : proj.format === '4:5'
                        ? 'w-24 h-32'
                        : 'w-44 h-24'
                    }`}
                  >
                    <Film className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <span className="text-[9px] text-slate-400 font-mono mt-1">
                      {proj.format}
                    </span>
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 backdrop-blur-md">
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluído
                      </span>
                    )}
                    {isProcessing && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3 h-3 animate-spin" />
                        Renderizando
                      </span>
                    )}
                    {isReady && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Pronto
                      </span>
                    )}
                    {!isCompleted && !isProcessing && !isReady && (
                      <span className="text-slate-400">Rascunho</span>
                    )}
                  </div>

                  {/* Duração */}
                  <div className="absolute bottom-3 right-3 text-[11px] font-mono tabular-nums text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                    {proj.durationSeconds}s
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">
                      {proj.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="text-blue-400 font-medium">{proj.workflowName}</span>
                      <span>·</span>
                      <span className="font-mono">{proj.fileSize} MB</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(proj.createdAt).toLocaleDateString('pt-BR')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenProject(proj.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-400 hover:text-white hover:bg-blue-600 rounded transition-colors"
                      >
                        Abrir
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
