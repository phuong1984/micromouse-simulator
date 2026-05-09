import { RobotSpec } from './robot';
import { MazeGrid } from './maze';
import { SimState } from './simulation';

export interface StartPayload {
  robotSpec: RobotSpec;
  mazeGrid: MazeGrid;
  pythonCode: string;
}

export type MainToWorker =
  | { type: 'START'; payload: StartPayload }
  | { type: 'STOP' }
  | { type: 'STEP' }
  | { type: 'RESET' };

export interface StateUpdatePayload {
  state: SimState;
}

export interface FinishedPayload {
  elapsedMs: number;
  path: Array<{ tick: number; x: number; y: number; angle: number }>;
}

export interface ErrorPayload {
  error: string;
}

export type WorkerToMain =
  | { type: 'STATE_UPDATE'; payload: StateUpdatePayload }
  | { type: 'FINISHED'; payload: FinishedPayload }
  | { type: 'PYTHON_ERROR'; payload: ErrorPayload }
  | { type: 'WORKER_ERROR'; payload: ErrorPayload };
