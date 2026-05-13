# Session Brief

> Fill this before each coding session. Đây là file đầu tiên AI agent đọc để biết mục tiêu.

---

- **Date**: 2026-05-13
- **Current Phase**: Phase 8 — Telemetry & Replay
- **Phase Plan**: `plan/08_PHASE_8_TELEMETRY.md`
- **Current Tasks**: 8.1–8.10

## Last Session Recap

**Session 12 — Phase 7 hoàn tất + codebase refactoring.**

**What was done:**
- **Phase 7 hoàn tất**: Grid lines nét đứt (cả MazeRenderer + SimulationRenderer), fix thứ tự rendering (grid lines trên cùng), chỉnh parameters cho grid lines visible, bỏ perimeter grid lines.
- **Refactoring**: 
  - Shared color constants (`render-colors.ts`) — WALL_COLOR, FLOOR_COLOR, START_COLOR, GOAL_COLOR, GRID_LINE_COLOR
  - Shared `drawMazeMarkers` + `drawMazeGridLines` trong `maze-render.ts`
  - `cloneCells` move vào `shared/utils/maze.ts`
  - `downloadJson` + `readFileAsText` trong `shared/utils/export-import.ts`
  - Shared `NumberField` component (`shared/components/NumberField.tsx`)
  - Shared preset-storage utilities
  - Shared PixiJS init/resize/destroy utilities (`pixi-utils.ts`)
- **Wheel bounds**: Dynamic min/max theo công thức (posX phụ thuộc wheelWidth, posY phụ thuộc radius, v.v.)
- **Base width/height**: max = 168mm (passage thực tế)
- `build` ✅, `lint` ✅

**State hiện tại:**
- Phase 7 chính thức hoàn tất
- Phase 8 sẵn sàng

## Remaining

- Phase 8: Telemetry & Replay (tasks 8.1–8.10)
- Phase 9: Polish & Education

## Blockers

- None

## Notes

- MazeRenderer creates separate PixiJS canvas (not sharing with SimulationRenderer)
- Tab panels stay mounted (CSS visibility toggle) để preserve PixiJS context
