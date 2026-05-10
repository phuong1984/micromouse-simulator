# Project Summary — Quick Reference

> For AI agents and developers starting a session. Read AGENTS.md for full context.

---

## What We're Building

**Micromouse Simulator** — Web app for education: configure robot, design maze, write Python code (Blockly or Monaco), run simulation.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + TypeScript + Vite | |
| Styling | Tailwind CSS | Dark theme |
| Physics | Matter.js | Web Worker |
| Rendering | PixiJS v8 | WebGL, 60fps |
| Block Editor | Google Blockly | → Python code |
| Code Editor | Monaco Editor | Python syntax |
| Python Runtime | MicroPython WASM | ~500KB, in Worker |
| State | Zustand | Lightweight |
| Units | **mm / gram** | Renderer scales to px |

## Current Status — Phase 2 (Blockly + Python Codegen)

**✅ Phase 0 hoàn tất**: Project infrastructure, types, presets, utils.
**✅ Phase 1 hoàn tất**: Static renderer (PixiJS) — maze 5×5 + robot hiển thị, auto-scale, resize.
**⬜ Phase 2 đang làm**: Blockly workspace + custom robot blocks + Python code generator.

## Project Structure (source code hiện tại)

```
src/
├── app/                  → App.tsx, App.css (3-column layout)
├── modules/
│   ├── renderer/         → SimulationRenderer.ts (PixiJS v8, 3-layer, auto-scale)
│   ├── code-editor/      → [đang xây dựng — Phase 2]
│   ├── simulation/       → [chưa có — Phase 4]
│   ├── robot-config/     → [chưa có — Phase 6]
│   ├── maze/             → [chưa có — Phase 7]
│   └── telemetry/        → [chưa có — Phase 8]
├── shared/
│   ├── types/            → maze.ts, robot.ts, simulation.ts, workerMessages.ts, telemetry.ts
│   ├── constants/        → robot-presets.ts, maze-presets.ts
│   └── utils/            → maze.ts
└── workers/              → simulation.worker.ts (placeholder)
```

## Key Types

```
Wall: N(8) E(4) S(2) W(1) bitmask
MazeGrid: rows, cols, cellSize(180), wallThickness(12), cells[row][col], start, goal
RobotSpec: base{width,height,mass,shape}, motors[], wheels[], sensors[]
SimState: tick, robot{x,y,angle,vx,vy,av}, sensors{}, motorRPMs{}, isFinished, elapsedMs
WallSegment: x, y, width, height, angle (mm)
WorkerMessages: MainToWorker (START/STOP/STEP/RESET), WorkerToMain (STATE_UPDATE/FINISHED/ERROR)
RenderOptions: showSensorRays, showPathTrail, showCellNumbers
```

## Next Task

**Phase 2 — Blockly + Python Codegen** → See `plan/03_PHASE_2_BLOCKLY.md`

Tasks: 2.1 Blockly workspace → 2.2 Robot blocks → 2.3 Toolbox → 2.4 Python generator → 2.5 Monaco → 2.6 Store → 2.7 Sync → 2.8 Verify