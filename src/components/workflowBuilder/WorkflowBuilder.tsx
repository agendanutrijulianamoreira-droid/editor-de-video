import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import {
  Play,
  RotateCcw,
  Undo2,
  Redo2,
  Maximize,
  Save,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeCategory,
  NodeType,
  NodeExecutionStatus,
  AnyNodeConfig,
} from '../../types/workflow';
import { StylePreset } from '../../types/stylePreset';
import { ExecutionLogEntry } from '../../types/execution';
import { MockWorkflowEngine } from '../../engine/mockExecutor';
import { CustomWorkflowNode } from './nodes/CustomWorkflowNode';
import { NodeSidebar } from './NodeSidebar';
import { NodeInspector } from './NodeInspector';
import { ExecutionHistoryPanel } from './ExecutionHistoryPanel';

const nodeTypes = {
  customWorkflowNode: CustomWorkflowNode,
};

interface WorkflowBuilderProps {
  workflow: Workflow;
  presets: StylePreset[];
  onSaveWorkflow: (workflow: Workflow) => void;
  onBackToLibrary: () => void;
}

// Inner canvas component wrapped in ReactFlowProvider
const WorkflowCanvas: React.FC<WorkflowBuilderProps> = ({
  workflow,
  presets,
  onSaveWorkflow,
  onBackToLibrary,
}) => {
  const reactFlowInstance = useReactFlow();

  // Estados dos nós e arestas
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges as unknown as Edge[]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Metadados do workflow
  const [workflowName, setWorkflowName] = useState(workflow.name);
  const [selectedPresetId, setSelectedPresetId] = useState(workflow.stylePresetId || presets[0]?.id || '');
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  // Pilha de Undo / Redo
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([
    { nodes: workflow.nodes as unknown as Node[], edges: workflow.edges as unknown as Edge[] },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Execução
  const [isRunning, setIsRunning] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
  const engineRef = useRef<MockWorkflowEngine | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Salvar estado para histórico (Undo/Redo)
  const pushToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setHistory((prev) => {
      const slice = prev.slice(0, historyIndex + 1);
      return [...slice, { nodes: newNodes, edges: newEdges }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Conexão entre nós
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const updated = addEdge({ ...params, animated: false }, eds);
        pushToHistory(nodes, updated);
        return updated;
      });
    },
    [nodes, pushToHistory, setEdges]
  );

  // Seleção de nó para o inspetor
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Obter o nó selecionado
  const selectedNode = (nodes.find((n) => n.id === selectedNodeId) as unknown as WorkflowNode) || null;

  // Atualizar configuração do nó
  const handleUpdateNodeConfig = useCallback(
    (nodeId: string, newConfig: Partial<AnyNodeConfig>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            const currentData = n.data as any;
            return {
              ...n,
              data: {
                ...currentData,
                config: {
                  ...currentData.config,
                  ...newConfig,
                },
              },
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Atualizar nome do nó
  const handleUpdateNodeName = useCallback(
    (nodeId: string, newName: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...(n.data as any),
                name: newName,
              },
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Excluir nó
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const nextNodes = nodes.filter((n) => n.id !== nodeId);
      const nextEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      setNodes(nextNodes);
      setEdges(nextEdges);
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      pushToHistory(nextNodes, nextEdges);
    },
    [nodes, edges, selectedNodeId, setNodes, setEdges, pushToHistory]
  );

  // Duplicar nó
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;

      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const duplicated: Node = {
        ...source,
        id: newId,
        position: {
          x: source.position.x + 40,
          y: source.position.y + 40,
        },
        data: {
          ...(source.data as any),
          name: `${(source.data as any).name} (Cópia)`,
          status: 'idle',
        },
        selected: true,
      };

      const nextNodes = [...nodes, duplicated];
      setNodes(nextNodes);
      setSelectedNodeId(newId);
      pushToHistory(nextNodes, edges);
    },
    [nodes, edges, setNodes, pushToHistory]
  );

  // Adicionar novo nó a partir da barra lateral
  const handleAddNode = useCallback(
    (category: NodeCategory, nodeType: NodeType, name: string, positionOverride?: { x: number; y: number }) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const defaultPos = positionOverride || {
        x: Math.floor(Math.random() * 200) + 200,
        y: Math.floor(Math.random() * 200) + 150,
      };

      const newNode: Node = {
        id: newId,
        type: 'customWorkflowNode',
        position: defaultPos,
        data: {
          name,
          category,
          nodeType,
          version: 1,
          status: 'idle',
          config: {},
        },
      };

      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      setSelectedNodeId(newId);
      pushToHistory(nextNodes, edges);
    },
    [nodes, edges, setNodes, pushToHistory]
  );

  // Suporte a Drag and Drop do Sidebar no Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const rawData = event.dataTransfer.getData('application/videoflow-node');
      if (!rawData) return;

      try {
        const item = JSON.parse(rawData);
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!bounds) return;

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        handleAddNode(item.category, item.nodeType, item.name, position);
      } catch (e) {
        console.error('Falha no drop do nó:', e);
      }
    },
    [reactFlowInstance, handleAddNode]
  );

  // Salvar workflow no storage
  const handleSave = useCallback(() => {
    const currentWf: Workflow = {
      ...workflow,
      name: workflowName,
      stylePresetId: selectedPresetId,
      nodes: nodes as unknown as WorkflowNode[],
      edges: edges as unknown as WorkflowEdge[],
      updatedAt: new Date().toISOString(),
    };
    onSaveWorkflow(currentWf);
    setIsSavedIndicator(true);
    setTimeout(() => setIsSavedIndicator(false), 2000);
  }, [workflow, workflowName, selectedPresetId, nodes, edges, onSaveWorkflow]);

  // Atualizar status de nó no canvas durante execução
  const setNodeStatus = useCallback((nodeId: string, status: NodeExecutionStatus, errorMsg?: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...(n.data as any),
              status,
              errorMessage: errorMsg,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  // Retentar nó com falha
  const handleRetryNode = useCallback((nodeId: string) => {
    if (!engineRef.current) return;
    setIsRunning(true);
    engineRef.current.retryFromNode(nodeId).finally(() => {
      setIsRunning(false);
    });
  }, []);

  // Conectar callback de retry a cada nó para o botão do card
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...(n.data as any),
          onRetry: handleRetryNode,
        },
      }))
    );
  }, [handleRetryNode, setNodes]);

  // Executar simulação do workflow
  const handleExecuteWorkflow = useCallback(() => {
    setIsRunning(true);

    const currentWf: Workflow = {
      ...workflow,
      name: workflowName,
      nodes: nodes as unknown as WorkflowNode[],
      edges: edges as unknown as WorkflowEdge[],
    };

    // Escolhe um nó para falhar se simulateError estiver ativo (ex: o 3º nó da cadeia)
    let errorTargetId: string | undefined = undefined;
    if (simulateError) {
      const candidates = nodes.filter((n) => (n.data as any).category !== 'Entrada');
      if (candidates.length > 0) {
        errorTargetId = candidates[Math.floor(candidates.length / 2)]?.id;
      }
    }

    const engine = new MockWorkflowEngine(currentWf, {
      onNodeStatusChange: (nodeId, status, errorMsg) => {
        setNodeStatus(nodeId, status, errorMsg);
      },
      onLog: (log) => {
        setExecutionLogs((prev) => [log, ...prev]);
      },
      onExecutionFinished: () => {
        setIsRunning(false);
      },
    });

    engineRef.current = engine;
    engine.executeAll(errorTargetId);
  }, [workflow, workflowName, nodes, edges, simulateError, setNodeStatus]);

  // Resetar estados de todos os nós para 'idle'
  const handleResetNodeStates = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
    setIsRunning(false);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...(n.data as any),
          status: 'idle',
          errorMessage: undefined,
        },
      }))
    );
  }, [setNodes]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar do Workflow Builder */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-20 shrink-0">
        {/* Lado Esquerdo: Voltar e Nome do Workflow */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLibrary}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Biblioteca</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-900 px-2 py-1 rounded text-sm font-semibold text-slate-100 border border-transparent focus:border-slate-700 outline-none w-48 sm:w-64"
            />
            <span className="text-[11px] text-slate-400 font-mono">v{workflow.version}</span>
          </div>
        </div>

        {/* Centro: Preset de Estilo Vinculado */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">Style Preset:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lado Direito: Controles de Execução e Salvar */}
        <div className="flex items-center gap-2">
          {/* Toggle de Simular Erro */}
          <label className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer px-2 py-1 rounded hover:bg-slate-800/40">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-0"
            />
            <span className="flex items-center gap-1 text-[11px]">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              Simular erro
            </span>
          </label>

          {/* Botão Reset */}
          <button
            onClick={handleResetNodeStates}
            title="Resetar status dos nós"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Botão Executar */}
          <button
            onClick={handleExecuteWorkflow}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all ${
              isRunning
                ? 'bg-blue-800 cursor-not-allowed opacity-80'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'Executando...' : 'Executar'}</span>
          </button>

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors"
          >
            {isSavedIndicator ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Área Central: Sidebar de Nós + Canvas + Inspetor Lateral */}
      <div className="flex-1 flex overflow-hidden relative" ref={reactFlowWrapper}>
        {/* Biblioteca lateral de nós */}
        <NodeSidebar onAddNode={handleAddNode} />

        {/* Canvas do React Flow */}
        <div className="flex-1 h-full relative" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.0}
            className="bg-slate-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.2}
              color="#334155"
            />
            <Controls
              className="!bg-slate-900 !border-slate-800 !shadow-xl [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 hover:[&>button]:!bg-slate-800"
            />
            <MiniMap
              nodeColor={() => '#3b82f6'}
              maskColor="rgba(15, 23, 42, 0.75)"
              className="!bg-slate-900 !border !border-slate-800 !rounded-lg overflow-hidden"
            />

            {/* Painel Flutuante de Atalhos Rápidos */}
            <Panel position="top-right" className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg backdrop-blur-md">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Desfazer (Undo)"
                className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Refazer (Redo)"
                className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-800 my-1" />
              <button
                onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}
                title="Ajustar visualização (Fit View)"
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </Panel>
          </ReactFlow>
        </div>

        {/* Inspetor Lateral Direito do Nó Selecionado */}
        {selectedNode && (
          <NodeInspector
            selectedNode={selectedNode}
            presets={presets}
            onClose={() => setSelectedNodeId(null)}
            onUpdateConfig={handleUpdateNodeConfig}
            onUpdateNodeName={handleUpdateNodeName}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
          />
        )}
      </div>

      {/* Painel Inferior de Histórico de Execução */}
      <ExecutionHistoryPanel
        logs={executionLogs}
        isRunning={isRunning}
        onClearLogs={() => setExecutionLogs([])}
        onRetryNode={handleRetryNode}
      />
    </div>
  );
};

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
};
