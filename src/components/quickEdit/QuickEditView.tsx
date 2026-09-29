import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileVideo,
  Sparkles,
  Scissors,
  Zap,
  Subtitles,
  Maximize2,
  Type,
  CheckCircle2,
  Play,
  RotateCcw,
  Sliders,
  Check,
  Film,
  AlertCircle,
} from 'lucide-react';
import { Workflow } from '../../types/workflow';
import { Project } from '../../types/project';
import { FirebaseVideoStorageAdapter } from '../../persistence/firebaseRepositories';
import { auth } from '../../lib/firebase';
import { calculateHash } from '../../utils/hash';

interface QuickEditViewProps {
  workflows: Workflow[];
  onCompleteProject: (newProject: Project) => void;
}

export const QuickEditView: React.FC<QuickEditViewProps> = ({
  workflows,
  onCompleteProject,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<{
    duration: number;
    width: number;
    height: number;
    aspectRatio: string;
  } | null>(null);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    workflows[0]?.id || ''
  );

  // Estados de simulação / processamento real de upload
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato de arquivo não suportado. Use MP4, MOV ou WebM.');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('O arquivo é muito grande (limite de 500MB).');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Extrair metadados usando um elemento de vídeo temporário
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const ratio = video.videoWidth > video.videoHeight ? '16:9' : (video.videoHeight > video.videoWidth ? '9:16' : '1:1');
      setMetadata({
        duration: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: ratio
      });
    };
    video.src = URL.createObjectURL(file);
  };

  const handleStartProcessing = async () => {
    if (!selectedFile || !metadata || !auth.currentUser) return;

    setIsProcessing(true);
    setError(null);
    setStatusMessage('Iniciando upload seguro...');

    try {
      const storage = new FirebaseVideoStorageAdapter();
      const projectId = `proj-${Date.now()}`;
      const uid = auth.currentUser.uid;
      const extension = selectedFile.name.split('.').pop();
      const storagePath = `users/${uid}/${projectId}/original/video.${extension}`;

      setStatusMessage('Calculando identificação única (Hash)...');
      const hash = await calculateHash(selectedFile);

      // Upload Real
      const downloadUrl = await storage.upload(selectedFile, storagePath, (pct) => {
        setUploadProgress(pct);
        setStatusMessage(`Fazendo upload: ${Math.round(pct)}%`);
      });

      setStatusMessage('Sincronizando manifesto do projeto...');

      const newProj: Project = {
        id: projectId,
        userId: uid,
        name: `Projeto ${selectedFile.name.replace(/\.[^/.]+$/, '')}`,
        workflowId: currentWorkflow.id,
        workflowName: currentWorkflow.name,
        stylePresetId: currentWorkflow.stylePresetId,
        status: 'ready',
        durationSeconds: metadata.duration,
        format: metadata.aspectRatio as any,
        thumbnailUrl: '',
        videoUrl: downloadUrl,
        sourceHash: hash, // Store hash
        originalVideoPath: storagePath,
        originalFilename: selectedFile.name,
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.aspectRatio,
        fileSize: parseFloat((selectedFile.size / (1024 * 1024)).toFixed(1)),
        mimeType: selectedFile.type,
        cutsCount: 0,
        wordsSubtitled: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onCompleteProject(newProj);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao processar upload. Verifique sua conexão.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Edição Rápida de Vídeo
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Faça upload de uma gravação bruta e inicie um pipeline automatizado.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 1. Área de Upload Real */}
      <div
        onClick={() => !selectedFile && !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          selectedFile
            ? 'border-blue-500/40 bg-slate-900/60'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 cursor-pointer'
        } ${isProcessing ? 'opacity-50 cursor-default' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileVideo className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-100">{selectedFile.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                  {metadata ? `${metadata.width}x${metadata.height} · ${metadata.duration}s · ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB` : 'Lendo metadados...'}
                </div>
              </div>
            </div>

            {!isProcessing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setMetadata(null);
                }}
                className="text-xs text-slate-400 hover:text-red-400 underline underline-offset-4 transition-colors"
              >
                Trocar arquivo
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-blue-400 shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Arraste seu vídeo aqui</p>
              <p className="text-xs text-slate-400 mt-1">ou clique para selecionar (MP4, MOV, WebM)</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Seleção de Workflow */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Workflow de Destino
            </label>
            <div className="text-sm font-semibold text-white">
              {currentWorkflow?.name || 'Selecione um workflow'}
            </div>
          </div>

          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            disabled={isProcessing}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Opções Visuais (mantendo apenas como indicação do que será feito) */}
        <div className="border-t border-slate-800/60 pt-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Recursos inclusos neste workflow
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentWorkflow?.nodes.map(node => (
              <div key={node.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[11px] text-slate-400">{node.data.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progresso do Upload */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-blue-300">
              <span className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>{statusMessage}</span>
              </span>
              <span className="font-mono tabular-nums">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleStartProcessing}
            disabled={!selectedFile || isProcessing || !metadata}
            className={`w-full py-4 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              !selectedFile || isProcessing || !metadata
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 active:scale-[0.99]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Enviando mídia...' : 'Enviar e Preparar Edição'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
