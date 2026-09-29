import React, { useState } from 'react';
import {
  Plus,
  GitFork,
  Star,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  Check,
  X,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Workflow } from '../../types/workflow';

interface WorkflowLibraryViewProps {
  workflows: Workflow[];
  onOpenBuilder: (workflowId: string) => void;
  onCreateWorkflow: (name: string, description: string) => void;
  onDuplicateWorkflow: (workflowId: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onRenameWorkflow: (workflowId: string, newName: string) => void;
  onToggleFavorite: (workflowId: string) => void;
}

export const WorkflowLibraryView: React.FC<WorkflowLibraryViewProps> = ({
  workflows,
  onOpenBuilder,
  onCreateWorkflow,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onRenameWorkflow,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');

  // Renomear inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRename = (wf: Workflow) => {
    setEditingId(wf.id);
    setEditName(wf.name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRenameWorkflow(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;
    onCreateWorkflow(newWfName.trim(), newWfDesc.trim());
    setNewWfName('');
    setNewWfDesc('');
    setIsCreatingModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Biblioteca de Workflows
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Pipelines automatizados de processamento audiovisual por nós conectados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar workflow..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => setIsCreatingModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Workflow</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filtered.map((wf) => {
          const isEditing = editingId === wf.id;

          return (
            <div
              key={wf.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Versão, Favorito & Ações Rápidas */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      v{wf.version}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {wf.nodes.length} nós · {wf.edges.length} conexões
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleFavorite(wf.id)}
                      title={wf.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                      className={`p-1.5 rounded-md transition-colors ${
                        wf.isFavorite
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${wf.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleStartRename(wf)}
                      title="Renomear"
                      className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicateWorkflow(wf.id)}
                      title="Duplicar"
                      className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteWorkflow(wf.id)}
                      title="Excluir"
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Título & Descrição */}
                {isEditing ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-950 border border-blue-500 rounded px-2 py-1 text-sm text-white font-semibold flex-1 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(wf.id)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {wf.name}
                  </h3>
                )}

                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {wf.description}
                </p>

                {/* Preview dos nós incluídos */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {wf.nodes.slice(0, 6).map((node) => (
                    <span
                      key={node.id}
                      className="text-[10px] text-slate-400 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-md"
                    >
                      {node.data.name}
                    </span>
                  ))}
                  {wf.nodes.length > 6 && (
                    <span className="text-[10px] text-slate-400 px-1 py-0.5">
                      +{wf.nodes.length - 6}
                    </span>
                  )}
                </div>
              </div>

              {/* Ação: Abrir no Workflow Builder */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(wf.updatedAt).toLocaleDateString('pt-BR')}
                </span>

                <button
                  onClick={() => onOpenBuilder(wf.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-semibold transition-all group-hover:bg-blue-600 group-hover:text-white"
                >
                  <span>Abrir no Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar Novo Workflow */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Criar Novo Workflow</h3>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Nome do Workflow</label>
                <input
                  type="text"
                  placeholder="Ex: Reel de Notícias Rápidas"
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Descrição</label>
                <textarea
                  placeholder="Descreva o propósito deste pipeline..."
                  value={newWfDesc}
                  onChange={(e) => setNewWfDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Criar e Abrir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
