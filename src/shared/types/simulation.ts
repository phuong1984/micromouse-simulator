export type SimStatus = 'idle' | 'running' | 'paused' | 'finished' | 'error';

export interface WallSegment {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export interface RobotState {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  av: number;
}

export interface SimState {
  tick: number;
  robot: RobotState;
  sensors: Record<string, number>;
  motorRPMs: number[];
  isFinished: boolean;
  elapsedMs: number;
  status: SimStatus;
  error?: string;
}
