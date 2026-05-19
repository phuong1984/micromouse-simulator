import { useSimulationStore } from '../simulation/store';
import { useMazeStore } from '../maze/store';

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

const STATUS_LABELS: Record<string, string> = {
  idle: '⏹ Idle',
  running: '▶ Running',
  finished: '✅ Finished',
  error: '❌ Error',
};

function getBestTime(mazeId: string): number | null {
  const val = localStorage.getItem(`best-${mazeId}`);
  return val ? parseFloat(val) : null;
}

function getMazeId(): string {
  const grid = useMazeStore.getState().mazeGrid;
  const goalTag = grid.goalType === 'center2x2' ? 'center' : `${grid.goal.row}/${grid.goal.col}`;
  return `${grid.rows}x${grid.cols}-s${grid.start.row}/${grid.start.col}-g${goalTag}`;
}

export function StatusBar() {
  const simState = useSimulationStore((s) => s.currentState);
  const simStatus = useSimulationStore((s) => s.status);

  const time = simState ? simState.elapsedMs : 0;
  const robot = simState?.robot;
  const heading = robot ? ((robot.angle * 180) / Math.PI) % 360 : 0;
  const bestTime = simStatus === 'finished' ? getBestTime(getMazeId()) : null;

  return (
    <div className="status-bar">
      <span className="status-bar-item">
        ⏱ {formatTime(time)}
      </span>
      <span className="status-bar-item">
        {STATUS_LABELS[simStatus] ?? '⏹ Idle'}
      </span>
      {robot && (
        <span className="status-bar-item">
          📍 x: {robot.x.toFixed(1)}mm y: {robot.y.toFixed(1)}mm θ: {heading.toFixed(0)}°
        </span>
      )}
      {bestTime !== null && (
        <span className="status-bar-item status-bar-best">
          🏆 Best: {formatTime(bestTime)}
        </span>
      )}
    </div>
  );
}
