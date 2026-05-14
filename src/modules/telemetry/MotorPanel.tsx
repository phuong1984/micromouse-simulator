import { useSimulationStore } from '../simulation/store';
import { useRobotConfigStore } from '../robot-config/store';

export function MotorPanel() {
  const motorRPMs = useSimulationStore((s) => s.currentState?.motorRPMs);
  const wheels = useRobotConfigStore((s) => s.spec.wheels);

  return (
    <div className="motor-panel">
      <div className="motor-panel-header">Motor RPM</div>
      <div className="motor-panel-body">
        {wheels.length === 0 && (
          <div className="motor-empty">No wheels configured</div>
        )}
        {wheels.map((wheel, i) => {
          const rpm = motorRPMs?.[i] ?? 0;
          const absRpm = Math.abs(rpm);
          const pct = absRpm / wheel.maxRPM;
          let color: string;
          if (absRpm === 0) {
            color = '#6b7280';
          } else if (pct <= 0.3) {
            color = '#ef4444';
          } else if (pct <= 0.6) {
            color = '#f59e0b';
          } else {
            color = '#22c55e';
          }
          return (
            <div key={wheel.id} className="motor-row">
              <div className="motor-label">{wheel.id}</div>
              <div className="motor-bar-track">
                <div
                  className="motor-bar-fill"
                  style={{
                    width: `${Math.min(pct * 100, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="motor-value" style={{ color }}>
                {Math.round(rpm)} RPM
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
