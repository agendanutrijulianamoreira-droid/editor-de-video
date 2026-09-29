import React, { useState } from 'react';
import {
  Settings,
  Database,
  Cpu,
  Server,
  Cloud,
  Layers,
  FileCode,
  CheckCircle2,
  HardDrive,
  RotateCcw,
  Download,
  Upload,
} from 'lucide-react';
import { LocalPersistence } from '../../persistence/storage';

interface SettingsViewProps {
  onResetStorage: () => void;
  user: any;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetStorage, user, onLogout }) => {
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleExportData = () => {
    const data = {
      workflows: LocalPersistence.getWorkflows(),
      presets: LocalPersistence.getPresets(),
      projects: LocalPersistence.getProjects(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `videoflow_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmReset = () => {
    if (window.confirm('Deseja realmente restaurar os dados iniciais do VideoFlow AI?')) {
      localStorage.clear();
      onResetStorage();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Configurações & Arquitetura
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Visão dos adaptadores preparados e manutenção da persistência local.
        </p>
      </div>

      {/* Seção 0: Conta do Usuário */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Server className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{user?.displayName || 'Usuário VideoFlow'}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-300 text-xs font-semibold border border-red-800/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>

      {/* Seção 1: Adaptadores Futuros Preparados */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Interfaces & Adaptadores para Próximas Fases</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            A camada do engine (<code className="text-blue-300 font-mono text-[11px]">src/engine/interfaces.ts</code>) foi desacoplada
            da interface React. Os contratos abaixo estão prontos para receber implementações reais:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* Adapter 1: FFmpeg */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">IFFmpegProcessor</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/40 px-1.5 py-0.5 rounded">
                Pronto para WASM
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cortes por timestamp, enquadramento dinâmico e queima de legendas.
            </p>
          </div>

          {/* Adapter 2: Gemini */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">IAIGeminiAdapter</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/40 px-1.5 py-0.5 rounded">
                Pronto para SDK
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Geração de títulos, análise de dores/benefícios e sugestão de cortes.
            </p>
          </div>

          {/* Adapter 3: Transcrição */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">ITranscriptionAdapter</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/40 px-1.5 py-0.5 rounded">
                Pronto para Whisper
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Alinhamento temporal palavra por palavra e pontuação automática.
            </p>
          </div>

          {/* Adapter 4: Supabase / Database */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">IDatabaseAdapter</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/40 px-1.5 py-0.5 rounded">
                Pronto para PostgreSQL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sincronização na nuvem dos grafos de nós e style presets.
            </p>
          </div>

          {/* Adapter 5: Armazenamento de Vídeo */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">IVideoStorageAdapter</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/40 px-1.5 py-0.5 rounded">
                Pronto para S3 / GCS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Uploads multipart, pré-visualização HLS e arquivos finais.
            </p>
          </div>

          {/* Adapter 6: Fila de Processamento */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">IJobQueueAdapter</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/40 px-1.5 py-0.5 rounded">
                Pronto para Workers
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Fila assíncrona para renderizações pesadas em segundo plano.
            </p>
          </div>
        </div>
      </div>

      {/* Seção 2: Persistência Local & Backup */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Persistência Local (LocalStorage)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Nesta primeira etapa, todos os workflows, presets e projetos são armazenados localmente no navegador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <button
            onClick={handleConfirmReset}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-semibold border border-red-800/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Workflows Iniciais</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dados resetados para os padrões iniciais com sucesso!</span>
          </div>
        )}
      </div>
    </div>
  );
};
