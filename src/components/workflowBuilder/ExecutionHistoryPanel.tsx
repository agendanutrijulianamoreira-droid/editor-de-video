import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Terminal,
  Trash2,
} from 'lucide-react';
import { ExecutionLogEntry } from '../../types/execution';

interface ExecutionHistoryPanelProps {
  logs: ExecutionLogEntry[];
  isRunning: boolean;
  onClearLogs: () => void;
  onRetryNode?: (nodeId: string) => void;
}

export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({
  logs,
  isRunning,
  onClearLogs,
  onRetryNode,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`border-t border-slate-800 bg-slate-900/95 backdrop-blur-md transition-all duration-200 z-10 flex flex-col ${
        isOpen ? 'h-52' : 'h-10'
      }`}
    >
      {/* Barra de título / toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Histórico de Execução
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ({logs.length} eventos)
          </span>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Executando pipeline...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearLogs();
              }}
              title="Limpar histórico"
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Tabela de logs */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Nenhuma execução registrada. Clique em "Executar" para testar o workflow.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="py-1.5 px-2">Node</th>
                  <th className="py-1.5 px-2">Horário</th>
                  <th className="py-1.5 px-2">Duração</th>
                  <th className="py-1.5 px-2">Status</th>
                  <th className="py-1.5 px-2">Mensagem</th>
                  <th className="py-1.5 px-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {logs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const isError = log.status === 'error';
                  const isRunningStatus = log.status === 'running';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-1.5 px-2 text-slate-200 font-sans font-medium whitespace-nowrap">
                        {log.nodeName}
                      </td>
                      <td className="py-1.5 px-2 text-slate-400 tabular-nums whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-1.5 px-2 text-slate-400 tabular-nums whitespace-nowrap">
                        {log.durationMs}ms
                      </td>
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        {isSuccess && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sucesso</span>
                          </span>
                        )}
                        {isError && (
                          <span className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Erro</span>
                          </span>
                        )}
                        {isRunningStatus && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Em curso</span>
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-slate-300 font-sans max-w-md truncate">
                        {log.message}
                      </td>
                      <td className="py-1.5 px-2 text-right whitespace-nowrap">
                        {isError && onRetryNode && (
                          <button
                            onClick={() => onRetryNode(log.nodeId)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-sans font-medium bg-red-600/80 hover:bg-red-500 text-white rounded transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Tentar novamente
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
