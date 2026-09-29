import React from 'react';
import {
  Home,
  FolderKanban,
  Zap,
  GitFork,
  Palette,
  Settings,
  Film,
  Menu,
  X,
} from 'lucide-react';

export type NavigationTab =
  | 'inicio'
  | 'projetos'
  | 'edicao-rapida'
  | 'workflows'
  | 'meu-estilo'
  | 'configuracoes';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMobileOpen: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onToggleMobile,
}) => {
  const menuItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'projetos', label: 'Projetos', icon: FolderKanban },
    { id: 'edicao-rapida', label: 'Edição rápida', icon: Zap },
    { id: 'workflows', label: 'Workflows', icon: GitFork },
    { id: 'meu-estilo', label: 'Meu estilo', icon: Palette },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ] as const;

  const content = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 text-slate-300 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white leading-none">
              VideoFlow AI
            </h1>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
              Studio Suite
            </span>
          </div>
        </div>

        {/* Fechar mobile drawer */}
        <button
          onClick={onToggleMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (isMobileOpen) onToggleMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Ambiente</span>
            <span className="text-emerald-400 font-mono text-[10px]">Ativo</span>
          </div>
          <div className="text-[11px] text-slate-300 font-medium truncate">
            Modo Visual Nodes
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Engine Desacoplado · v1.0
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 h-screen sticky top-0">
        {content}
      </div>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onToggleMobile}
          />
          <div className="relative z-50 flex h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
