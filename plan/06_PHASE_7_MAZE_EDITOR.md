# Phase 7 — Maze Editor

> **Goal**: User tạo maze tùy ý: click toggle wall, set start/goal, undo/redo, auto-generate, export/import
> **Ước tính**: 11.5h
> **Input**: Phase 0 (types, utils), Phase 1 (renderer)
> **Output**: Maze editor tab với PixiJS canvas interactive + config panel

---

## Completed: ✅

- [x] 7.1 — generate.ts: auto maze generation (randomized DFS + difficulty easy/medium/hard)
- [x] 7.2 — maze-presets.ts: added MAZE_8x8_STANDARD
- [x] 7.3 — maze.ts utils: added isReachable() BFS
- [x] 7.4 — store.ts: Zustand store (CRUD, history/future, save/load presets, export/import JSON)
- [x] 7.5 — MazeRenderer.ts: PixiJS interactive canvas (draw, hover, click toggle/set)
- [x] 7.6 — MazeConfigPanel.tsx: left column form
- [x] 7.7 — MazeEditor.tsx + index.ts: container + re-exports
- [x] 7.8 — App.tsx + App.css: thêm tab Maze Editor giữa Config và Simulation
- [x] 7.9 — simulation/store.ts: đọc maze từ maze store
- [x] 7.10 — build + lint verify

## Polish (đã hoàn)

- [x] Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo) — `MazeEditor.tsx:52-66`
- [x] Drag to toggle multiple walls consecutively — `MazeRenderer.ts:278-284`
- [x] ResizeObserver cho PixiJS canvas — `MazeEditor.tsx` thay window resize event

## Refactoring (đã hoàn)

- [x] Shared color constants `render-colors.ts` (WALL_COLOR, FLOOR_COLOR, START_COLOR, GOAL_COLOR, GRID_LINE_COLOR)
- [x] `cloneCells()` moved to `shared/utils/maze.ts`
- [x] `downloadJson` + `readFileAsText` trong `shared/utils/export-import.ts`
- [x] Shared `NumberField` component (`shared/components/NumberField.tsx`) — unified parseFloat/integer, optional min/max
- [x] Shared `drawMazeMarkers()` trong `maze-render.ts` — alpha/circleSize options
- [x] Shared preset-storage utilities (`shared/utils/preset-storage.ts`)
- [x] Shared PixiJS init/resize/destroy (`shared/utils/pixi-utils.ts`)
- [x] Dynamic wheel bounds (posX ±(baseWidth-wheelWidth)/2, posY ±(baseHeight/2-radius), max radius/width phụ thuộc vị trí)
- [x] Base width/height max 168mm
- [x] Grid lines: dashed, batch rendering, on top of walls, skip perimeter (`drawMazeGridLines`)
- [x] Simulation markers draw order: walls → markers → grid lines

## Phase 7 HOÀN TẤT ✅

---

## Module Structure

```
src/modules/maze/
├── index.ts              # Re-exports
├── store.ts              # Zustand: mazeGrid, savedPresets, history/future, editMode, CRUD
├── MazeEditor.tsx        # Container: left panel + right canvas
├── MazeRenderer.ts       # PixiJS interactive canvas class
├── MazeConfigPanel.tsx   # Left column form
└── generate.ts           # generateMaze() — randomized DFS + difficulty
```

## Maze Config Options

| Field | Type | Min | Max | Default | Ghi chú |
|-------|------|:---:|:---:|:-------:|---------|
| rows | number | 3 | 20 | 5 | Số hàng |
| cols | number | 3 | 20 | 5 | Số cột |
| cellSize | fixed | — | — | 180mm | Chuẩn IEEE |
| wallThickness | fixed | — | — | 12mm | |

## Edit Modes

| Mode | Hành động | Visual |
|------|-----------|--------|
| Wall (default) | Click cạnh → toggle wall | Hover highlight blue |
| Start | Click cell → set start | Green fill + circle |
| Goal | Click cell → set goal | Red fill + circle |

## Auto-Generation Algorithm

- Seeded PRNG (LCG) for deterministic output
- Randomized DFS (recursive backtracker) → perfect maze
- Easy: remove 30% inner walls → wider passages
- Medium: keep perfect maze
- Hard: add 20% dead-end walls → more complex

## Presets

- 9 generated presets: 5×5 / 8×8 / 16×16 × Easy / Medium / Hard
- User saved presets in localStorage (key: 'maze-presets')
- Default button resets to empty 5×5
