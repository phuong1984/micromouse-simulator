import { useRobotConfigStore } from './store';
import { BASE_CORNER_RADIUS, WHEEL_CORNER_RADIUS } from '../../shared/constants/render-colors';

const CELL_SIZE = 180;
const VIEWBOX = 360;
const CX = VIEWBOX / 2;
const CY = VIEWBOX / 2;

function toSvgX(x: number): number {
  return CX + x;
}

function toSvgY(y: number): number {
  return CY - y;
}

export function RobotPreview() {
  const spec = useRobotConfigStore((s) => s.spec);
  const { base, wheels, sensors } = spec;

  return (
    <div className="config-right-panel">
      <div style={{ padding: '24px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="w-full h-full">
        <rect
          x={CX - CELL_SIZE / 2}
          y={CY - CELL_SIZE / 2}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill="none"
          stroke="#767D8C"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text
          x={CX}
          y={CY + CELL_SIZE / 2 + 14}
          textAnchor="middle"
          fill="#767D8C"
          fontSize={10}
        >
          180×180mm cell
        </text>

        <line
          x1={CX - 10} y1={CY} x2={CX + 10} y2={CY}
          stroke="#374151" strokeWidth={0.5}
        />
        <line
          x1={CX} y1={CY - 10} x2={CX} y2={CY + 10}
          stroke="#374151" strokeWidth={0.5}
        />

        {sensors.map((sen) => {
          const sx = toSvgX(sen.position.x);
          const sy = toSvgY(sen.position.y);
          const aRad = ((90 - sen.angle) * Math.PI) / 180;
          const fov = ((sen.fov ?? 10) * Math.PI) / 180;
          const range = sen.maxRange;
          const x1 = sx + range * Math.cos(aRad - fov / 2);
          const y1 = sy - range * Math.sin(aRad - fov / 2);
          const x2 = sx + range * Math.cos(aRad + fov / 2);
          const y2 = sy - range * Math.sin(aRad + fov / 2);
          return (
            <polygon
              key={`fov-${sen.id}`}
              points={`${sx},${sy} ${x1},${y1} ${x2},${y2}`}
              fill="rgba(59,130,246,0.08)"
              stroke="none"
            />
          );
        })}

        {base.shape === 'circle' ? (
          <ellipse
            cx={CX} cy={CY}
            rx={base.width / 2} ry={base.height / 2}
            fill="#1e3a5f" stroke="#3b82f6" strokeWidth={2}
          />
        ) : (
          <rect
            x={CX - base.width / 2}
            y={CY - base.height / 2}
            width={base.width} height={base.height}
            rx={BASE_CORNER_RADIUS} fill="#1e3a5f" stroke="#3b82f6" strokeWidth={2}
          />
        )}

        <polygon
          points={`${CX},${CY - base.height / 2 - 6} ${CX - 5},${CY - base.height / 2 + 2} ${CX + 5},${CY - base.height / 2 + 2}`}
          fill="#60a5fa"
        />

        {/* Coordinate axes at robot center */}
        <g transform={`translate(${CX}, ${CY})`}>
          <line x1={0} y1={0} x2={26} y2={0} stroke="#6b7280" strokeWidth={1} />
          <polygon points="26,0 20,-4 20,4" fill="#60a5fa" />
          <text x={30} y={4} fill="#60a5fa" fontSize={10} fontWeight="bold">+X</text>
          <line x1={0} y1={0} x2={0} y2={-26} stroke="#6b7280" strokeWidth={1} />
          <polygon points="0,-26 -4,-20 4,-20" fill="#60a5fa" />
          <text x={4} y={-28} fill="#60a5fa" fontSize={10} fontWeight="bold">+Y</text>
          <text x={0} y={14} textAnchor="middle" fill="#9ca3af" fontSize={9}>(0,0)</text>
        </g>

        {wheels.map((w) => {
          const wx = toSvgX(w.position.x);
          const wy = toSvgY(w.position.y);
          return (
            <rect
              key={`wheel-${w.id}`}
              x={wx - (w.width ?? 8) / 2}
              y={wy - w.radius}
              width={w.width ?? 8}
              height={w.radius * 2}
              rx={WHEEL_CORNER_RADIUS}
              fill="#374151" stroke="#6b7280" strokeWidth={1}
            />
          );
        })}

        {sensors.map((sen) => {
          const sx = toSvgX(sen.position.x);
          const sy = toSvgY(sen.position.y);
          const aRad = ((90 - sen.angle) * Math.PI) / 180;
          const arrowLen = 12;
          return (
            <g key={`sensor-${sen.id}`}>
              <circle cx={sx} cy={sy} r={3} fill="#ef4444" />
              <line
                x1={sx} y1={sy}
                x2={sx + arrowLen * Math.cos(aRad)}
                y2={sy - arrowLen * Math.sin(aRad)}
                stroke="#ef4444" strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}
