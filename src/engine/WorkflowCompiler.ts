import { Workflow, WorkflowNode } from '../types/workflow';
import { EditDecisionList } from '../types/edl';
import { StylePreset } from '../types/stylePreset';
import { RenderPlan, RenderOperation } from '../types/renderPlan';
import { calculateStringHash } from '../utils/hash';

export interface CompilerInput {
  workflow: Workflow;
  edl: EditDecisionList;
  stylePreset: StylePreset;
  videoMetadata: {
    url: string;
    duration: number;
    width: number;
    height: number;
    fps: number;
  };
  userId: string;
}

export class WorkflowCompiler {
  /**
   * Compila o Workflow e a EDL em um RenderPlan serializável.
   */
  static compile(input: CompilerInput): RenderPlan {
    const { workflow, edl, stylePreset, videoMetadata, userId } = input;

    // 1. Validar estrutura básica do Grafo
    this.validateGraph(workflow);

    // 2. Determinar Ordem de Execução (Ordenação Topológica Simplificada para o Pipeline linear de vídeo)
    // No VideoFlow V1, o pipeline é majoritariamente sequencial por categoria
    const sortedNodes = this.topologicalSort(workflow);

    // 3. Gerar Timeline de Segmentos Mantidos
    const timeline = this.generateTimeline(edl, videoMetadata.duration);

    // 4. Mapear Nodes para Operações de Renderização
    const operations: RenderOperation[] = [];
    
    // Operação implícita de TRIM/CONCAT baseada na EDL
    operations.push({
      id: 'op-base-cuts',
      type: 'concat',
      enabled: true,
      order: 0,
      config: { segments: timeline.segments },
      sourceNodeId: 'internal'
    });

    // Mapeamento de nodes ativos
    sortedNodes.forEach((node, index) => {
      const op = this.mapNodeToOperation(node, index + 1, stylePreset, edl);
      if (op) operations.push(op);
    });

    // 5. Configurar Saída Baseada no Workflow
    const exportNode = workflow.nodes.find(n => n.data.nodeType === 'export');
    const formatNode = workflow.nodes.find(n => n.data.nodeType === 'format');
    
    const outputRes = this.calculateOutputResolution(formatNode, videoMetadata);

    const plan: RenderPlan = {
      version: 1,
      projectId: edl.projectId,
      userId,
      sourceHash: edl.sourceHash,
      edlVersion: edl.edlVersion,
      workflowVersion: workflow.version,
      analysisConfigHash: edl.analysisConfigHash,
      source: {
        videoUrl: videoMetadata.url,
        duration: videoMetadata.duration,
        width: videoMetadata.width,
        height: videoMetadata.height,
        fps: videoMetadata.fps
      },
      timeline,
      operations,
      output: {
        format: 'mp4',
        codec: 'h264',
        audioCodec: 'aac',
        resolution: outputRes,
        quality: (exportNode?.data.config.qualidade as any) || 'balanced'
      }
    };

    return plan;
  }

  private static validateGraph(workflow: Workflow) {
    const nodes = workflow.nodes;
    if (!nodes.find(n => n.data.nodeType === 'video-input')) {
      throw new Error('O workflow deve ter um nó de entrada de vídeo.');
    }
    if (!nodes.find(n => n.data.nodeType === 'export')) {
      throw new Error('O workflow deve ter um nó de exportação.');
    }
    
    // Verificar se há nodes desconectados do fluxo principal
    // (Simplificação: pelo menos uma conexão entrando ou saindo para nodes intermediários)
    // Para V1, permitimos nodes soltos, apenas os ignoramos no plano.
  }

  private static topologicalSort(workflow: Workflow): WorkflowNode[] {
    // Para VideoFlow AI, o "sentido" do vídeo é Entrada -> Processamento -> Saída
    // Vamos filtrar apenas nodes que fazem parte do pipeline de renderização
    const renderNodeTypes = [
      'cleanup', 'transcribe', 'speech-errors', 'highlights', 
      'title', 'zoom', 'subtitles', 'format', 'brand', 'export'
    ];

    return workflow.nodes
      .filter(n => renderNodeTypes.includes(n.data.nodeType))
      .sort((a, b) => {
        // Ordem fixa por categoria para garantir sanidade visual (ex: legendas sempre por cima)
        const orderMap: Record<string, number> = {
          'cleanup': 1,
          'speech-errors': 2,
          'format': 3,
          'zoom': 4,
          'subtitles': 5,
          'highlights': 6,
          'title': 7,
          'brand': 8,
          'export': 9
        };
        return (orderMap[a.data.nodeType] || 10) - (orderMap[b.data.nodeType] || 10);
      });
  }

  private static generateTimeline(edl: EditDecisionList, sourceDuration: number) {
    // Identificar intervalos removidos
    const removals = edl.speechIssues
      .filter(i => i.humanDecision === 'remove' || (i.status === 'auto_remove_candidate' && i.humanDecision === 'none'))
      .sort((a, b) => a.start - b.start);

    const segments: Array<{ start: number; end: number; duration: number }> = [];
    let lastPos = 0;

    for (const removal of removals) {
      if (removal.start > lastPos) {
        segments.push({
          start: lastPos,
          end: removal.start,
          duration: removal.start - lastPos
        });
      }
      lastPos = Math.max(lastPos, removal.end);
    }

    if (lastPos < sourceDuration) {
      segments.push({
        start: lastPos,
        end: sourceDuration,
        duration: sourceDuration - lastPos
      });
    }

    const totalDuration = segments.reduce((acc, s) => acc + s.duration, 0);

    return { segments, totalDuration };
  }

  private static mapNodeToOperation(node: WorkflowNode, order: number, preset: StylePreset, edl: EditDecisionList): RenderOperation | null {
    const { nodeType, config } = node.data;

    switch (nodeType) {
      case 'format':
        return {
          id: `op-${node.id}`,
          type: 'resize',
          enabled: true,
          order,
          config: { 
            aspectRatio: config.aspectRatio || '9:16',
            strategy: 'center-crop'
          },
          sourceNodeId: node.id
        };

      case 'subtitles':
        return {
          id: `op-${node.id}`,
          type: 'captions',
          enabled: true,
          order,
          config: {
            blocks: edl.captions,
            highlights: edl.highlights,
            style: {
              font: config.fonte || preset.fonteLegendas,
              size: config.tamanho || 24,
              color: preset.corPrincipal,
              highlightColor: preset.corDestaque,
              position: config.posicao || preset.posicaoLegenda,
              maxLines: config.maximoLinhas || preset.linhasMaximas,
              wordsPerBlock: config.maximoPalavras || preset.palavrasPorBloco
            }
          },
          sourceNodeId: node.id
        };

      case 'title':
        if (!edl.activeTitle) return null;
        return {
          id: `op-${node.id}`,
          type: 'title',
          enabled: true,
          order,
          config: {
            text: edl.activeTitle,
            duration: config.duracaoSec || preset.duracaoTitulo,
            position: config.posicao || preset.posicaoTitulo,
            style: {
              font: preset.fontePrincipal,
              color: preset.corPrincipal
            }
          },
          sourceNodeId: node.id
        };

      case 'zoom':
        return {
          id: `op-${node.id}`,
          type: 'zoom',
          enabled: true,
          order,
          config: {
            events: edl.zoomEvents,
            maxScale: (config as any).escalaMaximaPercent / 100 || 1.15
          },
          sourceNodeId: node.id
        };

      case 'brand':
        return {
          id: `op-${node.id}`,
          type: 'branding',
          enabled: true,
          order,
          config: {
            logoUrl: (config as any).logoUrl || preset.logo,
            position: (config as any).posicao || 'topo-direita',
            opacity: ((config as any).opacidadePercent || 100) / 100,
            scale: ((config as any).tamanhoPercent || 10) / 100
          },
          sourceNodeId: node.id
        };

      default:
        return null;
    }
  }

  private static calculateOutputResolution(formatNode: WorkflowNode | undefined, metadata: any) {
    const ratio = formatNode?.data.config.aspectRatio || '9:16';
    
    if (ratio === '9:16') return { width: 1080, height: 1920 };
    if (ratio === '16:9') return { width: 1920, height: 1080 };
    if (ratio === '4:5') return { width: 1080, height: 1350 };
    
    return { width: 1080, height: 1920 };
  }
}
