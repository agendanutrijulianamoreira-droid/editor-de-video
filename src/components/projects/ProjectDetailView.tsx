import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Clock, 
  Maximize2, 
  Settings, 
  GitFork, 
  Palette, 
  CheckCircle2, 
  AlertTriangle,
  Film,
  Trash2,
  ExternalLink,
  ChevronRight,
  Info,
  RotateCcw
} from 'lucide-react';
import { Project } from '../../types/project';
import { Workflow } from '../../types/workflow';
import { StylePreset } from '../../types/stylePreset';
import { RenderJob } from '../../types/renderJob';

interface ProjectDetailViewProps {
  project: Project;
  workflows: Workflow[];
  presets: StylePreset[];
  activeJob: RenderJob | null;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdateProject: (proj: Project) => void;
  onOpenWorkflow: (id: string) => void;
  onStartAnalysis: (id: string) => Promise<void>;
  onStartRender: (id: string) => Promise<void>;
  onCancelRender: (id: string) => Promise<void>;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  workflows,
  presets,
  activeJob,
  onBack,
  onDelete,
  onUpdateProject,
  onOpenWorkflow,
  onStartAnalysis,
  onStartRender,
  onCancelRender
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(project.durationSeconds || 0);
  const [isReadyForProcessing, setIsReadyForProcessing] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isAnalyzing, setIsProcessingReal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Se já houver um job completado ou processando, consideramos pronto
  const hasSuccessfulRender = activeJob?.status === 'completed';
  const isRendering = activeJob?.status === 'queued' || activeJob?.status === 'claimed' || activeJob?.status === 'preparing' || activeJob?.status === 'rendering' || activeJob?.status === 'uploading';
  const isCancelled = activeJob?.status === 'cancelled' || activeJob?.cancelRequested;

  const currentWorkflow = workflows.find(w => w.id === project.workflowId);
  const currentPreset = presets.find(p => p.id === project.stylePresetId || p.id === currentWorkflow?.stylePresetId);

  useEffect(() => {
    if (project.status === 'ready' || project.status === 'processing') {
      setIsReadyForProcessing(true);
    }
  }, [project.status]);

  useEffect(() => {
    if (videoRef.current) {
      const v = videoRef.current;
      const updateTime = () => setCurrentTime(v.currentTime);
      const updateDuration = () => setDuration(v.duration);
      v.addEventListener('timeupdate', updateTime);
      v.addEventListener('loadedmetadata', updateDuration);
      return () => {
        v.removeEventListener('timeupdate', updateTime);
        v.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrepareEdition = async () => {
    // Validação real
    if (!project.videoUrl && !project.originalVideoPath) {
      setValidationMessage('Erro: Arquivo de vídeo não encontrado.');
      return;
    }
    if (!currentWorkflow) {
      setValidationMessage('Erro: Workflow não selecionado ou inválido.');
      return;
    }
    if (currentWorkflow.nodes.length === 0) {
      setValidationMessage('Erro: Workflow não possui nós configurados.');
      return;
    }
    if (!currentPreset) {
      setValidationMessage('Erro: Style Preset não encontrado.');
      return;
    }

    setIsProcessingReal(true);
    setValidationMessage('Iniciando pipeline inteligente...');
    
    try {
      await onStartAnalysis(project.id);
      setIsReadyForProcessing(true);
      setValidationMessage('Projeto pronto para renderização.');
      onUpdateProject({ ...project, status: 'ready' });
    } catch (err: any) {
      setValidationMessage(`Erro no processamento: ${err.message}`);
    } finally {
      setIsProcessingReal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header com Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{project.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{project.originalFilename || 'Original'}</span>
              <span>·</span>
              <span className="font-mono text-blue-400 uppercase tracking-wider">{hasSuccessfulRender ? 'Renderizado' : project.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`p-2 rounded-lg transition-colors ${showDiagnostics ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Diagnóstico técnico"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
            title="Excluir projeto"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showDiagnostics && activeJob?.diagnostics && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/30 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4" />
              Diagnóstico de Renderização (QA)
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Job ID: {activeJob.id}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Duração (S/E/O)</div>
              <div className="text-xs font-mono text-slate-300">
                {activeJob.diagnostics.sourceDuration.toFixed(2)}s / 
                {activeJob.diagnostics.expectedDuration.toFixed(2)}s / 
                {activeJob.diagnostics.outputDuration.toFixed(2)}s
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Resolução (In/Out)</div>
              <div className="text-xs font-mono text-slate-300">
                {activeJob.diagnostics.sourceWidth}x{activeJob.diagnostics.sourceHeight} → 
                {activeJob.diagnostics.outputWidth}x{activeJob.diagnostics.outputHeight}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">FPS (In/Out)</div>
              <div className="text-xs font-mono text-slate-300">
                {activeJob.diagnostics.sourceFPS.toFixed(2)} → {activeJob.diagnostics.outputFPS.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Codecs</div>
              <div className="text-xs font-mono text-slate-300 uppercase">
                {activeJob.diagnostics.videoCodec} / {activeJob.diagnostics.audioCodec}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Stats Pipeline</div>
              <div className="text-xs font-mono text-slate-300">
                Cortes: {activeJob.diagnostics.numberOfCuts} | 
                Legendas: {activeJob.diagnostics.numberOfCaptions} | 
                Highlights: {activeJob.diagnostics.numberOfHighlights}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Performance</div>
              <div className="text-xs font-mono text-slate-300">
                Render: {(activeJob.diagnostics.renderDurationMs / 1000).toFixed(1)}s | 
                Size: {(activeJob.diagnostics.outputFileSize / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Sincronia (Discrepância)</div>
              <div className={`text-xs font-mono ${Math.abs(activeJob.diagnostics.outputDuration - activeJob.diagnostics.expectedDuration) < 0.1 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(activeJob.diagnostics.outputDuration - activeJob.diagnostics.expectedDuration).toFixed(3)}s
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <div className="text-[10px] text-slate-500 uppercase font-bold">Comando FFmpeg</div>
             <pre className="p-3 bg-black rounded-lg text-[9px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap">
               ffmpeg {activeJob.diagnostics.commandBuilt.join(' ')}
             </pre>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Esquerda: Player (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center group">
            {hasSuccessfulRender && activeJob?.outputUrl ? (
               <video
                 ref={videoRef}
                 src={activeJob.outputUrl}
                 controls
                 className="w-full h-full object-contain"
               />
            ) : project.videoUrl ? (
              <video
                ref={videoRef}
                src={project.videoUrl}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <Film className="w-12 h-12" />
                <p className="text-sm font-medium">Arquivo original em armazenamento privado</p>
              </div>
            )}

            {/* Overlays do Player (apenas no preview original) */}
            {!hasSuccessfulRender && project.videoUrl && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-blue-500 h-1 rounded-full cursor-pointer"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>
                      <div className="text-[11px] font-mono text-slate-200 tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparativo Antes/Depois se houver render */}
          {hasSuccessfulRender && activeJob && (
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Original</div>
                  <div className="flex items-center justify-between">
                     <div className="text-lg font-bold text-slate-300">{formatTime(activeJob.originalDuration || 0)}</div>
                     <div className="text-xs text-slate-500">{project.fileSize} MB</div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-900/10 border border-blue-500/30">
                  <div className="text-[10px] text-blue-500 uppercase font-bold mb-2">Resultado Final</div>
                  <div className="flex items-center justify-between">
                     <div className="text-lg font-bold text-blue-400">{formatTime(activeJob.finalDuration || 0)}</div>
                     <div className="text-xs text-blue-500">{activeJob.finalSize} MB</div>
                  </div>
                </div>
             </div>
          )}

          {/* Metadados Técnicos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Duração</div>
              <div className="text-sm font-semibold text-slate-200 tabular-nums">{formatTime(project.durationSeconds || duration)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Resolução</div>
              <div className="text-sm font-semibold text-slate-200 tabular-nums">{project.width || '-'}x{project.height || '-'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Proporção</div>
              <div className="text-sm font-semibold text-slate-200 font-mono uppercase">{project.aspectRatio || project.format}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Cortes</div>
              <div className="text-sm font-semibold text-slate-200 tabular-nums">{activeJob?.cutsCount || project.cutsCount || 0}</div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Configurações & Ações (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status de Renderização */}
          {isRendering && (
            <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/30 space-y-4 shadow-lg shadow-blue-600/5">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-blue-400 animate-spin" />
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">Renderizando Vídeo...</h3>
                      <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">{activeJob?.currentOperation || 'Preparando pipeline'}</p>
                    </div>
                  </div>
                  <span className="text-lg font-mono font-bold text-blue-400">{activeJob?.progress || 0}%</span>
               </div>
               <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${activeJob?.progress || 0}%` }}
                  />
               </div>
               <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    O processamento continua mesmo se você sair desta página.
                  </p>
                  <button 
                    onClick={() => activeJob && onCancelRender(activeJob.id)}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    Cancelar
                  </button>
               </div>
            </div>
          )}

          {/* Associações */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              <span>Configuração do Pipeline</span>
            </h3>

            {/* Workflow Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Workflow Ativo</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
                  <GitFork className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{currentWorkflow?.name || 'Selecione um workflow'}</div>
                  <div className="text-[10px] text-slate-400">v{currentWorkflow?.version || 1} · {currentWorkflow?.nodes.length || 0} nós</div>
                </div>
                <button 
                  onClick={() => currentWorkflow && onOpenWorkflow(currentWorkflow.id)}
                  className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Style Preset Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Style Preset</label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-2 rounded-lg bg-amber-600/10 text-amber-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{currentPreset?.name || 'Vínculo do Workflow'}</div>
                  <div className="text-[10px] text-slate-400">Identidade visual e ritmo de corte</div>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentPreset?.corDestaque }} />
              </div>
            </div>
          </div>

          {/* Status e Preparação */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status do Projeto</h3>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                hasSuccessfulRender ? 'bg-emerald-500/10 text-emerald-400' : (isReadyForProcessing ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500')
              }`}>
                {hasSuccessfulRender ? 'Concluído' : (isReadyForProcessing ? 'Pronto para Render' : 'Análise Pendente')}
              </div>
            </div>

            {validationMessage && (
              <div className={`p-3 rounded-xl flex items-start gap-3 text-xs border ${
                isReadyForProcessing 
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                  : (validationMessage.includes('Erro') ? 'bg-red-950/20 border-red-500/30 text-red-300' : 'bg-blue-950/20 border-blue-500/30 text-blue-300')
              }`}>
                {isReadyForProcessing ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : (validationMessage.includes('Erro') ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <RotateCcw className="w-4 h-4 shrink-0 animate-spin" />)}
                <p>{validationMessage}</p>
              </div>
            )}

            {!isReadyForProcessing ? (
              <button
                onClick={handlePrepareEdition}
                disabled={isAnalyzing}
                className="w-full py-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAnalyzing ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                <span>{isAnalyzing ? 'Analisando Discurso...' : 'Analisar e Preparar'}</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => onStartRender(project.id)}
                  disabled={isRendering}
                  className={`w-full py-4 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-3 ${
                    isRendering
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : (hasSuccessfulRender ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20')
                  }`}
                >
                  <Film className="w-5 h-5" />
                  <span>{hasSuccessfulRender ? 'Renderizar novamente' : (isRendering ? 'Processando...' : 'Iniciar Renderização Real')}</span>
                </button>
                
                {hasSuccessfulRender && activeJob?.outputUrl && (
                  <a 
                    href={activeJob.outputUrl}
                    download
                    className="w-full py-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Baixar Vídeo Editado</span>
                  </a>
                )}
              </div>
            )}

            {!isReadyForProcessing && (
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                Clique acima para validar os metadados, discursos e sincronizar o pipeline antes da renderização física.
              </p>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center gap-3 text-slate-400">
            <Info className="w-4 h-4 text-blue-400" />
            <p className="text-[11px] leading-relaxed">
              O FFmpeg agora executa operações de corte, redimensionamento para 9:16 e queima de legendas com destaque de palavras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
