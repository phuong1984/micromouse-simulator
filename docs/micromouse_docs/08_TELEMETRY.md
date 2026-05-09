# 08 — Telemetry & Data Panels

## Mục tiêu

Hiển thị real-time data trong khi simulation chạy, giúp người dùng debug code và hiểu hành vi robot.

---

## Panels cần có

### 1. Status Bar (luôn hiện)

```
[⏱ 00:03.421]  [🏁 Đang chạy]  [📍 x: 540mm  y: 360mm  θ: 90°]
```

### 2. Sensor Panel

```
┌─────────────────────────────────┐
│  Cảm biến                       │
├──────────────┬──────────────────┤
│  front       │  ████░░░░  127mm │
│  left        │  ██████░░  168mm │
│  right       │  ░░░░░░░░  ---   │
│  front-left  │  ███░░░░░   88mm │
│  front-right │  █████░░░  143mm │
└──────────────┴──────────────────┘
```

Progress bar màu xanh → vàng → đỏ theo khoảng cách (gần = đỏ)

### 3. Motor Panel

```
┌──────────────────────────────────┐
│  Motor                           │
├────────────┬──────────┬──────────┤
│            │  Trái    │  Phải    │
│  Target    │ +2400rpm │ +2400rpm │
│  Actual    │ +2387rpm │ +2401rpm │
│  Torque    │  42 N·mm │  43 N·mm │
└────────────┴──────────┴──────────┘
```

### 4. Position / Heading Chart (mini)

Line chart nhỏ hiển thị lịch sử 5 giây gần nhất:
- X position (mm)
- Y position (mm)
- Heading (degrees)

Dùng `recharts` hoặc Canvas vẽ tay (nhẹ hơn).

### 5. Console / Log

```
> [00:01.2] move(180) started
> [00:02.1] move(180) completed
> [00:02.1] getSensor('front') → 45mm
> [00:02.1] turn(-90) started
> [00:02.8] turn(-90) completed
```

User code có thể gọi `robot.log('message')` để in ra đây.

---

## TypeScript Components

```typescript
// modules/telemetry/SensorPanel.tsx

interface SensorPanelProps {
  readings: Record<string, number>;
  specs: SensorSpec[];
}

export function SensorPanel({ readings, specs }: SensorPanelProps) {
  return (
    <div className="telemetry-panel">
      <h3>Cảm biến</h3>
      <table>
        <tbody>
          {specs.map(sensor => {
            const val = readings[sensor.id] ?? -1;
            const pct = val > 0 ? Math.min(1, val / sensor.maxRange) : 0;
            const color = val < 0 ? 'gray' : val < 50 ? 'red' : val < 100 ? 'orange' : 'green';
            return (
              <tr key={sensor.id}>
                <td className="sensor-id">{sensor.id}</td>
                <td>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
                  </div>
                </td>
                <td className="sensor-value">
                  {val < 0 ? '---' : `${val}mm`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Replay System

### Ghi lại

```typescript
// modules/telemetry/replayRecorder.ts

export interface PathPoint {
  tick: number;
  x: number;
  y: number;
  angle: number;
  sensorReadings: Record<string, number>;
  elapsedMs: number;
}

export class ReplayRecorder {
  private points: PathPoint[] = [];
  private sampleInterval = 3; // ghi mỗi 3 tick (~20fps)

  record(state: SimState) {
    if (state.tick % this.sampleInterval !== 0) return;
    this.points.push({
      tick: state.tick,
      x: state.robot.x,
      y: state.robot.y,
      angle: state.robot.angle,
      sensorReadings: { ...state.sensors },
      elapsedMs: state.elapsedMs,
    });
  }

  getRecording(): PathPoint[] { return this.points; }
  reset() { this.points = []; }
}
```

### Phát lại

```typescript
// modules/telemetry/ReplayPlayer.tsx

export function ReplayPlayer({ recording }: { recording: PathPoint[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIdx(idx => {
        if (idx >= recording.length - 1) { setIsPlaying(false); return idx; }
        return idx + 1;
      });
    }, 50); // 20fps playback
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentPoint = recording[currentIdx];

  return (
    <div>
      <input
        type="range" min={0} max={recording.length - 1} value={currentIdx}
        onChange={e => setCurrentIdx(Number(e.target.value))}
      />
      <span>{formatTime(currentPoint?.elapsedMs)}</span>
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      {/* Renderer nhận currentPoint thay vì live SimState */}
    </div>
  );
}
```

---

## Zustand Store cho Telemetry

```typescript
// modules/telemetry/store.ts

interface TelemetryStore {
  currentState: SimState | null;
  history: SimState[];          // last 300 states (~5s at 60fps)
  isRecording: boolean;
  replayRecording: PathPoint[];
  consoleLog: LogEntry[];

  pushState: (state: SimState) => void;
  appendLog: (msg: string, level: 'info' | 'warn' | 'error') => void;
  startRecording: () => void;
  stopRecording: () => PathPoint[];
  clearHistory: () => void;
}
```

---

## Lưu ý

- Telemetry store chỉ giữ 300 states gần nhất trong memory (tránh memory leak)
- ReplayRecording lưu đầy đủ để export (JSON file) cho phép so sánh runs
- Console log giới hạn 200 entries, auto-scroll xuống cuối
- Tốc độ update UI: debounce ở 30fps dù sim chạy 60fps (tránh quá nhiều re-renders)
