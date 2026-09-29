import React, { useState } from 'react';
import {
  Video,
  Mic,
  Scissors,
  Maximize2,
  Subtitles,
  Zap,
  Sparkles,
  Type,
  Stamp,
  Eye,
  Download,
  Plus,
  Search,
} from 'lucide-react';
import { NodeCategory, NodeType } from '../../types/workflow';

interface NodeSidebarProps {
  onAddNode: (category: NodeCategory, nodeType: NodeType, name: string) => void;
}

interface NodeDefinition {
  type: NodeType;
  name: string;
  category: NodeCategory;
  description: string;
  icon: React.ElementType;
}

const AVAILABLE_NODES: NodeDefinition[] = [
  // Entrada
  {
    type: 'video-input',
    name: 'Vídeo',
    category: 'Entrada',
    description: 'Ponto de entrada do arquivo bruto gravado',
    icon: Video,
  },
  // Áudio
  {
    type: 'transcribe',
    name: 'Transcrever',
    category: 'Áudio',
    description: 'Conversão fonética de voz em texto com timestamps',
    icon: Mic,
  },
  // Edição
  {
    type: 'cleanup',
    name: 'Limpeza',
    category: 'Edição',
    description: 'Corte automático de pausas e repetições',
    icon: Scissors,
  },
  {
    type: 'zoom',
    name: 'Zoom',
    category: 'Edição',
    description: 'Zoom dinâmico para retenção visual',
    icon: Maximize2,
  },
  {
    type: 'format',
    name: 'Formato',
    category: 'Edição',
    description: 'Ajuste de proporção (9:16, 4:5, 16:9)',
    icon: Maximize2,
  },
  {
    type: 'subtitles',
    name: 'Legendas',
    category: 'Edição',
    description: 'Renderização de legendas sincronizadas',
    icon: Subtitles,
  },
  // Inteligência
  {
    type: 'speech-errors',
    name: 'Erros de fala',
    category: 'Inteligência',
    description: 'Detecção de gagueiras, vícios e hesitações',
    icon: Zap,
  },
  {
    type: 'highlights',
    name: 'Destaques',
    category: 'Inteligência',
    description: 'Marcação semântica de momentos cruciais',
    icon: Sparkles,
  },
  {
    type: 'title',
    name: 'Título',
    category: 'Inteligência',
    description: 'Geração de ganchos virais e títulos visuais',
    icon: Type,
  },
  // Branding
  {
    type: 'brand',
    name: 'Marca',
    category: 'Branding',
    description: 'Logotipos, marcas d\'água e safe zones',
    icon: Stamp,
  },
  // Revisão
  {
    type: 'preview',
    name: 'Preview',
    category: 'Revisão',
    description: 'Buffer de monitoramento antes da exportação',
    icon: Eye,
  },
  // Saída
  {
    type: 'export',
    name: 'Exportar',
    category: 'Saída',
    description: 'Empacotamento final em MP4 / ProRes',
    icon: Download,
  },
];

const CATEGORIES: NodeCategory[] = [
  'Entrada',
  'Áudio',
  'Edição',
  'Inteligência',
  'Branding',
  'Revisão',
  'Saída',
];

export const NodeSidebar: React.FC<NodeSidebarProps> = ({ onAddNode }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = AVAILABLE_NODES.filter((n) =>
    n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, node: NodeDefinition) => {
    e.dataTransfer.setData('application/videoflow-node', JSON.stringify({
      category: node.category,
      nodeType: node.type,
      name: node.name,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/95 flex flex-col h-full z-10 select-none">
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Biblioteca de Nós
        </h3>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar nó..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {CATEGORIES.map((category) => {
          const categoryNodes = filteredNodes.filter((n) => n.category === category);
          if (categoryNodes.length === 0) return null;

          return (
            <div key={category} className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                {category}
              </span>
              <div className="space-y-1">
                {categoryNodes.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node)}
                      onClick={() => onAddNode(node.category, node.type, node.name)}
                      className="group flex items-center justify-between p-2 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/70 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1 rounded bg-slate-900 text-slate-300 group-hover:text-blue-400 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                            {node.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {node.description}
                          </div>
                        </div>
                      </div>
                      <button
                        title="Adicionar nó ao canvas"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-400 transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
