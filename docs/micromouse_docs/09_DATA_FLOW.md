# 09 — Data Flow & Event Architecture

## Nguyên tắc

- **Unidirectional data flow**: RobotConfig + MazeGrid + UserCode → Simulation → SimState → UI
- **Modules không import nhau**: giao tiếp qua Zustand stores và custom events
- **Simulation là source of truth khi đang chạy**: UI không tự tính toán gì từ config khi sim đang chạy

---

## Luồng khởi động Simulation

```
User nhấn [▶ Run]
  │
  ▼
SimulationController.start()
  ├── Lấy RobotSpec từ robotConfigStore
  ├── Lấy MazeGrid từ mazeStore
  ├── Lấy userCode từ codeEditorStore
  ├── Validate (robotSpec + mazeGrid) → nếu lỗi: hiện ValidationErrors, dừng
  │
  ▼
Worker.postMessage({ type: 'START', payload: { robotSpec, mazeGrid, userCode } })
  │
  ▼ (trong Web Worker)
handleStart()
  ├── Khởi tạo Matter.js engine
  ├── Tạo robot body từ robotSpec
  ├── Tạo wall bodies từ mazeGrid
  ├── Khởi tạo SensorSimulator
  ├── Compile + run user code (async)
  └── Start tick loop

  (mỗi tick)
  │
  ▼
Worker.postMessage({ type: 'STATE_UPDATE', payload: SimState })
  │
  ▼ (main thread)
simulationStore.pushState(simState)
  ├── telemetryStore.pushState(simState)  → update panels
  └── renderer.updateFrame(simState)      → update PixiJS scene
```

---

## Store Dependencies

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ robotConfigStore│    │   mazeStore     │    │ codeEditorStore │
│  spec: RobotSpec│    │  grid: MazeGrid │    │  source: string │
│  presets: []    │    │  presets: []    │    │  mode: blockly/ │
└────────┬────────┘    └────────┬────────┘    │        monaco   │
         │                     │             └────────┬────────┘
         └──────────────┬───────┘                     │
                        ▼                             │
              ┌─────────────────┐                     │
              │simulationStore  │◄────────────────────┘
              │ worker: Worker  │
              │ status: idle/   │
              │   running/done  │
              │ currentState:   │
              │   SimState|null │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
    ┌──────────────┐  ┌─────────────────┐
    │telemetryStore│  │  renderer       │
    │ history[]    │  │  (PixiJS, not   │
    │ consoleLog[] │  │  a Zustand store│
    │ replay[]     │  │  — direct calls)│
    └──────────────┘  └─────────────────┘
```

---

## SimulationStore (chính)

```typescript
// modules/simulation/store.ts

type SimStatus = 'idle' | 'running' | 'paused' | 'finished' | 'error';

interface SimulationStore {
  status: SimStatus;
  currentState: SimState | null;
  result: SimResult | null;
  error: string | null;
  worker: Worker | null;
  speedMultiplier: number; // 0.5, 1, 2, 4

  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  setSpeedMultiplier: (x: number) => void;
  handleWorkerMessage: (msg: WorkerToMain) => void;
}

// Implementation
const useSimulationStore = create<SimulationStore>((set, get) => ({
  status: 'idle',
  currentState: null,
  result: null,
  error: null,
  worker: null,
  speedMultiplier: 1,

  start: () => {
    const { robotSpec } = useRobotConfigStore.getState();
    const { grid } = useMazeStore.getState();
    const { getCompiledCode } = useCodeEditorStore.getState();

    // Validate
    const errors = validateRobotSpec(robotSpec);
    if (errors.length > 0) { ... return; }

    // Tạo Worker mới mỗi lần start (để đảm bảo clean state)
    const worker = new Worker(new URL('../../workers/simulation.worker.ts', import.meta.url));
    worker.onmessage = (e) => get().handleWorkerMessage(e.data);
    worker.onerror = (e) => set({ status: 'error', error: e.message });

    worker.postMessage({
      type: 'START',
      payload: { robotSpec, mazeGrid: grid, userCode: getCompiledCode() }
    });

    set({ status: 'running', worker, currentState: null, result: null, error: null });
  },

  handleWorkerMessage: (msg) => {
    switch (msg.type) {
      case 'STATE_UPDATE':
        set({ currentState: msg.payload });
        useTelemetryStore.getState().pushState(msg.payload);
        // Renderer update gọi trực tiếp, không qua store
        rendererRef.current?.updateFrame(msg.payload);
        break;
      case 'FINISHED':
        set({ status: 'finished', result: msg.payload });
        break;
      case 'USER_CODE_ERROR':
        set({ status: 'error', error: msg.payload.message });
        useTelemetryStore.getState().appendLog(msg.payload.message, 'error');
        break;
    }
  },

  stop: () => {
    get().worker?.postMessage({ type: 'STOP' });
    get().worker?.terminate();
    set({ status: 'idle', worker: null });
  },
}));
```

---

## Luồng Reset

```
User nhấn [⏹ Stop] hoặc [↺ Reset]
  │
  ▼
simulationStore.stop()
  ├── worker.postMessage('STOP')
  ├── worker.terminate()
  ├── set status = 'idle'
  │
  ├── telemetryStore.clearHistory()
  └── renderer.reset()           // xóa path trail, reset robot visual về start
```

---

## Phối hợp Config + Running State

Khi sim đang chạy, user KHÔNG được thay đổi:
- RobotSpec (sensor IDs đang được code dùng)
- MazeGrid (walls đã tạo physics bodies)

→ Config panels bị **disabled** khi `status === 'running' || status === 'paused'`

Code editor vẫn có thể edit nhưng sẽ không apply cho đến lần Run tiếp theo.

---

## Lưu ý

- `rendererRef` là một React ref được truyền vào simulationStore khi mount — pattern này tránh import cycle giữa store và renderer module
- Worker được terminate() và tạo mới mỗi lần start() → không lo memory leak hay state cũ
- Zustand stores không nên contain objects lớn (như Matter.js world) — chỉ store serializable state
