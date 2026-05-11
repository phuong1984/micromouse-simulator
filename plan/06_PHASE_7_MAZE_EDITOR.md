# Phase 7 — Maze Editor

> **Goal**: User tạo maze tùy ý: click toggle wall, set start/goal, undo/redo
> **Ước tính**: 8.5h
> **Input**: Phase 0 (types, utils), Phase 1 (renderer)
> **Output**: Maze editor hoạt động trong canvas

---

## Completed: ✅

- [ ] 7.1 — Canvas/Grid-based editor
- [ ] 7.2 — Right-click → set Start / Goal
- [ ] 7.3 — Undo/redo
- [ ] 7.4 — Preset selector
- [ ] 7.5 — BFS reachability validation
- [ ] 7.6 — Serialize/deserialize
- [ ] 7.7 — Editor disabled khi running

---

## Task Details

### 7.1 — Canvas Editor
**Deliverable**: Click cạnh giữa 2 cells → toggle wall; drag → vẽ liên tục  
**Ước tính**: 2h

- Overlay canvas trên PixiJS canvas
- Tính vị trí cạnh dựa trên mouse position + cellSize × scale
- Click: toggle wall bit (NORTH/SOUTH/EAST/WEST của cell tương ứng)
- Drag: liên tục toggle walls khi di chuột
- Visual: active wall = stroke đậm, inactive = stroke mờ dashed

**Hitbox**: padding 8px mỗi phía cạnh để dễ click

### 7.2 — Start/Goal Placement
**Deliverable**: Right-click cell → set Start hoặc Goal  
**Ước tính**: 1h

- Mode toggle: Wall mode / Start mode / Goal mode
- Right-click ô → set start/goal
- Visual: start = marker xanh, goal = marker đỏ

### 7.3 — Undo/Redo
**Deliverable**: Immer + stack snapshots  
**Ước tính**: 1h

```typescript
// Lưu snapshots của cells array (2D number[][])
history: number[][][] = [];
future: number[][][] = [];

function undo() {
  if (history.length === 0) return;
  future.push(currentCells);
  currentCells = history.pop()!;
  updateMaze();
}

function redo() {
  if (future.length === 0) return;
  history.push(currentCells);
  currentCells = future.pop()!;
  updateMaze();
}
```

### 7.4 — Preset Selector
**Deliverable**: Dropdown: 5×5, 8×8, 16×16, Empty  
**Ước tính**: 45p

```typescript
const MAZE_PRESETS = {
  '5×5 Simple': MAZE_5x5_SIMPLE,
  '8×8 Standard': MAZE_8x8_STANDARD,
  '16×16 Competition': MAZE_16x16_STANDARD,
  'Empty': createEmptyMaze(rows, cols),
};
```

### 7.5 — Reachability Validation
**Deliverable**: BFS check trước khi Run  
**Ước tính**: 1h

```typescript
function isReachable(grid: MazeGrid, start: CellPos, goal: CellPos): boolean {
  const visited = new Set<string>();
  const queue = [start];
  visited.add(`${start.row},${start.col}`);
  
  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    if (row === goal.row && col === goal.col) return true;
    
    // Check 4 directions
    for (const dir of [NORTH, EAST, SOUTH, WEST]) {
      if (!hasWall(grid, row, col, dir)) {
        const [nr, nc, _] = getNeighbor(row, col, dir);
        const key = `${nr},${nc}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ row: nr, col: nc });
        }
      }
    }
  }
  return false;
}
```

### 7.6 — Serialize/Deserialize
**Deliverable**: URL encoding cho share  
**Ước tính**: 45p

```typescript
function encodeMaze(grid: MazeGrid): string {
  const flat = grid.cells.flat();
  const hex = flat.map(v => v.toString(16)).join('');
  return `${grid.cols}x${grid.rows}x${grid.cellSize}_${hex}_${grid.start.row},${grid.start.col}_${grid.goal.row},${grid.goal.col}`;
}

function decodeMaze(encoded: string): MazeGrid { ... }
```

### 7.7 — Disabled Khi Running
**Deliverable**: Editor blocked khi `status === 'running' || status === 'paused'`  
**Ước tính**: 15p

---

## Acceptance Criteria

- [ ] Click cạnh → toggle wall
- [ ] Drag → vẽ liên tục
- [ ] Right-click → set start/goal
- [ ] Undo (Ctrl+Z) / Redo (Ctrl+Y) hoạt động
- [ ] Preset selector load đúng maze
- [ ] Chạy validation → thông báo nếu goal unreachable
- [ ] Serialize → URL update, load từ URL → maze đúng
- [ ] Editor disabled khi simulation running