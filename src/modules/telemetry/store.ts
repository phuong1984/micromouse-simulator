import { create } from 'zustand';
import type { SimState } from '../../shared/types/simulation';
import type { PathPoint } from '../../shared/types/telemetry';

export interface LogEntry {
  message: string;
  type: 'info' | 'error' | 'warn';
  timestamp: number;
}

export interface TelemetryState {
  consoleLogs: LogEntry[];
  replayRecording: PathPoint[];
  replayIndex: number;
  isReplayPlaying: boolean;
  replaySpeed: number;
  replayState: SimState | null;

  appendLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
  setReplayRecording: (recording: PathPoint[]) => void;
  setReplayIndex: (idx: number) => void;
  setIsReplayPlaying: (playing: boolean) => void;
  setReplaySpeed: (speed: number) => void;
  clearReplay: () => void;
}

function pointToState(point: PathPoint): SimState {
  return {
    tick: point.tick,
    robot: { x: point.x, y: point.y, angle: point.angle, vx: 0, vy: 0, av: 0 },
    sensors: point.sensorReadings,
    motorRPMs: [0, 0],
    isFinished: false,
    elapsedMs: point.elapsedMs,
    status: 'running',
  };
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  consoleLogs: [],
  replayRecording: [],
  replayIndex: -1,
  isReplayPlaying: false,
  replaySpeed: 1,
  replayState: null,

  appendLog: (message, type = 'info') => {
    set((state) => ({
      consoleLogs: [
        ...state.consoleLogs,
        { message, type, timestamp: Date.now() },
      ],
    }));
  },
  clearLogs: () => set({ consoleLogs: [] }),

  setReplayRecording: (recording) =>
    set({
      replayRecording: recording,
      replayIndex: recording.length > 0 ? 0 : -1,
      replayState: recording.length > 0 ? pointToState(recording[0]) : null,
    }),

  setReplayIndex: (idx) =>
    set((state) => ({
      replayIndex: idx,
      replayState:
        idx >= 0 && idx < state.replayRecording.length
          ? pointToState(state.replayRecording[idx])
          : null,
    })),

  setIsReplayPlaying: (playing) => set({ isReplayPlaying: playing }),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  clearReplay: () =>
    set({
      replayRecording: [],
      replayIndex: -1,
      isReplayPlaying: false,
      replayState: null,
    }),
}));
