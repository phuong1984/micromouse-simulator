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

## Current Status — Phase 0

Source code DELETED clean. New structure created:
```
src/app/         → App.tsx, App.css
src/modules/     → 6 module folders with index.ts
src/shared/      → types, constants, utils (index.ts)
src/workers/     → simulation.worker.ts
```
Config files ready: tailwind.config.ts, postcss.config.js, vite.config.ts, src/index.css, package.json (updated).

## Key Types

```
Wall: N(8) E(4) S(2) W(1) bitmask
MazeGrid: rows, cols, cellSize(180), wallThickness(12), cells[row][col], start, goal
RobotSpec: base{width,height,mass,shape}, motors[], wheels[], sensors[]
SimState: tick, robot{x,y,angle,vx,vy,av}, sensors{}, motorRPMs{}, isFinished, elapsedMs
WallSegment: x, y, width, height, angle (mm)
```

## Next Task

**Phase 0 — Setup & Infrastructure** → See `plan/01_PHASE_0_SETUP.md`