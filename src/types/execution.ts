import { NodeExecutionStatus } from './workflow';

export interface ExecutionLogEntry {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  durationMs: number;
  status: NodeExecutionStatus;
  message: string;
}

export interface ExecutionState {
  isRunning: boolean;
  currentNodeId: string | null;
  logs: ExecutionLogEntry[];
  errorNodeId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  progressPercent: number;
}
