import React from 'react';
import { Menu, Plus, Sparkles, FolderPlus } from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavigationTab;
  onToggleMobile: () => void;
  onNewVideo: () => void;
}

const TAB_TITLES: Record<NavigationTab, { title: string; breadcrumb: string }> = {
  inicio: { title: 'Visão Geral', breadcrumb: 'Dashboard' },
  projetos: { title: 'Todos os Projetos', breadcrumb: 'Projetos' },
  'edicao-rapida': { title: 'Edição Rápida', breadcrumb: 'Pipeline Expresso' },
  workflows: { title: 'Biblioteca de Workflows', breadcrumb: 'Automações' },
  'meu-estilo': { title: 'Meu Estilo (Presets)', breadcrumb: 'Branding & Presets' },
  configuracoes: { title: 'Configurações de Engine', breadcrumb: 'Preferências' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleMobile,
  onNewVideo,
}) => {
  const current = TAB_TITLES[activeTab];

  return (
    <header className="h-16 px-4 md:px-8 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Zona 1: Mobile Toggle + Breadcrumb / Título */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>VideoFlow</span>
          <span>/</span>
          <span className="text-slate-200 font-medium">{current.breadcrumb}</span>
        </div>
      </div>

      {/* Zona 2: Ações Principais */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo vídeo</span>
        </button>
      </div>
    </header>
  );
};
