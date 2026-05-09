# 02 — Maze System

## Mục tiêu module

Định nghĩa data model mê cung, cung cấp maze editor cho người dùng, và convert maze thành static physics bodies cho simulation engine.

---

## Data Model

### Chuẩn biểu diễn: Wall Bitmask

Mỗi ô trong lưới được biểu diễn bằng 4 bit tường (theo chuẩn competitive micromouse):

```
Bit 3 (8) = NORTH wall
Bit 2 (4) = EAST wall
Bit 1 (2) = SOUTH wall
Bit 0 (1) = WEST wall

Ví dụ: cell = 0b1001 = 9 → có tường NORTH và WEST
```

```typescript
// shared/types/maze.ts

export interface MazeGrid {
  cols: number;           // số cột (x)
  rows: number;           // số hàng (y)
  cellSize: number;       // mm — kích thước mỗi ô (thường 180mm theo chuẩn)
  wallThickness: number;  // mm — độ dày tường (thường 12mm)
  cells: number[][];      // cells[row][col] = bitmask 4-bit
  start: CellPos;         // vị trí xuất phát
  goal: CellPos;          // vị trí đích
}

export interface CellPos {
  row: number;
  col: number;
}

export const WALL = {
  NORTH: 0b1000, // 8
  EAST:  0b0100, // 4
  SOUTH: 0b0010, // 2
  WEST:  0b0001, // 1
} as const;
```

### Helper functions

```typescript
// shared/utils/maze.ts

export function hasWall(grid: MazeGrid, row: number, col: number, direction: number): boolean {
  return (grid.cells[row][col] & direction) !== 0;
}

export function setWall(grid: MazeGrid, row: number, col: number, direction: number): void {
  grid.cells[row][col] |= direction;
  // Cập nhật ô kề (tường shared giữa 2 ô)
  const [nr, nc, opposite] = getNeighbor(row, col, direction);
  if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
    grid.cells[nr][nc] |= opposite;
  }
}

export function removeWall(grid: MazeGrid, row: number, col: number, direction: number): void {
  grid.cells[row][col] &= ~direction;
  const [nr, nc, opposite] = getNeighbor(row, col, direction);
  if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
    grid.cells[nr][nc] &= ~opposite;
  }
}

function getNeighbor(row: number, col: number, dir: number): [number, number, number] {
  switch (dir) {
    case WALL.NORTH: return [row - 1, col, WALL.SOUTH];
    case WALL.SOUTH: return [row + 1, col, WALL.NORTH];
    case WALL.EAST:  return [row, col + 1, WALL.WEST];
    case WALL.WEST:  return [row, col - 1, WALL.EAST];
    default: return [-1, -1, 0];
  }
}

// Convert cell position → pixel coordinates (center of cell)
export function cellToWorld(grid: MazeGrid, row: number, col: number): { x: number; y: number } {
  return {
    x: col * grid.cellSize + grid.cellSize / 2,
    y: row * grid.cellSize + grid.cellSize / 2,
  };
}
```

---

## Preset Mazes

```typescript
// shared/constants/maze-presets.ts

// Maze 5×5 đơn giản để dạy học
export const MAZE_5x5_SIMPLE: MazeGrid = {
  cols: 5, rows: 5,
  cellSize: 180, wallThickness: 12,
  start: { row: 4, col: 0 },
  goal: { row: 0, col: 4 },
  cells: [
    [0b1101, 0b1100, 0b1101, 0b1100, 0b1110],
    [0b0101, 0b0011, 0b0110, 0b0011, 0b0110],
    [0b1001, 0b1110, 0b1001, 0b1100, 0b0110],
    [0b0101, 0b0010, 0b0111, 0b0010, 0b0110],
    [0b1001, 0b1010, 0b1010, 0b1010, 0b1010],
  ],
};

// Maze 16×16 theo chuẩn thi đấu
export const MAZE_16x16_STANDARD: MazeGrid = { ... };
```

---

## Maze Editor UI

### Interaction model

```
- Click vào cạnh giữa 2 ô → toggle tường
- Click+drag → vẽ tường liên tục
- Right-click ô → set làm Start / Goal
- Grid hiện bằng SVG hoặc Canvas 2D
- Toolbar: [New] [Load Preset ▾] [Clear] [Undo] [Redo]
```

### Rendering logic

```typescript
// modules/maze/MazeEditor.tsx

// Mỗi ô: vẽ 4 cạnh
// Cạnh active (có tường) → stroke dày, màu đậm
// Cạnh inactive (không tường) → stroke mờ, dashed (giúp user click đúng chỗ)
// Hitbox mỗi cạnh: padding 8px mỗi phía để dễ click

function drawCell(ctx: CanvasRenderingContext2D, grid: MazeGrid, row: number, col: number) {
  const x = col * grid.cellSize;
  const y = row * grid.cellSize;
  const s = grid.cellSize;
  const mask = grid.cells[row][col];

  // North wall
  if (mask & WALL.NORTH) drawWall(ctx, x, y, x + s, y, 'active');
  else drawWall(ctx, x, y, x + s, y, 'ghost');

  // East, South, West tương tự...
}
```

### Undo/Redo

Dùng immer + lưu stack snapshot của `MazeGrid.cells` (chỉ 2D array nhỏ, rất nhẹ).

---

## Serialization

```typescript
// Lưu maze thành string ngắn gọn để share URL
export function encodeMaze(grid: MazeGrid): string {
  const flat = grid.cells.flat();
  const hex = flat.map(v => v.toString(16)).join('');
  return `${grid.cols}x${grid.rows}x${grid.cellSize}_${hex}_${grid.start.row},${grid.start.col}_${grid.goal.row},${grid.goal.col}`;
}

export function decodeMaze(encoded: string): MazeGrid { ... }
```

---

## Convert Maze → Physics Bodies

Đây là bước quan trọng: từ `MazeGrid` tạo ra danh sách `WallSegment` cho physics engine.

```typescript
// modules/simulation/mazeToPhysics.ts

export interface WallSegment {
  x: number;      // center x (mm)
  y: number;      // center y (mm)
  width: number;  // mm
  height: number; // mm
  angle: number;  // radian (0 = horizontal, Math.PI/2 = vertical)
}

export function mazeToWallSegments(grid: MazeGrid): WallSegment[] {
  const segments: WallSegment[] = [];
  const { cellSize: s, wallThickness: t } = grid;

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const x0 = col * s;
      const y0 = row * s;
      const mask = grid.cells[row][col];

      // Chỉ vẽ NORTH và WEST để tránh duplicate (mỗi tường chia sẻ giữa 2 ô)
      // SOUTH của row 0 = không có ô kề → vẫn phải vẽ
      if (mask & WALL.NORTH) {
        segments.push({ x: x0 + s / 2, y: y0, width: s, height: t, angle: 0 });
      }
      if (mask & WALL.WEST) {
        segments.push({ x: x0, y: y0 + s / 2, width: t, height: s, angle: 0 });
      }
    }
  }

  // Thêm outer boundary walls
  addBoundaryWalls(segments, grid);

  return segments;
}
```

---

## Lưu ý

- `cellSize` mặc định 180mm (theo chuẩn Apec/IEEE micromouse)
- Tường shared giữa 2 ô: khi set/remove phải update cả 2 ô
- Maze editor cần validate: `goal` phải reachable từ `start` (dùng BFS check trước khi cho chạy sim)
- Outer boundary (tường bao ngoài) luôn tồn tại, không cho phép xóa
