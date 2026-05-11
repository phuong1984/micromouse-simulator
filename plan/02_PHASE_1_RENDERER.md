# Phase 1 — Static Renderer

> **Goal**: Hiển thị maze + robot tĩnh trên PixiJS canvas. Không physics, không code.
> **Ước tính**: 8h
> **Input**: Phase 0 hoàn thành (types, presets, utils)
> **Output**: Maze 5×5 + robot xanh hiển thị đúng trên canvas, auto-scale

---

## Completed: ✅

- [x] 1.1 — Implement SimulationRenderer class
- [x] 1.2 — Draw maze walls + start/goal markers
- [x] 1.3 — Draw robot body + direction arrow
- [x] 1.4 — Auto-scale computeScale()
- [x] 1.5 — Basic App layout (3-column)
- [x] 1.6 — React component integration
- [x] 1.7 — Window resize handling

---

## Task Details

### 1.1 — SimulationRenderer Class
**Deliverable**: `modules/renderer/SimulationRenderer.ts` — PixiJS init, 3-layer scene graph  
**Ước tính**: 2h

Scene Graph:
```
PixiJS Stage
├── mazeLayer (Graphics)      — static walls, start/goal markers
│   ├── wallGraphics
│   ├── startMarker
│   └── goalMarker
├── robotLayer (Container)    — update mỗi frame
│   ├── bodyGraphic
│   ├── sensorRays
│   └── directionArrow
└── overlayLayer (Container)  — HUD
    ├── pathTrail
    └── cellLabels
```

API (actual — deviated from plan):
```typescript
class SimulationRenderer {
  async init(container: HTMLElement): Promise<void>   // ← container, not canvas (PixiJS creates own canvas)
  loadMaze(grid: MazeGrid): void
  updateFrame(state: SimState, robotSpec: RobotSpec, options: RenderOptions): void
  reset(): void
  destroy(): void
}

interface RenderOptions {
  showSensorRays: boolean;
  showPathTrail: boolean;
  showCellNumbers: boolean;
}
```

Key decisions:
- `backgroundAlpha: 0` để background trong suốt (CSS body sẽ đặt màu)
- `resolution: window.devicePixelRatio` cho HiDPI/Retina
- `resizeTo` KHÔNG dùng (tránh ResizePlugin bug) → manual resize qua `resize()`
- PixiJS tự tạo canvas (`await app.init()` không có `view` option), append vào container
- `destroy(true, ...)` để PixiJS tự remove canvas khỏi DOM

### 1.2 — Draw Maze
**Deliverable**: Walls render đúng, start (green), goal (red)  
**Ước tính**: 1.5h

Algorithm:
- Mỗi cell có 4 walls, check bitmask `cells[row][col]`
- Chỉ vẽ NORTH + WEST walls cho mỗi cell (avoid duplicate)
- Exception: row 0 SOUTH walls, col 0 EAST walls, row max NORTH walls, col max WEST walls
- Thêm outer boundary walls (top row NORTH, right col EAST, bottom row SOUTH, left col WEST)

Visual:
- Wall: fill rectangle `maze-wall` color (`#2d2d2d`), thickness = `wallThickness * scale`
- Floor: fill background `maze-floor` color (`#f5f5f0`)
- Start marker: green semi-transparent square
- Goal marker: red semi-transparent square

### 1.3 — Draw Robot
**Deliverable**: Blue rectangle + white direction arrow  
**Ước tính**: 1h

- Robot body: rectangle `robot-body` color (`#1976d2`), centered, đúng tỉ lệ mm × scale
- Direction arrow: white line từ center lên phía trước robot (heading direction)
- Container rotation = robot angle (radians)

### 1.4 — Auto-scale
**Deliverable**: Maze luôn vừa viewport  
**Ước tính**: 45p

```typescript
private computeScale(grid: MazeGrid): number {
  const maxW = this.app.screen.width * 0.9;
  const maxH = this.app.screen.height * 0.9;
  const mazeW = grid.cols * grid.cellSize;
  const mazeH = grid.rows * grid.cellSize;
  return Math.min(maxW / mazeW, maxH / mazeH);
}
```

### 1.5 — App Layout
**Deliverable**: 3-column layout: [Config] [Canvas] [Code]  
**Ước tính**: 1.5h

HTML structure:
```html
<div class="flex h-screen bg-gray-900">
  <!-- Left: Config Panel -->
  <aside class="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
    <!-- Robot Config, Maze Controls -->
  </aside>

  <!-- Center: Canvas -->
  <main class="flex-1 flex items-center justify-center">
    <div id="pixi-container" class="relative">
      <canvas ref={canvasRef}></canvas>
    </div>
  </main>

  <!-- Right: Code Panel -->
  <aside class="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
    <!-- Blockly / Monaco tabs -->
  </aside>
</div>
```

### 1.6 — React Integration
**Deliverable**: `app/App.tsx` + `SimulationView.tsx`  
**Ước tính**: 1h

- `App.tsx`: Layout shell, state management wiring
- `SimulationView.tsx`: Canvas ref, init PixiJS, handle mount/unmount lifecycle

```tsx
useEffect(() => {
  const renderer = new SimulationRenderer();
  renderer.init(canvasRef.current!);
  renderer.loadMaze(MAZE_5x5_SIMPLE);
  
  // Placeholder robot at start position
  renderer.updateFrame(initialState, DEFAULT_ROBOT, {
    showSensorRays: true,
    showPathTrail: true,
    showCellNumbers: false,
  });
  
  return () => renderer.destroy();
}, []);
```

### 1.7 — Window Resize
**Deliverable**: Recalculate scale + redraw on resize  
**Ước tính**: 30p

```typescript
window.addEventListener('resize', () => {
  renderer.resize();
  // Recalculate scale, redraw maze
});
```

---

## Acceptance Criteria

- [x] `npm run dev` → mê cung 5×5 hiển thị trên canvas
- [x] Robot (hình chữ nhật xanh) ở vị trí start, mũi tên hướng lên
- [x] Goal marker (đỏ) ở góc đối diện
- [x] Maze centered, auto-scale, không bị cutoff
- [x] Resize window → scale và redraw đúng
- [x] 3-column layout ổn định
- [x] PixiJS performance 60fps (không lag khi resize)

---

## Deviations from Plan

| Plan | Actual | Reason |
|------|--------|--------|
| `init(canvas: HTMLCanvasElement)` | `init(container: HTMLElement)` | PixiJS v8 deprecated constructor options → `await app.init({...})` không có `view` option. PixiJS tự tạo canvas, mỗi lần init là canvas riêng → tránh WebGL context conflict khi StrictMode double-mount |
| `resizeTo` option | Manual `resize()` | PixiJS v8 ResizePlugin bug: `_cancelResize` undefined khi destroy → crash. Manual resize bypasses plugin entirely |
| `app.destroy(true, ...)` | `app.destroy(false, ...)` khi cleanup early-return trong init | React StrictMode cleanup không được remove canvas khỏi DOM (React quản lý lifecycle của container) |
| `SimulationView.tsx` riêng | Mọi logic trong `App.tsx` | Đơn giản, chưa cần tách component vì Phase 1 chỉ có 1 view |