import { create } from 'zustand';
import type { SimState } from '../../shared/types/simulation';
import type { MainToWorker, WorkerToMain } from '../../shared/types/workerMessages';
import { useCodeEditorStore } from '../code-editor/store';
import { useTelemetryStore } from '../telemetry/store';
import { useRobotConfigStore } from '../robot-config/store';
import { useMazeStore } from '../maze/store';

export type SimStatus = 'idle' | 'running' | 'finished' | 'error';

export interface SimulationState {
  status: SimStatus;
  currentState: SimState | null;
  error: string | null;
  finishReason: 'goal' | 'completed' | null;
  worker: Worker | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  sendMessage: (msg: MainToWorker) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  status: 'idle',
  currentState: null,
  error: null,
  finishReason: null,
  worker: null,

  start: () => {
    const { pythonCode } = useCodeEditorStore.getState();

    const worker = new Worker(
      new URL('../../workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const handleMessage = (e: MessageEvent<WorkerToMain>) => {
      const msg = e.data;

      switch (msg.type) {
        case 'STATE_UPDATE':
          set({ currentState: msg.payload.state });
          {
            const logs = msg.payload.logs;
            if (logs && logs.length > 0) {
              const telemetry = useTelemetryStore.getState();
              for (const log of logs) {
                telemetry.appendLog(log, 'info');
              }
            }
          }
          break;
        case 'FINISHED':
          set({ status: 'finished', finishReason: msg.payload.reason });
          {
            const { logs, path, elapsedMs } = msg.payload;
            const telemetry = useTelemetryStore.getState();
            for (const log of logs) {
              telemetry.appendLog(log, 'info');
            }
            telemetry.appendLog('[sim] Finished', 'info');
            if (path.length > 0) {
              telemetry.setReplayRecording(path);
            }
            const grid = useMazeStore.getState().mazeGrid;
            const mazeId = `${grid.rows}x${grid.cols}-${grid.start.row}/${grid.start.col}`;
            const key = `best-${mazeId}`;
            const current = parseFloat(localStorage.getItem(key) ?? 'Infinity');
            if (elapsedMs < current) {
              localStorage.setItem(key, String(elapsedMs));
            }
          }
          break;
        case 'PYTHON_ERROR':
          set({ status: 'error', error: msg.payload.error });
          useTelemetryStore.getState().appendLog(`[error] ${msg.payload.error}`, 'error');
          break;
        case 'WORKER_ERROR':
          set({ status: 'error', error: msg.payload.error });
          useTelemetryStore.getState().appendLog(`[worker error] ${msg.payload.error}`, 'error');
          break;
        case 'READY':
          worker.postMessage({
            type: 'START',
            payload: {
              pythonCode,
              robotSpec: useRobotConfigStore.getState().spec,
              mazeGrid: useMazeStore.getState().mazeGrid,
            },
          });
          break;
      }
    };

    const handleError = (e: ErrorEvent) => {
      set({ status: 'error', error: e.message });
      useTelemetryStore.getState().appendLog(`[worker crash] ${e.message}`, 'error');
    };

    worker.onmessage = handleMessage;
    worker.onerror = handleError;

    set({ status: 'running', worker, error: null, currentState: null });

    useTelemetryStore.getState().appendLog('[sim] Starting...', 'info');
  },

  stop: () => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'STOP' });
      worker.terminate();
    }
    set({ status: 'idle', worker: null, finishReason: null });
    useTelemetryStore.getState().appendLog('[sim] Stopped', 'info');
  },

  reset: () => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'RESET' });
      worker.terminate();
    }
    set({ status: 'idle', worker: null, currentState: null, error: null, finishReason: null });
    useTelemetryStore.getState().clearReplay();
    useTelemetryStore.getState().appendLog('[sim] Reset', 'info');
  },

  sendMessage: (msg: MainToWorker) => {
    const { worker } = get();
    if (worker) {
      worker.postMessage(msg);
    }
  },
}));
