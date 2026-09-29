import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsView } from './components/projects/ProjectsView';
import { QuickEditView } from './components/quickEdit/QuickEditView';
import { WorkflowLibraryView } from './components/workflows/WorkflowLibraryView';
import { StylePresetsView } from './components/stylePresets/StylePresetsView';
import { SettingsView } from './components/settings/SettingsView';
import { WorkflowBuilder } from './components/workflowBuilder/WorkflowBuilder';
import { ProjectDetailView } from './components/projects/ProjectDetailView';
import { LoginView } from './components/auth/LoginView';
import { useAuth } from './hooks/useAuth';
import { 
  FirebaseWorkflowRepository, 
  FirebaseStylePresetRepository, 
  FirebaseProjectRepository,
  FirebaseVideoStorageAdapter 
} from './persistence/firebaseRepositories';
import { INITIAL_WORKFLOWS, INITIAL_STYLE_PRESET } from './persistence/storage';
import { Workflow } from './types/workflow';
import { StylePreset } from './types/stylePreset';
import { Project } from './types/project';
import { EditDecisionList } from './types/edl';
import { RenderJob } from './types/renderJob';
import { TranscriptionResult } from './types/transcription';
import { EDLGeneratorService } from './services/EDLGeneratorService';
import { WorkflowCompiler } from './engine/WorkflowCompiler';
import { 
  FirebaseTranscriptionRepository, 
  FirebaseAnalysisRepository, 
  FirebaseUsageRepository,
  FirebaseRenderRepository
} from './persistence/firebaseRepositories';
import { calculateHash, calculateStringHash } from './utils/hash';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { db } from './lib/firebase';
import { AnalysisView } from './components/analysis/AnalysisView';

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Repositories
  const workflowRepo = useMemo(() => new FirebaseWorkflowRepository(), []);
  const presetRepo = useMemo(() => new FirebaseStylePresetRepository(), []);
  const projectRepo = useMemo(() => new FirebaseProjectRepository(), []);
  const storageAdapter = useMemo(() => new FirebaseVideoStorageAdapter(), []);
  
  const transcriptionRepo = useMemo(() => new FirebaseTranscriptionRepository(), []);
  const analysisRepo = useMemo(() => new FirebaseAnalysisRepository(), []);
  const usageRepo = useMemo(() => new FirebaseUsageRepository(), []);
  const renderRepo = useMemo(() => new FirebaseRenderRepository(), []);

  const edlService = useMemo(() => new EDLGeneratorService(transcriptionRepo, analysisRepo, usageRepo), [transcriptionRepo, analysisRepo, usageRepo]);

  // Application Data
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeJobs, setActiveJobs] = useState<Record<string, RenderJob | null>>({});
  const [dataLoading, setDataLoading] = useState(false);

  // Real-time tracking of jobs
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'render_jobs'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobMap: Record<string, RenderJob | null> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.userId === user.uid) {
           const job = {
             ...data,
             id: d.id,
             startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
             completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt
           } as RenderJob;
           
           if (!jobMap[job.projectId] || new Date(job.startedAt) >= new Date(jobMap[job.projectId]!.startedAt)) {
             jobMap[job.projectId] = job;
           }
        }
      });
      setActiveJobs(prev => ({ ...prev, ...jobMap }));
    });

    return () => unsubscribe();
  }, [user]);

  // Active View States
  const [builderWorkflowId, setBuilderWorkflowId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [activeEDL, setActiveEDL] = useState<EditDecisionList | null>(null);
  const [activeTranscription, setActiveTranscription] = useState<TranscriptionResult | null>(null);

  // Load Data when User changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setWorkflows([]);
      setPresets([]);
      setProjects([]);
      setIsAnalysisMode(false);
      setActiveEDL(null);
      setActiveJobs({});
    }
  }, [user]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [wfs, prs, projs] = await Promise.all([
        workflowRepo.getAll(),
        presetRepo.getAll(),
        projectRepo.getAll()
      ]);

      // Seeding if empty
      if (wfs.length === 0 && prs.length === 0) {
        console.log('Seeding initial data for user...');
        const initialPreset = { ...INITIAL_STYLE_PRESET, userId: user!.uid };
        await presetRepo.save(initialPreset);
        
        for (const wf of INITIAL_WORKFLOWS) {
          await workflowRepo.save({ ...wf, userId: user!.uid });
        }
        
        // Reload after seed
        const [wfs2, prs2] = await Promise.all([
          workflowRepo.getAll(),
          presetRepo.getAll()
        ]);
        setWorkflows(wfs2);
        setPresets(prs2);
      } else {
        setWorkflows(wfs);
        setPresets(prs);
      }
      
      setProjects(projs);

      // Load active jobs for projects
      const jobs = await Promise.all(projs.map(p => renderRepo.getAllByProject(p.id)));
      const jobMap: Record<string, RenderJob | null> = {};
      jobs.forEach((projectJobs, i) => {
        jobMap[projs[i].id] = projectJobs[0] || null; // Latest job
      });
      setActiveJobs(jobMap);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const refreshAllData = () => loadAllData();

  // Handlers
  const handleOpenBuilder = (wfId: string) => {
    setBuilderWorkflowId(wfId);
    setActiveProjectId(null);
    setIsAnalysisMode(false);
  };

  const handleOpenProject = (projId: string) => {
    setActiveProjectId(projId);
    setBuilderWorkflowId(null);
    setIsAnalysisMode(false);
  };

  const handleBackToLibrary = () => {
    setBuilderWorkflowId(null);
    setActiveProjectId(null);
    setIsAnalysisMode(false);
    setActiveTab('workflows');
    refreshAllData();
  };

  const handleStartAnalysis = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.videoUrl) throw new Error('Projeto inválido');

    const workflow = workflows.find(w => w.id === project.workflowId);
    if (!workflow) throw new Error('Workflow não encontrado');

    // Calculate hash if not present
    let sourceHash = project.sourceHash || '';
    if (!sourceHash) {
       sourceHash = project.originalVideoPath || project.id; 
    }

    const transcription = await edlService.transcribe(projectId, project.videoUrl, sourceHash);
    const edl = await edlService.analyze(projectId, transcription, workflow);

    setActiveTranscription(transcription);
    setActiveEDL(edl);
    setIsAnalysisMode(true);
  };

  const handleStartRender = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.videoUrl) return;

    const workflow = workflows.find(w => w.id === project.workflowId);
    if (!workflow) return;

    const edl = await analysisRepo.getByTranscriptHash(calculateStringHash(project.sourceHash || project.id));
    if (!edl) return;

    const preset = presets.find(p => p.id === project.stylePresetId || p.id === workflow.stylePresetId);
    if (!preset) return;

    const plan = WorkflowCompiler.compile({
      workflow,
      edl,
      stylePreset: preset,
      videoMetadata: {
        url: project.videoUrl,
        duration: project.durationSeconds,
        width: project.width || 1080,
        height: project.height || 1920,
        fps: 30
      },
      userId: user!.uid
    });

    const jobId = `job-${Date.now()}`;
    const jobData = {
      projectId,
      userId: user!.uid,
      originalDuration: project.durationSeconds,
      cutsCount: edl.speechIssues.filter(i => i.humanDecision === 'remove').length
    };

    // Chamar API de Renderização (A API criará o Job no Firestore)
    fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        renderPlan: plan, 
        jobId, 
        jobData,
        renderPlanHash: calculateStringHash(JSON.stringify(plan))
      })
    }).catch(console.error);
  };

  const handleCancelRender = async (jobId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar a renderização?')) return;
    
    try {
      await fetch('/api/render-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
    } catch (error) {
      console.error('Failed to cancel render:', error);
    }
  };

  const handleUpdateEDL = async (updated: EditDecisionList) => {
    setActiveEDL(updated);
    await analysisRepo.save(updated);
  };

  const handleSaveWorkflow = async (updatedWf: Workflow) => {
    await workflowRepo.save(updatedWf);
    setWorkflows(await workflowRepo.getAll());
  };

  const handleCreateWorkflow = async (name: string, description: string) => {
    const newId = `wf-${Date.now()}`;
    const newWf: Workflow = {
      id: newId,
      userId: user!.uid,
      name,
      description,
      version: 1,
      stylePresetId: presets[0]?.id || 'preset-juliana-premium',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'n-input',
          type: 'customWorkflowNode',
          position: { x: 50, y: 150 },
          data: {
            name: 'Vídeo Bruto',
            category: 'Entrada',
            nodeType: 'video-input',
            version: 1,
            status: 'idle',
            config: { resolucaoDesejada: '1080p', framerateFps: 60 },
          },
        },
        {
          id: 'n-export',
          type: 'customWorkflowNode',
          position: { x: 450, y: 150 },
          data: {
            name: 'Exportar MP4',
            category: 'Saída',
            nodeType: 'export',
            version: 1,
            status: 'idle',
            config: { codecVideo: 'h264', taxaBitsKbps: 18000 },
          },
        },
      ],
      edges: [
        { id: 'e-input-export', source: 'n-input', target: 'n-export' },
      ],
    };

    await workflowRepo.save(newWf);
    setWorkflows(await workflowRepo.getAll());
    setBuilderWorkflowId(newWf.id);
  };

  const handleDuplicateWorkflow = async (id: string) => {
    const copy = await workflowRepo.duplicate(id);
    if (copy) setWorkflows(await workflowRepo.getAll());
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este workflow?')) {
      await workflowRepo.delete(id);
      setWorkflows(await workflowRepo.getAll());
    }
  };

  const handleRenameWorkflow = async (id: string, newName: string) => {
    const wf = await workflowRepo.getById(id);
    if (wf) {
      wf.name = newName;
      await workflowRepo.save(wf);
      setWorkflows(await workflowRepo.getAll());
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await workflowRepo.toggleFavorite(id);
    setWorkflows(await workflowRepo.getAll());
  };

  const handleSavePreset = async (preset: StylePreset) => {
    await presetRepo.save(preset);
    setPresets(await presetRepo.getAll());
  };

  const handleCompleteProject = async (newProject: Project) => {
    await projectRepo.save(newProject);
    const updated = await projectRepo.getAll();
    setProjects(updated);
    setActiveProjectId(newProject.id);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Excluir projeto e arquivo de vídeo permanentemente?')) {
      await projectRepo.delete(projectId);
      setProjects(await projectRepo.getAll());
      setActiveProjectId(null);
    }
  };

  // Auth Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={login} loading={authLoading} />;
  }

  // Views Logic
  const activeBuilderWorkflow = builderWorkflowId
    ? workflows.find((w) => w.id === builderWorkflowId) || null
    : null;

  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId) || null
    : null;

  if (activeBuilderWorkflow) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
        <WorkflowBuilder
          workflow={activeBuilderWorkflow}
          presets={presets}
          onSaveWorkflow={handleSaveWorkflow}
          onBackToLibrary={handleBackToLibrary}
        />
      </div>
    );
  }

  if (isAnalysisMode && activeEDL && activeTranscription && activeProject) {
    return (
      <AnalysisView
        videoUrl={activeProject.videoUrl!}
        edl={activeEDL}
        transcription={activeTranscription}
        onUpdateEDL={handleUpdateEDL}
        onBack={() => setIsAnalysisMode(false)}
      />
    );
  }

  if (activeProject) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(t) => { setActiveTab(t); setActiveProjectId(null); setIsAnalysisMode(false); }}
          isMobileOpen={isMobileMenuOpen}
          onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            activeTab={activeTab}
            onToggleMobile={() => setIsMobileMenuOpen(true)}
            onNewVideo={() => { setActiveTab('edicao-rapida'); setActiveProjectId(null); setIsAnalysisMode(false); }}
          />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <ProjectDetailView
              project={activeProject}
              workflows={workflows}
              presets={presets}
              activeJob={activeJobs[activeProject.id] || null}
              onBack={() => setActiveProjectId(null)}
              onDelete={handleDeleteProject}
              onUpdateProject={async (p) => { await projectRepo.save(p); setProjects(await projectRepo.getAll()); }}
              onOpenWorkflow={handleOpenBuilder}
              onStartAnalysis={handleStartAnalysis}
              onStartRender={handleStartRender}
              onCancelRender={handleCancelRender}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileMenuOpen}
        onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onToggleMobile={() => setIsMobileMenuOpen(true)}
          onNewVideo={() => setActiveTab('edicao-rapida')}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {dataLoading && (
            <div className="fixed top-20 right-8 z-50 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 flex items-center gap-3 shadow-xl">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sincronizando Nuvem</span>
            </div>
          )}

          {activeTab === 'inicio' && (
            <DashboardView
              projects={projects}
              workflows={workflows}
              onNewVideo={() => setActiveTab('edicao-rapida')}
              onOpenWorkflow={handleOpenBuilder}
              onViewAllProjects={() => setActiveTab('projetos')}
              onViewAllWorkflows={() => setActiveTab('workflows')}
              onOpenProject={handleOpenProject}
            />
          )}

          {activeTab === 'projetos' && (
            <ProjectsView
              projects={projects}
              onNewVideo={() => setActiveTab('edicao-rapida')}
              onDeleteProject={handleDeleteProject}
              // @ts-ignore
              onOpenProject={handleOpenProject}
            />
          )}

          {activeTab === 'edicao-rapida' && (
            <QuickEditView
              workflows={workflows}
              onCompleteProject={handleCompleteProject}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowLibraryView
              workflows={workflows}
              onOpenBuilder={handleOpenBuilder}
              onCreateWorkflow={handleCreateWorkflow}
              onDuplicateWorkflow={handleDuplicateWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onRenameWorkflow={handleRenameWorkflow}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === 'meu-estilo' && (
            <StylePresetsView
              presets={presets}
              onSavePreset={handleSavePreset}
              onCreatePreset={handleSavePreset}
            />
          )}

          {activeTab === 'configuracoes' && (
            <SettingsView onResetStorage={refreshAllData} user={user} onLogout={logout} />
          )}
        </main>
      </div>
    </div>
  );
}
