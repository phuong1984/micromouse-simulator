# 🧠 AGENTS.md — AI Agent Instructions

> **File này dành cho AI agent (ChatGPT, Claude, v.v.)**
> Đọc file này TRƯỚC khi bắt đầu làm việc trên project.

---

## Project Summary

**Micromouse Simulator** — Web app giáo dục mô phỏng robot micromouse chạy mê cung.
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Physics**: Matter.js (Web Worker)
- **Rendering**: PixiJS v8 (WebGL, 60fps)
- **Code Editor**: Blockly (kéo thả, generate Python) + Monaco Editor (viết Python trực tiếp)
- **Python Runtime**: MicroPython WASM (~500KB, trong Web Worker)
- **State Management**: Zustand
- **Unit**: mm và gram (renderer tự scale)

---

## Project Structure

```
src/
├── app/                          # React entry, layout
│   ├── App.tsx
│   └── App.css
├── modules/                      # Feature modules (độc lập, không import chéo)
│   ├── robot-config/
│   │   ├── RobotConfig.tsx
│   │   ├── RobotPreview.tsx
│   │   └── store.ts
│   ├── maze/
│   │   ├── MazeEditor.tsx
│   │   ├── MazeRenderer.tsx
│   │   └── store.ts
│   ├── code-editor/
│   │   ├── BlocklyEditor.tsx
│   │   ├── MonacoEditor.tsx
│   │   ├── robotBlocks.ts
│   │   ├── toolbox.ts
│   │   └── store.ts
│   ├── simulation/
│   │   ├── physicsWorld.ts
│   │   ├── robotBody.ts
│   │   ├── motorModel.ts
│   │   ├── sensorSimulator.ts
│   │   ├── simulationLoop.ts
│   │   └── mazeToPhysics.ts
│   ├── renderer/
│   │   ├── SimulationRenderer.ts
│   │   └── types.ts
│   └── telemetry/
│       ├── SensorPanel.tsx
│       ├── MotorPanel.tsx
│       ├── PositionChart.tsx
│       ├── ConsolePanel.tsx
│       ├── ReplayPlayer.tsx
│       ├── ReplayRecorder.ts
│       └── store.ts
├── shared/
│   ├── types/
│   │   ├── maze.ts
│   │   ├── robot.ts
│   │   ├── simulation.ts
│   │   ├── workerMessages.ts
│   │   └── telemetry.ts
│   ├── constants/
│   │   ├── robot-presets.ts
│   │   └── maze-presets.ts
│   └── utils/
│       └── maze.ts
└── workers/
    └── simulation.worker.ts
plan/                              # All plan/tracking files
docs/                              # Technical documentation
index.html, package.json, etc.
```

---

## Current Phase & Status

**Current Phase**: 5 — Sensor Simulation (bắt đầu)

| Phase | Status |
|-------|--------|
| 0 | Setup & Infrastructure | ✅ Hoàn |
| 1 | Static Renderer (PixiJS) | ✅ Hoàn |
| 2 | Blockly + Python Codegen | ✅ Hoàn |
| 3 | MicroPython Execution Engine | ✅ Hoàn |
| 4 | Physics & Simulation Loop | ✅ Hoàn |
| 5 | Sensor Simulation | ⬜ Đang làm |
| 5.5 | Integration | ⬜ |
| 6 | Robot Config UI | ⬜ |
| 7 | Maze Editor | ⬜ |
| 8 | Telemetry & Replay | ⬜ |
| 9 | Polish & Education | ⬜ |

Check `plan/00_TRACKING.md` for detailed status.

---

## Key Design Decisions

| Decision | Value | Why |
|----------|-------|-----|
| Python Runtime | MicroPython WASM (~500KB) | Light, fast, đủ tính năng |
| Blockly target | Python | Giáo dục |
| Blockly storage | localStorage | Đơn giản |
| Cell size | 180mm | Chuẩn IEEE |
| Wall bitmask | N=8, E=4, S=2, W=1 | Docs standard |
| Simulation | Web Worker | Không block UI |
| Units | mm/gram | Renderer scale |
| Python naming | snake_case | Python convention |
| Blockly labels | Tiếng Việt | UX giáo dục |

---

## Core Principles (ĐỌC KỶ)

### 1. Module Independence
- Modules giao tiếp qua: shared types, Zustand stores, postMessage
- **KHÔNG import chéo giữa modules**

### 2. Simulation in Worker
- Tất cả physics, sensor, Python execution → trong `workers/simulation.worker.ts`
- Main thread: React UI + PixiJS rendering + Zustand stores

### 3. Units
- Logic: mm, gram
- Renderer: scale sang pixel

### 4. Deterministic Simulation
- Cùng input → cùng output (replay)
- Không dùng `Date.now()` hay `Math.random()` trong simulation

### 5. User Code Safety
- Code chạy trong MicroPython sandbox (Worker)
- Không có DOM, network, localStorage
- Chỉ dùng Robot API functions

### 6. Code Style
- TypeScript strict — không dùng `any`
- Comment tiếng Anh
- Một file = một concern
- Types define trong `shared/types/`, import lại — không define local

### 7. Performance
- PixiJS: reuse Graphics objects
- Telemetry: debounce UI 30fps
- Replay: sample 3 ticks (~20fps)
- Zustand: không store non-serializable objects

### 8. Error Handling
- Validate trước khi Run
- Catch Python exceptions → hiện lỗi, không crash Worker
- Timeout 30s cho user code

---

## Quick Type Reference

```typescript
Wall: NORTH=8, EAST=4, SOUTH=2, WEST=1 (bitmask)
MazeGrid: { rows, cols, cellSize:180, wallThickness:12, cells:number[][], start:CellPos, goal:CellPos }
RobotSpec: { base:BaseSpec, motors:MotorSpec[], wheels:WheelSpec[], sensors:SensorSpec[] }
SimState: { tick, robot{x,y,angle,vx,vy,av}, sensors:Record<string,number>, motorRPMs, isFinished, elapsedMs }
WallSegment: { x, y, width, height, angle } // mm
MainToWorker: { type:'START'|'STOP'|'STEP'|'RESET', payload? }
WorkerToMain: { type:'STATE_UPDATE'|'FINISHED'|'PYTHON_ERROR'|'WORKER_ERROR', payload }
```

## How to Start a Session

1. Đọc `SESSION_BRIEF.md` để biết mục tiêu session hiện tại
2. Đọc `plan/00_TRACKING.md` để biết status tổng thể
3. Đọc file plan của phase đang làm (VD: `plan/03_PHASE_2_BLOCKLY.md`)
4. Làm theo tasks từ trên xuống, verify `npm run build && npm run lint` sau mỗi task
5. Cập nhật checklist trong file plan + `00_TRACKING.md` khi hoàn thành
6. Gặp vấn đề → check `docs/micromouse_docs/` gốc

## Important Docs (đọc theo thứ tự khi implement module)

| Phase | Doc cần đọc |
|-------|-------------|
| 0-1 | 00, 02, 07 |
| 2-3 | 05 (CODE_SANDBOX), 06 (BLOCKLY_EDITOR) |
| 4 | 03 (PHYSICS_ENGINE) |
| 5 | 04 (SENSOR_SIMULATION) |
| 6-7 | 01 (ROBOT_CONFIG) |
| 8 | 08 (TELEMETRY) |
| 9 | Tất cả |