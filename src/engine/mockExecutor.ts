/**
 * VideoFlow AI - Workflow Mock Executor
 * 
 * Executa o grafo de nós de forma sequencial com base nas conexões (edges)
 * e ordem de dependência. Permite simulação de erros, log em tempo real
 * e retentativa isolada do nó que falhou, preservando o estado dos nós anteriores.
 */

import { Workflow, WorkflowNode, NodeExecutionStatus } from '../types/workflow';
import { ExecutionLogEntry } from '../types/execution';

export interface ExecutorCallbacks {
  onNodeStatusChange: (nodeId: string, status: NodeExecutionStatus, errorMsg?: string) => void;
  onLog: (log: ExecutionLogEntry) => void;
  onExecutionFinished: (success: boolean) => void;
}

export class MockWorkflowEngine {
  private workflow: Workflow;
  private callbacks: ExecutorCallbacks;
  private isCancelled: boolean = false;
  private nodeOutputs: Map<string, Record<string, unknown>> = new Map();

  constructor(workflow: Workflow, callbacks: ExecutorCallbacks) {
    this.workflow = workflow;
    this.callbacks = callbacks;
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Determina a ordem de execução dos nós com base nas conexões (ordem topológica).
   * Se houver nós desconectados, inclui ordenados pela posição X no canvas.
   */
  public getExecutionOrder(): string[] {
    const nodes = this.workflow.nodes;
    const edges = this.workflow.edges;

    // Calcular in-degree
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    });

    edges.forEach((e) => {
      if (adj.has(e.source) && inDegree.has(e.target)) {
        adj.get(e.source)!.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    // Nós sem dependências iniciais
    const queue: string[] = nodes
      .filter((n) => inDegree.get(n.id) === 0)
      .sort((a, b) => a.position.x - b.position.x)
      .map((n) => n.id);

    const order: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const neighbors = adj.get(current) || [];
      for (const neighbor of neighbors) {
        const currentDegree = inDegree.get(neighbor) || 0;
        inDegree.set(neighbor, currentDegree - 1);
        if (currentDegree - 1 === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Se houver ciclos ou nós isolados restantes
    if (order.length < nodes.length) {
      nodes.forEach((n) => {
        if (!order.includes(n.id)) {
          order.push(n.id);
        }
      });
    }

    return order;
  }

  /**
   * Executa todo o workflow do início.
   */
  public async executeAll(simulateErrorOnNodeId?: string): Promise<boolean> {
    this.isCancelled = false;
    this.nodeOutputs.clear();

    const order = this.getExecutionOrder();

    // Coloca todos os nós em 'queued'
    for (const nodeId of order) {
      this.callbacks.onNodeStatusChange(nodeId, 'queued');
    }

    // Executa nó a nó
    for (const nodeId of order) {
      if (this.isCancelled) return false;

      const node = this.workflow.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      const shouldSimulateError = simulateErrorOnNodeId === nodeId;
      const success = await this.executeNodeStep(node, shouldSimulateError);

      if (!success) {
        // Interrompe a cadeia subsequente; nós restantes permanecem 'queued' ou voltam para 'idle'
        const remainingIndex = order.indexOf(nodeId) + 1;
        for (let i = remainingIndex; i < order.length; i++) {
          this.callbacks.onNodeStatusChange(order[i], 'idle');
        }
        this.callbacks.onExecutionFinished(false);
        return false;
      }
    }

    this.callbacks.onExecutionFinished(true);
    return true;
  }

  /**
   * Retenta a execução a partir do nó que falhou, sem apagar resultados dos anteriores!
   */
  public async retryFromNode(failedNodeId: string): Promise<boolean> {
    this.isCancelled = false;
    const order = this.getExecutionOrder();
    const startIndex = order.indexOf(failedNodeId);

    if (startIndex === -1) return false;

    // Fila nós restantes a partir do nó com erro
    for (let i = startIndex; i < order.length; i++) {
      this.callbacks.onNodeStatusChange(order[i], 'queued');
    }

    for (let i = startIndex; i < order.length; i++) {
      if (this.isCancelled) return false;

      const nodeId = order[i];
      const node = this.workflow.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      // Na retentativa, não força erro
      const success = await this.executeNodeStep(node, false);

      if (!success) {
        this.callbacks.onExecutionFinished(false);
        return false;
      }
    }

    this.callbacks.onExecutionFinished(true);
    return true;
  }

  /**
   * Executa uma etapa individual de nó com simulação temporal e mensagens temáticas.
   */
  private async executeNodeStep(node: WorkflowNode, simulateError: boolean): Promise<boolean> {
    const startTime = Date.now();
    this.callbacks.onNodeStatusChange(node.id, 'running');

    // Duração simulada entre 600ms e 1400ms para realismo e fluidez
    const duration = Math.floor(Math.random() * 800) + 600;
    await new Promise((resolve) => setTimeout(resolve, duration));

    if (this.isCancelled) return false;

    const elapsed = Date.now() - startTime;
    const nowStr = new Date().toLocaleTimeString('pt-BR');

    if (simulateError) {
      const errorMsg = this.getSimulatedErrorMessage(node);
      this.callbacks.onNodeStatusChange(node.id, 'error', errorMsg);
      this.callbacks.onLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nodeId: node.id,
        nodeName: node.data.name,
        timestamp: nowStr,
        durationMs: elapsed,
        status: 'error',
        message: errorMsg,
      });
      return false;
    }

    // Sucesso
    const successMsg = this.getSimulatedSuccessMessage(node);
    this.callbacks.onNodeStatusChange(node.id, 'success');
    this.nodeOutputs.set(node.id, { processed: true, timestamp: Date.now() });

    this.callbacks.onLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nodeId: node.id,
      nodeName: node.data.name,
      timestamp: nowStr,
      durationMs: elapsed,
      status: 'success',
      message: successMsg,
    });

    return true;
  }

  private getSimulatedSuccessMessage(node: WorkflowNode): string {
    switch (node.data.nodeType) {
      case 'video-input':
        return 'Vídeo carregado com sucesso (1080x1920, 60fps, 48.2MB).';
      case 'transcribe':
        return 'Transcrição de áudio concluída (142 palavras detectadas, PT-BR).';
      case 'cleanup':
        return 'Cortes de silêncio aplicados (14 pausas e 3 repetições removidas).';
      case 'speech-errors':
        return 'Erros de fala tratados (removidos 5 cacoetes e 2 falsos inícios).';
      case 'highlights':
        return 'Destaques semânticos identificados (3 frases-chave e 2 números de impacto).';
      case 'title':
        return 'Título dinâmico gerado: "O Segredo que Ninguém Te Contou sobre IA".';
      case 'zoom':
        return 'Curva de zoom dinâmico aplicada em 6 pontos de ênfase visual.';
      case 'format':
        return 'Enquadramento adaptativo para proporção 9:16 concluído.';
      case 'subtitles':
        return 'Legendas sincronizadas no padrão do Style Preset com destaque ativo.';
      case 'brand':
        return 'Marca d\'água e overlays de identidade posicionados nos safe zones.';
      case 'preview':
        return 'Buffer de visualização prévia gerado em 1080p sem perda de quadros.';
      case 'export':
        return 'Renderização final empacotada em MP4 H.264 pronto para publicação.';
      default:
        return `Etapa ${node.data.name} finalizada com sucesso.`;
    }
  }

  private getSimulatedErrorMessage(node: WorkflowNode): string {
    switch (node.data.nodeType) {
      case 'video-input':
        return 'Falha na leitura do codec do arquivo de entrada.';
      case 'transcribe':
        return 'Limite de taxa na API de transcrição ou canal de áudio inaudível.';
      case 'cleanup':
        return 'Conflito de marcação de corte: corte de silêncio colidiu com fonema.';
      case 'speech-errors':
        return 'Inconsistência na detecção de pausas do locutor.';
      case 'highlights':
        return 'Transcrição muito curta para extração de dores e alertas relevantes.';
      case 'title':
        return 'Falha ao sintetizar título dentro do limite de palavras estabelecido.';
      case 'zoom':
        return 'Rastreamento facial perdeu a âncora de corte no frame 420.';
      case 'format':
        return 'Resolução de entrada incompatível com a proporção 9:16 solicitada.';
      case 'subtitles':
        return 'Estilo de legenda referenciado não foi encontrado no preset.';
      case 'brand':
        return 'Arquivo de logotipo não acessível ou formato SVG corrompido.';
      case 'preview':
        return 'Memória de vídeo insuficiente para buffer do preview.';
      case 'export':
        return 'Erro de muxing no container MP4: taxa de bits excedida.';
      default:
        return `Erro de processamento no nó ${node.data.name}.`;
    }
  }
}
