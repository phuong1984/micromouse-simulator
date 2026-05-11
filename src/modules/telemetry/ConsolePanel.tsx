import { useEffect, useRef } from 'react';
import { useTelemetryStore } from './store';

export function ConsolePanel() {
  const consoleLogs = useTelemetryStore((s) => s.consoleLogs);
  const clearLogs = useTelemetryStore((s) => s.clearLogs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-medium">Console</span>
        <button
          onClick={clearLogs}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
        {consoleLogs.length === 0 && (
          <div className="text-gray-600 italic">No output yet</div>
        )}
        {consoleLogs.map((entry, i) => (
          <div
            key={i}
            className={`${
              entry.type === 'error'
                ? 'text-red-400'
                : entry.type === 'warn'
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }`}
          >
            <span className="text-gray-600 mr-1">
              [{entry.timestamp.toString().slice(-5)}]
            </span>
            {entry.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
