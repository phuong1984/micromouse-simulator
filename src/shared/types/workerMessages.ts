import { RobotSpec } from './robot';
import { MazeGrid } from './maze';
import { SimState } from './simulation';
import { PathPoint } from './telemetry';

export interface StartPayload {
  robotSpec: RobotSpec;
  mazeGrid: MazeGrid;
  pythonCode: string;
}

export interface KeyboardPayload {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export type MainToWorker =
  | { type: 'START'; payload: StartPayload }
  | { type: 'STOP' }
  | { type: 'STEP' }
  | { type: 'RESET' }
  | { type: 'KEYBOARD'; payload: KeyboardPayload };

export interface StateUpdatePayload {
  state: SimState;
  logs?: string[];
}

export interface FinishedPayload {
  elapsedMs: number;
  path: PathPoint[];
  logs: string[];
  reason: 'goal' | 'completed';
}

export interface ErrorPayload {
  error: string;
}

export type WorkerToMain =
  | { type: 'STATE_UPDATE'; payload: StateUpdatePayload }
  | { type: 'FINISHED'; payload: FinishedPayload }
  | { type: 'PYTHON_ERROR'; payload: ErrorPayload }
  | { type: 'WORKER_ERROR'; payload: ErrorPayload }
  | { type: 'READY' };
