import { useSimulationStore } from '../simulation/store';
import { useRobotConfigStore } from '../robot-config/store';

function getBarColor(distance: number): string {
  if (distance < 50) return '#22c55e';
  if (distance < 100) return '#f59e0b';
  return '#ef4444';
}

export function SensorPanel() {
  const sensors = useSimulationStore((s) => s.currentState?.sensors);
  const sensorSpecs = useRobotConfigStore((s) => s.spec.sensors);

  return (
    <div className="sensor-panel">
      <div className="sensor-panel-header">Cảm biến</div>
      <div className="sensor-panel-body">
        {sensorSpecs.length === 0 && (
          <div className="sensor-empty">No sensors configured</div>
        )}
        {sensorSpecs.map((spec) => {
          const raw = sensors?.[spec.id];
          const dist = raw !== undefined ? raw : null;
          const pct = dist !== null ? Math.min(dist / spec.maxRange, 1) : 0;
          return (
            <div key={spec.id} className="sensor-row">
              <div className="sensor-label">{spec.id}</div>
              <div className="sensor-bar-track">
                {dist !== null && (
                  <div
                    className="sensor-bar-fill"
                    style={{
                      width: `${pct * 100}%`,
                      backgroundColor: getBarColor(dist),
                    }}
                  />
                )}
              </div>
              <div className="sensor-value" style={{ color: dist !== null ? getBarColor(dist) : '#6b7280' }}>
                {dist !== null ? `${Math.round(dist)}mm` : '---'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
