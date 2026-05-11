# Phase 8 — Telemetry & Replay

> **Goal**: Dashboard real-time (sensor, motor, position), replay runs, export data
> **Ước tính**: 9h
> **Input**: Phase 4 (simulation loop), Phase 5 (sensors)
> **Output**: Status bar, sensor/motor panels, chart, replay player

---

## Completed: ✅

- [ ] 8.1 — Status Bar
- [ ] 8.2 — Sensor Panel
- [ ] 8.3 — Motor Panel
- [ ] 8.4 — Position/Heading Chart
- [ ] 8.5 — Console/Log Panel
- [ ] 8.6 — ReplayRecorder (Worker-side)
- [ ] 8.7 — ReplayPlayer component
- [ ] 8.8 — Export replay JSON
- [ ] 8.9 — Speed multiplier
- [ ] 8.10 — Best time (localStorage)

---

## Task Details

### 8.1 — Status Bar
**Deliverable**: Top bar: time, status, position, heading  
**Ước tính**: 1h

```
[⏱ 00:03.421]  [▶ Running]  [📍 x: 540mm  y: 360mm  θ: 90°]
```

### 8.2 — Sensor Panel
**Deliverable**: Progress bars per sensor  
**Ước tính**: 1h

```
┌─────────────────────────────┐
│  Cảm biến                    │
├──────────────┬──────────────┤
│  front       │  ████░░░░ 127mm│
│  left        │  ██████░░ 168mm│
│  right       │  ░░░░░░░░  --- │
│  front-left  │  ███░░░░░  88mm│
│  front-right │  █████░░░ 143mm│
└──────────────┴──────────────┘
```

Colors: xanh (< 50mm) → cam (50-100mm) → đỏ (> 100mm hoặc gần)

### 8.3 — Motor Panel
**Deliverable**: Target vs actual RPM, torque  
**Ước tính**: 1h

```
┌──────────────────────────────┐
│  Motor                        │
├────────────┬──────────┬───────┤
│            │  Trái    │  Phải │
│  Target    │ +2400rpm │ +2400 │
│  Actual    │ +2387rpm │ +2401 │
│  Torque    │  42 N·mm │  43   │
└────────────┴──────────┴───────┘
```

### 8.4 — Position/Heading Chart
**Deliverable**: Mini line chart, 5s history  
**Ước tính**: 1.5h

- Canvas-based line chart (không dùng recharts để tránh thêm dependency nặng)
- 3 lines: X position (blue), Y position (green), Heading (red)
- Rolling window: 300 data points (5 giây × 60fps)

### 8.5 — Console/Log Panel
**Deliverable**: Auto-scrolling log  
**Ước tính**: 1h

```
> [00:01.200] move(180) started
> [00:02.100] move(180) completed
> [00:02.100] get_sensor('front') → 45
> [00:02.100] turn(-90) started
> [00:02.800] turn(-90) completed
```

API: `robot.log('message')` → append to console panel
Giới hạn: 200 entries, auto-scroll to bottom

### 8.6 — ReplayRecorder
**Deliverable**: Worker-side recording  
**Ước tính**: 1h

```typescript
class ReplayRecorder {
  points: PathPoint[] = [];
  sampleInterval = 3; // ghi mỗi 3 ticks (~20fps)
  
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
}
```

### 8.7 — ReplayPlayer
**Deliverable**: Slider + play/pause, sync renderer  
**Ước tính**: 1h

```tsx
function ReplayPlayer({ recording }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  
  // Slider + play/pause button
  // Pass current point to renderer instead of live SimState
}
```

### 8.8 — Export Replay
**Deliverable**: Download JSON  
**Ước tính**: 30p

```typescript
function exportReplay(recording: PathPoint[]) {
  const blob = new Blob([JSON.stringify(recording)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `replay-${Date.now()}.json`;
  a.click();
}
```

### 8.9 — Speed Multiplier
**Deliverable**: 0.5x, 1x, 2x, 4x selector  
**Ước tính**: 45p

Trong Worker: skip ticks khi multiplier > 1 (xử lý nhiều steps mỗi frame)

### 8.10 — Best Time
**Deliverable**: Persist per maze  
**Ước tính**: 30p

```typescript
function getBestTime(mazeId: string): number | null {
  return JSON.parse(localStorage.getItem(`best-${mazeId}`) || 'null');
}

function saveBestTime(mazeId: string, time: number) {
  const current = getBestTime(mazeId);
  if (current === null || time < current) {
    localStorage.setItem(`best-${mazeId}`, String(time));
  }
}
```

---

## Acceptance Criteria

- [ ] Status bar hiển thị thời gian, trạng thái, tọa độ, heading
- [ ] Sensor panel: 5 thanh progress, màu theo khoảng cách
- [ ] Motor panel: target vs actual RPM
- [ ] Chart hiển thị position + heading history 5 giây
- [ ] Console log: auto-scroll, robot.log() hiển thị
- [ ] Replay: slider, play/pause, xem lại đường đi
- [ ] Export replay JSON nút download hoạt động
- [ ] Speed multiplier: 0.5x/1x/2x/4x hoạt động
- [ ] Best time lưu localStorage, hiển thị khi complete

---

## Store Design

```typescript
interface TelemetryStore {
  currentState: SimState | null;
  history: SimState[];          // last 300 states
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

UI update debounce: 30fps (dù sim chạy 60fps)