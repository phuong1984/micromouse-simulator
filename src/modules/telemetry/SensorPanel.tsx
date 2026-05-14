import { useSimulationStore } from '../simulation/store';
import { useRobotConfigStore } from '../robot-config/store';

function getBarColor(distance: number, maxRange: number): string {
  if (distance < 0) return '#6b7280';
  const pct = distance / maxRange;
  if (pct <= 0.3) return '#ef4444';
  if (pct <= 0.6) return '#f59e0b';
  return '#22c55e';
}

export function SensorPanel() {
  const sensors = useSimulationStore((s) => s.currentState?.sensors);
  const sensorSpecs = useRobotConfigStore((s) => s.spec.sensors);

  return (
    <div className="sensor-panel">
      <div className="sensor-panel-header">Sensor reading</div>
      <div className="sensor-panel-body">
        {sensorSpecs.length === 0 && (
          <div className="sensor-empty">No sensors configured</div>
        )}
        {sensorSpecs.map((spec) => {
          const raw = sensors?.[spec.id];
          const dist = raw !== undefined ? raw : -1;
          const pct = dist >= 0 ? Math.min(dist / spec.maxRange, 1) : 0;
          const color = getBarColor(dist, spec.maxRange);
          return (
            <div key={spec.id} className="sensor-row">
              <div className="sensor-label">{spec.id}</div>
              <div className="sensor-bar-track">
                {dist >= 0 && (
                  <div
                    className="sensor-bar-fill"
                    style={{
                      width: `${pct * 100}%`,
                      backgroundColor: color,
                    }}
                  />
                )}
              </div>
              <div className="sensor-value" style={{ color: dist >= 0 ? color : '#6b7280' }}>
                {dist >= 0 ? `${Math.round(dist)}mm` : '---'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
