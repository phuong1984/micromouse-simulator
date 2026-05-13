import { useEffect, useRef, useCallback } from 'react';
import { useTelemetryStore } from './store';

const SPEEDS = [0.5, 1, 2, 4];

function formatTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mm = Math.floor(ms % 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(mm).padStart(3, '0')}`;
}

function downloadRecording(recording: unknown[]) {
  const blob = new Blob([JSON.stringify(recording)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `replay-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReplayPlayer() {
  const recording = useTelemetryStore((s) => s.replayRecording);
  const replayIndex = useTelemetryStore((s) => s.replayIndex);
  const isPlaying = useTelemetryStore((s) => s.isReplayPlaying);
  const speed = useTelemetryStore((s) => s.replaySpeed);
  const setReplayIndex = useTelemetryStore((s) => s.setReplayIndex);
  const setIsPlaying = useTelemetryStore((s) => s.setIsReplayPlaying);
  const setReplaySpeed = useTelemetryStore((s) => s.setReplaySpeed);
  const clearReplay = useTelemetryStore((s) => s.clearReplay);

  const animRef = useRef(0);
  const playStartRef = useRef(0);
  const playStartMsRef = useRef(0);

  const hasRecording = recording.length > 0;
  const currentPoint = hasRecording && replayIndex >= 0 ? recording[replayIndex] : null;

  useEffect(() => {
    if (!isPlaying || recording.length === 0) return;

    const currentIdx = useTelemetryStore.getState().replayIndex;
    const startIdx = currentIdx >= 0 ? currentIdx : 0;
    playStartRef.current = performance.now();
    playStartMsRef.current = recording[startIdx].elapsedMs;

    const animate = () => {
      const realElapsed = (performance.now() - playStartRef.current) * speed;
      const targetMs = playStartMsRef.current + realElapsed;
      const lastPoint = recording[recording.length - 1];

      if (targetMs >= lastPoint.elapsedMs) {
        setReplayIndex(recording.length - 1);
        setIsPlaying(false);
        return;
      }

      let lo = 0;
      let hi = recording.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (recording[mid].elapsedMs <= targetMs) lo = mid;
        else hi = mid - 1;
      }

      setReplayIndex(lo);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, speed, recording, setReplayIndex, setIsPlaying]);

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value, 10);
      setReplayIndex(idx);
      if (isPlaying) {
        playStartRef.current = performance.now();
        playStartMsRef.current = recording[idx].elapsedMs;
      }
    },
    [isPlaying, recording, setReplayIndex]
  );

  const togglePlay = useCallback(() => {
    if (recording.length === 0) return;
    if (replayIndex >= recording.length - 1) {
      setReplayIndex(0);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, recording, replayIndex, setReplayIndex, setIsPlaying]);

  return (
    <aside className="replay-panel">
      <div className="replay-panel-header">Replay</div>
      <div className="replay-panel-body">
        {!hasRecording && (
          <span className="replay-placeholder">Run simulation first</span>
        )}
        {hasRecording && (
          <div className="replay-controls">
            <div className="replay-info">
              <span>{currentPoint ? formatTime(currentPoint.elapsedMs) : '00:00.000'}</span>
              <span className="replay-points">{replayIndex + 1} / {recording.length}</span>
            </div>
            <input
              type="range"
              className="replay-slider"
              min={0}
              max={recording.length - 1}
              value={replayIndex >= 0 ? replayIndex : 0}
              onChange={handleSlider}
            />
            <div className="replay-actions">
              <button className="replay-btn replay-btn-play" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="replay-speeds">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    className={`replay-speed-btn ${speed === s ? 'active' : ''}`}
                    onClick={() => setReplaySpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <button
                className="replay-btn replay-btn-export"
                onClick={() => downloadRecording(recording)}
                title="Export JSON"
              >
                ⬇
              </button>
              <button
                className="replay-btn replay-btn-clear"
                onClick={clearReplay}
                title="Clear"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
