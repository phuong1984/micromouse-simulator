export interface PathPoint {
  tick: number;
  x: number;
  y: number;
  angle: number;
  sensorReadings: Record<string, number>;
  elapsedMs: number;
}

export interface LogEntry {
  tick: number;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: number;
}

export interface TelemetryState {
  path: PathPoint[];
  console: LogEntry[];
  sensorHistory: Array<Record<string, number>>;
  motorHistory: Array<{ left: number; right: number }>;
}
