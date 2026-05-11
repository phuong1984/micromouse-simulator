# Micromouse Simulator — Master Plan

> **Dự án**: Web app giáo dục mô phỏng robot micromouse
> **Tech Stack**: React 18 + TypeScript + Vite + Matter.js + PixiJS v8 + Blockly + MicroPython WASM + Zustand + Tailwind CSS
> **Ngày tạo**: 2026-05-09
> **Revision**: 3
> **Tài liệu tham khảo**: docs/micromouse_docs/ (12 files)

---

## Quy ước Chung

- **Unit logic**: mm và gram (renderer tự scale sang pixel)
- **Modules không import chéo** — giao tiếp qua shared types + Zustand stores + postMessage
- **Simulation chạy trong Web Worker** (MicroPython WASM + Matter.js)
- **Deterministic simulation** — cùng input → cùng output (dễ replay)
- **Comment code bằng tiếng Anh**
- **Python code style**: snake_case cho function/method names
- **Blockly labels**: Tiếng Việt (ưu tiên UX giáo dục)

---

## Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                        MAIN THREAD                          │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Robot    │  │   Maze       │  │   Code Editor         │  │
│  │ Config   │  │   Editor     │  │   ┌────────────────┐  │  │
│  │ Store    │  │   Store      │  │   │ Blockly Editor │  │  │
│  └────┬─────┘  └──────┬───────┘  │   └────────────────┘  │  │
│       │               │          │   ┌────────────────┐  │  │
│       │               │          │   │ Monaco Editor  │  │  │
│       └───────────┬───┘          │   │ (Python)       │  │  │
│                   │              │   └────────────────┘  │  │
│                   ▼              └──────────┬───────────┘  │
│            ┌──────────────┐                  │              │
│            │ Simulation   │◄─────────────────┘              │
│            │ Store        │    (pythonCode string)          │
│            └──────┬───────┘                                 │
│                   │ postMessage                             │
│                   ▼                                         │
│            ┌──────────────┐    ┌───────────────────────┐    │
│            │ Telemetry    │    │ SimulationRenderer     │    │
│            │ Store        │    │ (PixiJS)               │    │
│            │              │    │                        │    │
│            │ • Sensors    │    │ • Maze Layer (static)  │    │
│            │ • Motors     │    │ • Robot Layer (dynamic)│    │
│            │ • Position   │    │ • Overlay Layer        │    │
│            │ • Console    │    │ • Sensor Rays          │    │
│            │ • Replay     │    │ • Path Trail           │    │
│            └──────────────┘    └────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                    postMessage (WorkerMessage types)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     WEB WORKER                              │
│                                                             │
│  ┌─────────────────┐                                        │
│  │ MicroPython WASM │  ← @micropython/... (~500KB)         │
│  │ (Python runtime) │     jsffi.set() for Robot API         │
│  └────────┬────────┘                                        │
│           │ runPythonAsync(userCode)                        │
│           ▼                                                  │
│  ┌─────────────────┐    ┌──────────────────────────┐        │
│  │ RobotAPI Bridge  │    │ Matter.js Physics Engine │        │
│  │ (JS functions)   │    │                          │        │
│  │ • move()         │    │ • createPhysicsWorld()   │        │
│  │ • turn()         │    │ • createRobotBody()      │        │
│  │ • get_sensor()   │    │ • addMazeWalls()         │        │
│  │ • stop()         │    │ • applyMotorForces()     │        │
│  │ • set_motor_speeds│   │ • SensorSimulator        │        │
│  │ • get_position() │    │ • tick loop (60fps)      │        │
│  └─────────────────┘    └──────────────────────────┘        │
│                                                             │
│  postMessage(STATE_UPDATE) → Main Thread                    │
│  postMessage(FINISHED / PYTHON_ERROR) → Main Thread         │
└─────────────────────────────────────────────────────────────┘
```

---

## Luồng Hoạt Động

```
[User cấu hình Robot] → robotConfigStore (RobotSpec)
         ↓
[User vẽ/chọn Maze]  → mazeStore (MazeGrid)
         ↓
[User viết code]      → codeEditorStore (Python string)
         ↓
[Nhấn ▶ Run]
         ↓
SimulationController.start()
  ├── Validate (RobotSpec + MazeGrid)
  ├── Worker.postMessage({ type: 'START', payload: { robotSpec, mazeGrid, pythonCode } })
  │
  │   (trong Worker)
  │   ├── Khởi tạo Matter.js engine
  │   ├── Tạo robot body
  │   ├── Tạo maze walls
  │   ├── Load MicroPython WASM (nếu chưa)
  │   ├── Inject Robot API vào MicroPython (jsffi)
  │   ├── micropython.runPythonAsync(pythonCode)
  │   └── Start tick loop
  │
  │   (mỗi tick - 16.67ms)
  │   ├── applyMotorForces()
  │   ├── Matter.Engine.update()
  │   ├── SensorSimulator.update()
  │   ├── Kiểm tra pending moves (resolve khi move/turn xong)
  │   ├── postMessage({ type: 'STATE_UPDATE', payload: SimState })
  │   └── Kiểm tra goal → postMessage({ type: 'FINISHED' })
  │
  ├── Main thread nhận STATE_UPDATE
  │   ├── telemetryStore.pushState()
  │   └── renderer.updateFrame()
  │
  └── Worker → FINISHED / PYTHON_ERROR
      └── Dừng simulation, hiện kết quả
```

---

## Các Type Definitions Cần Thống Nhất

| Type | File | Ghi chú |
|------|------|---------|
| `Wall` | `shared/types/maze.ts` | Bitmask: NORTH=8, EAST=4, SOUTH=2, WEST=1 |
| `MazeGrid` | `shared/types/maze.ts` | `{ rows, cols, cellSize: 180, wallThickness: 12, cells: number[][], start, goal }` |
| `RobotSpec` | `shared/types/robot.ts` | Base, Motors, Wheels, Sensors |
| `SimState` | `shared/types/simulation.ts` | tick, robot, sensors, motorRPMs, isFinished... |
| `WallSegment` | `shared/types/simulation.ts` | x, y, width, height, angle (mm) |
| `PathPoint` | `shared/types/telemetry.ts` | tick, x, y, angle, sensorReadings, elapsedMs |
| WorkerMessage | `shared/types/workerMessages.ts` | MainToWorker ∪ WorkerToMain |
| `RenderOptions` | `renderer/types.ts` | showSensorRays, showPathTrail, showCellNumbers |

---

## Cấu Trúc Thư Mục

```
src/
├── app/
│   ├── App.tsx
│   └── App.css
├── modules/
│   ├── robot-config/        # Config panel + Zustand store
│   ├── maze/                # Maze editor + store
│   ├── code-editor/         # Blockly + Monaco + robotBlocks + toolbox + store
│   ├── simulation/          # Physics, motor, sensor, loop, mazeToPhysics
│   ├── renderer/            # PixiJS SimulationRenderer + types
│   └── telemetry/           # Panels + ReplayRecorder + store
├── shared/
│   ├── types/               # Tất cả TypeScript interfaces
│   ├── constants/           # Presets, hằng số vật lý
│   └── utils/               # maze.ts helpers
└── workers/
    └── simulation.worker.ts # Web Worker (Matter.js + MicroPython)
```

---

## Thứ Tự Thực Hiện (9 Phase)

| Phase | Tên | Tasks | Thời gian | Deliverable |
|-------|-----|-------|-----------|-------------|
| 0 | Setup & Infrastructure | 8 | 5h | Project sẵn sàng, types, presets, utils |
| 1 | Static Renderer | 7 | 8h | Maze + robot hiển thị trên canvas |
| 2 | Blockly + Python Codegen | 8 | 10h | Blockly hoạt động, generate Python |
| 3 | MicroPython Execution | 8 | 10h | Python chạy trong Worker |
| 4 | Physics & Simulation Loop | 8 | 8h | Vật lý + tick loop hoạt động |
| 5 | Sensor Simulation | 8 | 8h | Cảm biến + raycasting hoạt động |
| 5.5 | Integration | 4 | 3h | Blockly → MicroPython → Physics kết nối |
| 6 | Robot Config UI | 8 | 8h | Config panel hoạt động |
| 7 | Maze Editor | 7 | 8.5h | Maze editor hoạt động |
| 8 | Telemetry & Replay | 10 | 9h | Dashboard + replay |
| 9 | Polish & Education | 8 | 11h | Trải nghiệm hoàn chỉnh |
| **TỔNG** | | **84** | **~98.5h** | |

---

## Rủi Ro Phải Theo Dõi

| Rủi ro | Mức độ | Mitigation |
|---------|--------|------------|
| MicroPython WASM ~500KB tải chậm | 🟡 | Loading screen, cache |
| Async bridge JS↔Python phức tạp | 🔴 | Test `robot.move()` trước, đơn giản nhất |
| MicroPython thiếu features (f-string, walrus) | 🟡 | Dùng Python 3.4-compatible syntax |
| MicroPython trong Worker ít tài liệu | 🟡 | Test sớm trên Chrome/Firefox/Safari |
| jsffi module còn mới | 🟡 | Fix version, test kỹ |

---

## Sprint Gợi Ý

| Sprint | Phase | Thời gian | Kết quả |
|--------|-------|-----------|---------|
| 1 | 0 + 1 | 3-4 ngày | Project setup, static maze + robot |
| 2 | 2 | 2-3 ngày | Blockly → Python code gen |
| 3 | 3 + 4 | 3-4 ngày | MicroPython + physics hoạt động |
| 4 | 5 + 5.5 | 2-3 ngày | Sensors + integration |
| 5 | 6 + 7 | 3-4 ngày | Config + Maze editor |
| 6 | 8 + 9 | 3-4 ngày | Telemetry + Polish |

**Ước tính tổng**: ~18-22 ngày full-time / ~98.5 giờ