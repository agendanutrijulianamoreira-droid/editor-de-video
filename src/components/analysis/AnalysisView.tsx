import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Scissors, 
  Subtitles, 
  Sparkles, 
  Type, 
  Maximize2,
  Trash2,
  RotateCcw,
  Volume2,
  Info,
  ArrowLeft
} from 'lucide-react';
import { EditDecisionList, SpeechIssue, Highlight, TitleSuggestion, CaptionBlock } from '../../types/edl';
import { TranscriptionResult } from '../../types/transcription';

interface AnalysisViewProps {
  videoUrl: string;
  edl: EditDecisionList;
  transcription: TranscriptionResult;
  onUpdateEDL: (updated: EditDecisionList) => void;
  onBack: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  videoUrl,
  edl,
  transcription,
  onUpdateEDL,
  onBack
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'transcript' | 'cuts' | 'captions' | 'highlights' | 'title' | 'zoom'>('transcript');
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Approved cuts for simulation
  const approvedCuts = useMemo(() => {
    return edl.speechIssues.filter(i => 
      i.humanDecision === 'remove' || (i.status === 'auto_remove_candidate' && i.humanDecision !== 'keep')
    ).sort((a, b) => a.start - b.start);
  }, [edl.speechIssues]);

  // Stats for conceptual preview
  const stats = useMemo(() => {
    const originalDuration = transcription.duration;
    const removedDuration = approvedCuts.reduce((acc, i) => acc + i.duration, 0);
    
    return {
      original: originalDuration,
      predicted: originalDuration - removedDuration,
      removed: removedDuration,
      cuts: edl.speechIssues.length,
      highlights: edl.highlights.length,
      zooms: edl.zoomEvents.length
    };
  }, [edl, transcription, approvedCuts]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    
    const updateTime = () => {
      const time = v.currentTime;
      setCurrentTime(time);

      // Simulation Logic: Skip approved cuts
      if (isSimulationMode && !v.seeking) {
        const currentCut = approvedCuts.find(cut => time >= cut.start - 0.05 && time < cut.end);
        if (currentCut) {
          v.currentTime = currentCut.end;
        }
      }
    };

    v.addEventListener('timeupdate', updateTime);
    return () => v.removeEventListener('timeupdate', updateTime);
  }, [isSimulationMode, approvedCuts]);

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDecision = (issueId: string, decision: 'keep' | 'remove') => {
    const updatedIssues = edl.speechIssues.map(i => 
      i.id === issueId ? { ...i, humanDecision: decision, decisionSource: 'human' as const } : i
    );
    onUpdateEDL({ ...edl, speechIssues: updatedIssues });
  };

  const handleTitleSelect = (title: string) => {
    onUpdateEDL({ ...edl, activeTitle: title });
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Análise do Vídeo</h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              <span>Pipeline: EDL v{edl.edlVersion}</span>
              <span>·</span>
              <span className="text-blue-400">Pronto para Revisão</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-slate-800 rounded-xl p-1 shadow-inner">
            <button 
              onClick={() => setIsSimulationMode(false)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${!isSimulationMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Original
            </button>
            <button 
              onClick={() => setIsSimulationMode(true)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${isSimulationMode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Simulação
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Original</div>
              <div className="text-xs font-mono tabular-nums">{formatTime(stats.original)}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-700" />
            <div className="text-right">
              <div className="text-[10px] text-blue-500 uppercase font-bold">Previsto</div>
              <div className="text-xs font-mono tabular-nums text-blue-400">{formatTime(stats.predicted)}</div>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all">
            Exportar EDL Final
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Player Section */}
        <div className="w-1/2 lg:w-3/5 flex flex-col p-6 space-y-6 overflow-y-auto">
          <div className={`bg-black rounded-3xl border aspect-video relative overflow-hidden shadow-2xl group transition-colors ${isSimulationMode ? 'border-blue-500/50 shadow-blue-500/5' : 'border-slate-800'}`}>
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {isSimulationMode && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg animate-pulse">
                <Sparkles className="w-3 h-3" />
                Modo Simulação Ativo
              </div>
            )}
            
            {/* Player Controls overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()} className="text-white hover:text-blue-400 transition-colors">
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                    <div className="text-xs font-mono text-slate-200 tabular-nums">
                      {formatTime(currentTime)} / {formatTime(stats.original)}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Scissors className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cortes</span>
              </div>
              <div className="text-xl font-bold">{stats.cuts}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
               <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Highlights</span>
              </div>
              <div className="text-xl font-bold">{stats.highlights}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
               <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Zooms</span>
              </div>
              <div className="text-xl font-bold">{stats.zooms}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
               <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Removido</span>
              </div>
              <div className="text-xl font-bold text-blue-400">{stats.removed.toFixed(1)}s</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-900/10 border border-blue-800/30 flex items-start gap-4">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              Esta é uma representação visual das decisões da EDL. A renderização real pelo FFmpeg manterá as marcações que você aprovar nesta tela.
            </div>
          </div>
        </div>

        {/* Right: Analysis Panel */}
        <div className="flex-1 border-l border-slate-800 bg-slate-900/40 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center px-4 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'transcript', label: 'Transcrição', icon: Subtitles },
              { id: 'cuts', label: 'Cortes', icon: Scissors },
              { id: 'captions', label: 'Legendas', icon: Type },
              { id: 'highlights', label: 'Destaques', icon: Sparkles },
              { id: 'title', label: 'Título', icon: Type },
              { id: 'zoom', label: 'Zoom', icon: Maximize2 }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                  activeTab === t.id 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* 1. Interactive Transcript */}
            {activeTab === 'transcript' && (
              <div className="space-y-4">
                <div className="prose prose-invert max-w-none">
                  {transcription.segments.map(seg => (
                    <div key={seg.id} className="mb-4 group cursor-pointer" onClick={() => seekTo(seg.start)}>
                      <div className="text-[10px] font-mono text-slate-500 mb-1 group-hover:text-blue-400 transition-colors">
                        {formatTime(seg.start)}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {transcription.words
                          .filter(w => w.start >= seg.start && w.end <= seg.end)
                          .map((w, idx) => (
                            <span 
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); seekTo(w.start); }}
                              className={`mr-1 px-0.5 rounded transition-all hover:bg-blue-600/30 hover:text-white ${
                                currentTime >= w.start && currentTime <= w.end 
                                  ? 'bg-blue-500/20 text-blue-300 font-semibold border-b border-blue-500' 
                                  : ''
                              }`}
                            >
                              {w.word}
                            </span>
                          ))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Cuts Review */}
            {activeTab === 'cuts' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 mb-4">{edl.speechIssues.length} sugestões de edição</h3>
                {edl.speechIssues.map(issue => (
                  <div 
                    key={issue.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      issue.humanDecision === 'remove' ? 'bg-red-950/10 border-red-900/50' : 
                      issue.humanDecision === 'keep' ? 'bg-emerald-950/10 border-emerald-900/50' :
                      'bg-slate-900/50 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                            issue.type === 'silence' 
                              ? (issue.status === 'keep' ? 'bg-emerald-500/10 text-emerald-400' : (issue.status === 'review' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400')) 
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {issue.type === 'silence' 
                              ? (issue.status === 'keep' ? 'Silêncio Natural' : (issue.status === 'review' ? 'Silêncio Candidato' : 'Silêncio Morto')) 
                              : issue.type === 'error' ? 'Erro de fala' : 'Repetição'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {formatTime(issue.start)} → {formatTime(issue.end)}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                           {issue.duration.toFixed(2)}s
                         </span>
                         <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${
                           issue.decisionSource === 'human' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'
                         }`}>
                           {issue.decisionSource === 'human' ? 'Revisado' : (issue.decisionSource === 'suggested' ? 'IA Sugeriu' : 'Auto')}
                         </span>
                       </div>
                    </div>

                    <p className="text-xs text-slate-300 mb-4 italic">"{issue.message}"</p>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => seekTo(issue.start)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Ouvir
                      </button>
                      <button 
                         onClick={() => handleDecision(issue.id, 'keep')}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-xl transition-all ${
                           issue.humanDecision === 'keep' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-emerald-900/20 hover:text-emerald-400'
                         }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Manter
                      </button>
                      <button 
                         onClick={() => handleDecision(issue.id, 'remove')}
                         className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-xl transition-all ${
                           issue.humanDecision === 'remove' ? 'bg-red-600 border-red-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-red-900/20 hover:text-red-400'
                         }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Captions Preview */}
            {activeTab === 'captions' && (
              <div className="grid grid-cols-1 gap-3">
                {edl.captions.map(block => (
                   <div key={block.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => seekTo(block.start)}>
                     <div className="text-[10px] font-mono text-slate-500 mb-2">
                        {formatTime(block.start)}
                     </div>
                     <p className="text-sm font-semibold text-slate-200 text-center bg-black/40 py-4 rounded-xl border border-white/5">
                       {block.text}
                     </p>
                   </div>
                ))}
              </div>
            )}

            {/* 4. Highlights */}
            {activeTab === 'highlights' && (
              <div className="space-y-3">
                {edl.highlights.map(h => (
                   <div key={h.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between group cursor-pointer" onClick={() => seekTo(h.start)}>
                     <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          h.category === 'benefit' ? 'bg-emerald-400' : h.category === 'pain' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                        <div>
                          <div className="text-xs font-bold text-slate-200">{h.text}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">{h.category}</div>
                        </div>
                     </div>
                     <div className="text-[10px] font-mono text-slate-500 group-hover:text-blue-400 transition-colors">
                        {formatTime(h.start)}
                     </div>
                   </div>
                ))}
              </div>
            )}

            {/* 5. Title Suggestions */}
            {activeTab === 'title' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {edl.titleSuggestions.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => handleTitleSelect(t.text)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        edl.activeTitle === t.text 
                          ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20' 
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t.strategy}</span>
                        {edl.activeTitle === t.text && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-base font-bold text-white">{t.text}</div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-slate-800">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Título Customizado</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Escreva seu próprio título..."
                      value={edl.activeTitle || ''}
                      onChange={(e) => handleTitleSelect(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. Zoom Events */}
            {activeTab === 'zoom' && (
              <div className="space-y-3">
                 {edl.zoomEvents.map(z => (
                   <div key={z.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between group cursor-pointer" onClick={() => seekTo(z.timestamp)}>
                     <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
                           <Maximize2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{z.reason}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest">Escala: {Math.round(z.scale * 100)}%</div>
                        </div>
                     </div>
                     <div className="text-[10px] font-mono text-slate-500">
                        {formatTime(z.timestamp)}
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
