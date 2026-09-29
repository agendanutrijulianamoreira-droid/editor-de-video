/**
 * VideoFlow AI - Camada de Persistência Local
 * 
 * Gerencia Style Presets, Workflows e Projetos no localStorage.
 * Inicializa dados padrão caso o storage esteja vazio.
 */

import { Workflow, WorkflowNode, WorkflowEdge } from '../types/workflow';
import { StylePreset } from '../types/stylePreset';
import { Project } from '../types/project';

const STORAGE_KEYS = {
  WORKFLOWS: 'videoflow_workflows_v1',
  PRESETS: 'videoflow_presets_v1',
  PROJECTS: 'videoflow_projects_v1',
  ACTIVE_WORKFLOW_ID: 'videoflow_active_wf_id',
};

// Logotipo em SVG embutido para independência de serviços externos
const EMBEDDED_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230F172A"/><path d="M30 25L75 50L30 75V25Z" fill="%2338BDF8"/><circle cx="72" cy="28" r="8" fill="%23F43F5E"/></svg>`;

export const INITIAL_STYLE_PRESET: StylePreset = {
  id: 'preset-juliana-premium',
  userId: 'system',
  name: 'Juliana Premium',
  description: 'Estética minimalista com realces luminosos ciano, cortes dinâmicos e títulos de alto impacto.',
  fontePrincipal: 'Cabinet Grotesk',
  fonteLegendas: 'Plus Jakarta Sans',
  corPrincipal: '#FFFFFF',
  corDestaque: '#38BDF8', // Sky 400
  logo: EMBEDDED_LOGO_SVG,
  palavrasPorBloco: 3,
  linhasMaximas: 2,
  posicaoLegenda: 'bottom',
  estiloDestaque: 'glow',
  posicaoTitulo: 'top',
  duracaoTitulo: 3.5,
  intensidadeZoom: 'moderada',
  estiloCortes: 'dinamico',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-28T05:00:00.000Z',
};

export const SECONDARY_STYLE_PRESET: StylePreset = {
  id: 'preset-bold-educator',
  userId: 'system',
  name: 'Bold Educativo',
  description: 'Foco em clareza didática com legendas em bloco âmbar e cortes conservadores de fala.',
  fontePrincipal: 'Plus Jakarta Sans',
  fonteLegendas: 'Satoshi',
  corPrincipal: '#F8FAFC',
  corDestaque: '#F59E0B', // Amber 500
  logo: EMBEDDED_LOGO_SVG,
  palavrasPorBloco: 4,
  linhasMaximas: 2,
  posicaoLegenda: 'bottom',
  estiloDestaque: 'box',
  posicaoTitulo: 'hook-banner',
  duracaoTitulo: 4.0,
  intensidadeZoom: 'suave',
  estiloCortes: 'ritmico',
  createdAt: '2026-09-10T14:30:00.000Z',
  updatedAt: '2026-09-28T05:00:00.000Z',
};

// Helper para montar nós padronizados
function createMockNode(
  id: string,
  name: string,
  category: WorkflowNode['data']['category'],
  nodeType: WorkflowNode['data']['nodeType'],
  x: number,
  y: number,
  config: WorkflowNode['data']['config']
): WorkflowNode {
  return {
    id,
    type: 'customWorkflowNode',
    position: { x, y },
    data: {
      name,
      category,
      nodeType,
      version: 1,
      status: 'idle',
      config,
    },
  };
}

function createMockEdge(source: string, target: string): WorkflowEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    animated: false,
  };
}

// 1. Reel Premium
const REEL_PREMIUM_NODES: WorkflowNode[] = [
  createMockNode('n1', 'Entrada de Vídeo', 'Entrada', 'video-input', 40, 180, {
    origem: 'upload',
    resolucaoDesejada: '1080p',
    framerateFps: 60,
    maxDuracaoMinutos: 3,
  }),
  createMockNode('n2', 'Limpeza de Silêncio', 'Edição', 'cleanup', 320, 100, {
    removerSilencio: true,
    duracaoMinimaSilencioSec: 0.35,
    preservarPausasNaturais: true,
    removerRepeticoes: true,
    agressividade: 'alta',
    comportamentoDuvida: 'marcar-revisao',
  }),
  createMockNode('n3', 'Transcrição AI', 'Áudio', 'transcribe', 320, 290, {
    idioma: 'pt-BR',
    deteccaoLocutores: true,
    pontuacaoAutomatica: true,
    removerRuidoAudio: true,
  }),
  createMockNode('n4', 'Erros de Fala', 'Inteligência', 'speech-errors', 600, 100, {
    removerGagueira: true,
    removerViciosLinguagem: true,
    removerFalsosInicios: true,
    sensibilidade: 'equilibrada',
  }),
  createMockNode('n5', 'Destaques Semânticos', 'Inteligência', 'highlights', 600, 290, {
    numeros: true,
    dores: true,
    beneficios: true,
    alertas: true,
    palavrasChave: true,
    quantidadeMaximaDestaques: 6,
    intensidadeVisual: 'chamativa',
  }),
  createMockNode('n6', 'Título Viral', 'Inteligência', 'title', 880, 100, {
    geracaoAutomatica: true,
    objetivo: 'retencao',
    maximoPalavras: 8,
    tom: 'urgente',
    posicao: 'topo',
    duracaoSec: 3.5,
    evitarClickbait: true,
    evitarPromessasExageradas: true,
  }),
  createMockNode('n7', 'Zoom Dinâmico', 'Edição', 'zoom', 880, 290, {
    ativar: true,
    frequencia: 'enfase-destaques',
    intensidade: 'padrao',
    escalaMaximaPercent: 118,
    evitarMudancasBruscas: true,
  }),
  createMockNode('n8', 'Legendas Sincronizadas', 'Edição', 'subtitles', 1160, 100, {
    stylePresetId: 'preset-juliana-premium',
    fonte: 'Plus Jakarta Sans',
    tamanho: 24,
    posicao: 'inferior',
    maximoPalavras: 3,
    maximoLinhas: 2,
    animacao: 'pop',
    destaquePalavras: true,
  }),
  createMockNode('n9', 'Formato 9:16', 'Edição', 'format', 1160, 290, {
    aspectRatio: '9:16',
    enquadramentoInteligente: true,
    preenchimentoFundo: 'desfoque',
  }),
  createMockNode('n10', 'Identidade da Marca', 'Branding', 'brand', 1440, 100, {
    logoUrl: EMBEDDED_LOGO_SVG,
    posicao: 'topo-direita',
    opacidadePercent: 90,
    tamanhoPercent: 12,
    marcaDaguaAtiva: true,
  }),
  createMockNode('n11', 'Preview & Monitor', 'Revisão', 'preview', 1440, 290, {
    qualidadePreview: 'alta',
    mostrarZonasSeguras: true,
    audioMonitorAtivo: true,
  }),
  createMockNode('n12', 'Exportar Vídeo Final', 'Saída', 'export', 1720, 190, {
    formatoContainer: 'mp4',
    codecVideo: 'h264',
    taxaBitsKbps: 18000,
    taxaAudioKbps: 320,
    otimizarWeb: true,
  }),
];

const REEL_PREMIUM_EDGES: WorkflowEdge[] = [
  createMockEdge('n1', 'n2'),
  createMockEdge('n1', 'n3'),
  createMockEdge('n2', 'n4'),
  createMockEdge('n3', 'n5'),
  createMockEdge('n4', 'n6'),
  createMockEdge('n5', 'n7'),
  createMockEdge('n6', 'n8'),
  createMockEdge('n7', 'n9'),
  createMockEdge('n8', 'n10'),
  createMockEdge('n9', 'n11'),
  createMockEdge('n10', 'n12'),
  createMockEdge('n11', 'n12'),
];

// 2. Reel Educativo
const REEL_EDUCATIVO_NODES: WorkflowNode[] = [
  createMockNode('edu-1', 'Vídeo da Aula', 'Entrada', 'video-input', 40, 180, {
    origem: 'upload',
    resolucaoDesejada: '1080p',
    framerateFps: 30,
    maxDuracaoMinutos: 5,
  }),
  createMockNode('edu-2', 'Transcrição Didática', 'Áudio', 'transcribe', 320, 180, {
    idioma: 'pt-BR',
    deteccaoLocutores: false,
    pontuacaoAutomatica: true,
    removerRuidoAudio: true,
  }),
  createMockNode('edu-3', 'Limpeza Suave', 'Edição', 'cleanup', 600, 180, {
    removerSilencio: true,
    duracaoMinimaSilencioSec: 0.5,
    preservarPausasNaturais: true,
    removerRepeticoes: false,
    agressividade: 'baixa',
    comportamentoDuvida: 'manter',
  }),
  createMockNode('edu-4', 'Destaque de Conceitos', 'Inteligência', 'highlights', 880, 180, {
    numeros: true,
    dores: false,
    beneficios: true,
    alertas: true,
    palavrasChave: true,
    quantidadeMaximaDestaques: 4,
    intensidadeVisual: 'moderada',
  }),
  createMockNode('edu-5', 'Legendas com Destaque', 'Edição', 'subtitles', 1160, 180, {
    stylePresetId: 'preset-bold-educator',
    fonte: 'Satoshi',
    tamanho: 22,
    posicao: 'inferior',
    maximoPalavras: 4,
    maximoLinhas: 2,
    animacao: 'fade',
    destaquePalavras: true,
  }),
  createMockNode('edu-6', 'Exportação Otimizada', 'Saída', 'export', 1440, 180, {
    formatoContainer: 'mp4',
    codecVideo: 'h264',
    taxaBitsKbps: 12000,
    taxaAudioKbps: 192,
    otimizarWeb: true,
  }),
];

const REEL_EDUCATIVO_EDGES: WorkflowEdge[] = [
  createMockEdge('edu-1', 'edu-2'),
  createMockEdge('edu-2', 'edu-3'),
  createMockEdge('edu-3', 'edu-4'),
  createMockEdge('edu-4', 'edu-5'),
  createMockEdge('edu-5', 'edu-6'),
];

// 3. Reel de Venda
const REEL_VENDA_NODES: WorkflowNode[] = [
  createMockNode('venda-1', 'Gravação de Pitch', 'Entrada', 'video-input', 40, 180, {
    origem: 'upload',
    resolucaoDesejada: '1080p',
    framerateFps: 60,
    maxDuracaoMinutos: 2,
  }),
  createMockNode('venda-2', 'Limpeza Rápida', 'Edição', 'cleanup', 320, 180, {
    removerSilencio: true,
    duracaoMinimaSilencioSec: 0.3,
    preservarPausasNaturais: false,
    removerRepeticoes: true,
    agressividade: 'alta',
    comportamentoDuvida: 'remover',
  }),
  createMockNode('venda-3', 'Título Gancho Forte', 'Inteligência', 'title', 600, 180, {
    geracaoAutomatica: true,
    objetivo: 'retencao',
    maximoPalavras: 6,
    tom: 'urgente',
    posicao: 'topo',
    duracaoSec: 3.0,
    evitarClickbait: false,
    evitarPromessasExageradas: true,
  }),
  createMockNode('venda-4', 'Destaque Dores & Objeções', 'Inteligência', 'highlights', 880, 180, {
    numeros: true,
    dores: true,
    beneficios: true,
    alertas: true,
    palavrasChave: true,
    quantidadeMaximaDestaques: 8,
    intensidadeVisual: 'chamativa',
  }),
  createMockNode('venda-5', 'Legendas de Alto Contraste', 'Edição', 'subtitles', 1160, 180, {
    stylePresetId: 'preset-juliana-premium',
    fonte: 'Plus Jakarta Sans',
    tamanho: 26,
    posicao: 'inferior',
    maximoPalavras: 3,
    maximoLinhas: 1,
    animacao: 'pop',
    destaquePalavras: true,
  }),
  createMockNode('venda-6', 'Exportar MP4', 'Saída', 'export', 1440, 180, {
    formatoContainer: 'mp4',
    codecVideo: 'h264',
    taxaBitsKbps: 20000,
    taxaAudioKbps: 320,
    otimizarWeb: true,
  }),
];

const REEL_VENDA_EDGES: WorkflowEdge[] = [
  createMockEdge('venda-1', 'venda-2'),
  createMockEdge('venda-2', 'venda-3'),
  createMockEdge('venda-3', 'venda-4'),
  createMockEdge('venda-4', 'venda-5'),
  createMockEdge('venda-5', 'venda-6'),
];

// 4. Corte de Aula
const CORTE_AULA_NODES: WorkflowNode[] = [
  createMockNode('corte-1', 'Vídeo Longo (Aula)', 'Entrada', 'video-input', 40, 180, {
    origem: 'upload',
    resolucaoDesejada: '1080p',
    framerateFps: 30,
    maxDuracaoMinutos: 15,
  }),
  createMockNode('corte-2', 'Transcrição Completa', 'Áudio', 'transcribe', 320, 180, {
    idioma: 'pt-BR',
    deteccaoLocutores: true,
    pontuacaoAutomatica: true,
    removerRuidoAudio: false,
  }),
  createMockNode('corte-3', 'Corte de Pausas', 'Edição', 'cleanup', 600, 180, {
    removerSilencio: true,
    duracaoMinimaSilencioSec: 0.6,
    preservarPausasNaturais: true,
    removerRepeticoes: false,
    agressividade: 'baixa',
    comportamentoDuvida: 'manter',
  }),
  createMockNode('corte-4', 'Legenda Contínua', 'Edição', 'subtitles', 880, 180, {
    stylePresetId: 'preset-bold-educator',
    fonte: 'Satoshi',
    tamanho: 20,
    posicao: 'inferior',
    maximoPalavras: 5,
    maximoLinhas: 2,
    animacao: 'fade',
    destaquePalavras: false,
  }),
  createMockNode('corte-5', 'Exportar Horizontal 16:9', 'Saída', 'export', 1160, 180, {
    formatoContainer: 'mp4',
    codecVideo: 'h264',
    taxaBitsKbps: 14000,
    taxaAudioKbps: 192,
    otimizarWeb: true,
  }),
];

const CORTE_AULA_EDGES: WorkflowEdge[] = [
  createMockEdge('corte-1', 'corte-2'),
  createMockEdge('corte-2', 'corte-3'),
  createMockEdge('corte-3', 'corte-4'),
  createMockEdge('corte-4', 'corte-5'),
];

export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-reel-premium',
    userId: 'system',
    name: 'Reel Premium',
    description: 'Pipeline completo de alta conversão: remoção cirúrgica de erros, zoom dinâmico e legendas com realce luminoso.',
    version: 1,
    stylePresetId: 'preset-juliana-premium',
    isFavorite: true,
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-28T05:00:00.000Z',
    nodes: REEL_PREMIUM_NODES,
    edges: REEL_PREMIUM_EDGES,
  },
  {
    id: 'wf-reel-educativo',
    userId: 'system',
    name: 'Reel Educativo',
    description: 'Focado em transmissão didática clara com pausas respeitadas, termos-chave em evidência e legendas estruturadas.',
    version: 1,
    stylePresetId: 'preset-bold-educator',
    isFavorite: true,
    createdAt: '2026-09-18T11:20:00.000Z',
    updatedAt: '2026-09-27T16:00:00.000Z',
    nodes: REEL_EDUCATIVO_NODES,
    edges: REEL_EDUCATIVO_EDGES,
  },
  {
    id: 'wf-reel-venda',
    userId: 'system',
    name: 'Reel de Venda',
    description: 'Edição ágil, títulos de gancho psicológico imediato, realce de dores e chamadas para ação diretas.',
    version: 1,
    stylePresetId: 'preset-juliana-premium',
    isFavorite: false,
    createdAt: '2026-09-20T14:10:00.000Z',
    updatedAt: '2026-09-26T12:00:00.000Z',
    nodes: REEL_VENDA_NODES,
    edges: REEL_VENDA_EDGES,
  },
  {
    id: 'wf-corte-aula',
    userId: 'system',
    name: 'Corte de Aula',
    description: 'Otimizado para extrair pílulas de conhecimento de aulas densas mantendo a integridade do raciocínio e proporção.',
    version: 1,
    stylePresetId: 'preset-bold-educator',
    isFavorite: false,
    createdAt: '2026-09-22T08:45:00.000Z',
    updatedAt: '2026-09-25T17:30:00.000Z',
    nodes: CORTE_AULA_NODES,
    edges: CORTE_AULA_EDGES,
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-01',
    userId: 'system',
    name: '3 Segredos da Produtividade Real',
    workflowId: 'wf-reel-premium',
    workflowName: 'Reel Premium',
    status: 'completed',
    durationSeconds: 58,
    format: '9:16',
    thumbnailUrl: '',
    fileSize: 42.6,
    cutsCount: 18,
    wordsSubtitled: 164,
    createdAt: '2026-09-27T19:30:00.000Z',
    updatedAt: '2026-09-27T19:34:00.000Z',
  },
  {
    id: 'proj-02',
    userId: 'system',
    name: 'Como Funciona a Nutrição Esportiva',
    workflowId: 'wf-reel-educativo',
    workflowName: 'Reel Educativo',
    status: 'completed',
    durationSeconds: 84,
    format: '9:16',
    thumbnailUrl: '',
    fileSize: 61.2,
    cutsCount: 12,
    wordsSubtitled: 210,
    createdAt: '2026-09-26T14:15:00.000Z',
    updatedAt: '2026-09-26T14:21:00.000Z',
  },
  {
    id: 'proj-03',
    userId: 'system',
    name: 'Oferta Especial Turma Avançada',
    workflowId: 'wf-reel-venda',
    workflowName: 'Reel de Venda',
    status: 'processing',
    durationSeconds: 45,
    format: '9:16',
    thumbnailUrl: '',
    fileSize: 35.8,
    cutsCount: 9,
    wordsSubtitled: 120,
    createdAt: '2026-09-28T05:20:00.000Z',
    updatedAt: '2026-09-28T05:25:00.000Z',
  },
  {
    id: 'proj-04',
    userId: 'system',
    name: 'Introdução aos Macro-nutrientes',
    workflowId: 'wf-corte-aula',
    workflowName: 'Corte de Aula',
    status: 'draft',
    durationSeconds: 120,
    format: '16:9',
    thumbnailUrl: '',
    fileSize: 88.0,
    cutsCount: 6,
    wordsSubtitled: 340,
    createdAt: '2026-09-25T11:00:00.000Z',
    updatedAt: '2026-09-25T11:00:00.000Z',
  },
];

// Funções de Acesso ao Storage
export const LocalPersistence = {
  getWorkflows(): Workflow[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(INITIAL_WORKFLOWS));
        return INITIAL_WORKFLOWS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_WORKFLOWS;
    }
  },

  saveWorkflows(workflows: Workflow[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
    } catch (e) {
      console.error('Erro ao salvar workflows:', e);
    }
  },

  getWorkflowById(id: string): Workflow | null {
    const list = this.getWorkflows();
    return list.find((w) => w.id === id) || null;
  },

  saveWorkflow(workflow: Workflow): void {
    const list = this.getWorkflows();
    const index = list.findIndex((w) => w.id === workflow.id);
    const updated = { ...workflow, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveWorkflows(list);
  },

  duplicateWorkflow(id: string): Workflow | null {
    const original = this.getWorkflowById(id);
    if (!original) return null;

    const copy: Workflow = {
      ...original,
      id: `wf-${Date.now()}`,
      name: `${original.name} (Cópia)`,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: original.nodes.map((n) => ({
        ...n,
        id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        data: { ...n.data, status: 'idle' },
      })),
      edges: original.edges.map((e) => ({
        ...e,
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    const list = this.getWorkflows();
    list.unshift(copy);
    this.saveWorkflows(list);
    return copy;
  },

  deleteWorkflow(id: string): boolean {
    const list = this.getWorkflows();
    const filtered = list.filter((w) => w.id !== id);
    if (filtered.length === list.length) return false;
    this.saveWorkflows(filtered);
    return true;
  },

  toggleFavorite(id: string): void {
    const list = this.getWorkflows();
    const target = list.find((w) => w.id === id);
    if (target) {
      target.isFavorite = !target.isFavorite;
      target.updatedAt = new Date().toISOString();
      this.saveWorkflows(list);
    }
  },

  getPresets(): StylePreset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (!data) {
        const initial = [INITIAL_STYLE_PRESET, SECONDARY_STYLE_PRESET];
        localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [INITIAL_STYLE_PRESET, SECONDARY_STYLE_PRESET];
    }
  },

  savePreset(preset: StylePreset): void {
    const list = this.getPresets();
    const index = list.findIndex((p) => p.id === preset.id);
    const updated = { ...preset, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(list));
  },

  getPresetById(id: string): StylePreset | null {
    const list = this.getPresets();
    return list.find((p) => p.id === id) || null;
  },

  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
        return INITIAL_PROJECTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PROJECTS;
    }
  },

  saveProject(project: Project): void {
    const list = this.getProjects();
    const index = list.findIndex((p) => p.id === project.id);
    const updated = { ...project, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
  },

  getActiveWorkflowId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKFLOW_ID) || 'wf-reel-premium';
  },

  setActiveWorkflowId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKFLOW_ID, id);
  },
};
