import { create } from 'zustand';

export interface LogEntry {
  message: string;
  type: 'info' | 'error' | 'warn';
  timestamp: number;
}

export interface TelemetryState {
  consoleLogs: LogEntry[];
  appendLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  consoleLogs: [],
  appendLog: (message, type = 'info') => {
    set((state) => ({
      consoleLogs: [
        ...state.consoleLogs,
        { message, type, timestamp: Date.now() },
      ],
    }));
  },
  clearLogs: () => set({ consoleLogs: [] }),
}));
