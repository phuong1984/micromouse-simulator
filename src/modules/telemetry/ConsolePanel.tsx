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
    <div className="console-panel">
      <div className="console-header">
        <span className="console-header-label">Console</span>
        <button onClick={clearLogs} className="console-header-clear">Clear</button>
      </div>
      <div className="console-body">
        {consoleLogs.length === 0 && (
          <div className="console-empty">No output yet</div>
        )}
        {consoleLogs.map((entry, i) => (
          <div key={i} className="console-entry">
            <span className="console-timestamp">[{entry.timestamp.toString().slice(-5)}]</span>
            <span className={
              entry.type === 'error'
                ? 'console-entry-error'
                : entry.type === 'warn'
                  ? 'console-entry-warn'
                  : 'console-entry-log'
            }>{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
