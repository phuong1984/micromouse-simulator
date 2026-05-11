import { create } from 'zustand';
import type { SimState } from '../../shared/types/simulation';
import type { WorkerToMain } from '../../shared/types/workerMessages';
import { useCodeEditorStore } from '../code-editor/store';
import { useTelemetryStore } from '../telemetry/store';

export type SimStatus = 'idle' | 'running' | 'finished' | 'error';

export interface SimulationState {
  status: SimStatus;
  currentState: SimState | null;
  error: string | null;
  worker: Worker | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  status: 'idle',
  currentState: null,
  error: null,
  worker: null,

  start: () => {
    const { pythonCode } = useCodeEditorStore.getState();
    if (!pythonCode.trim()) {
      set({ status: 'error', error: 'No code to run' });
      return;
    }

    const worker = new Worker(
      new URL('../../workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const handleMessage = (e: MessageEvent<WorkerToMain>) => {
      const msg = e.data;

      switch (msg.type) {
        case 'STATE_UPDATE':
          set({ currentState: msg.payload.state });
          break;
        case 'FINISHED':
          set({ status: 'finished' });
          {
            const logs = msg.payload.logs;
            const telemetry = useTelemetryStore.getState();
            for (const log of logs) {
              telemetry.appendLog(log, 'info');
            }
            telemetry.appendLog('[sim] Finished', 'info');
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
            payload: { pythonCode },
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
    set({ status: 'idle', worker: null });
    useTelemetryStore.getState().appendLog('[sim] Stopped', 'info');
  },

  reset: () => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'RESET' });
      worker.terminate();
    }
    set({ status: 'idle', worker: null, currentState: null, error: null });
    useTelemetryStore.getState().appendLog('[sim] Reset', 'info');
  },
}));
