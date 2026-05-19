import { MazeGrid, Wall, WALL } from '../types/maze';
import { WallSegment } from '../types/simulation';

export const hasWall = (grid: MazeGrid, row: number, col: number, direction: Wall): boolean => {
  return (grid.cells[row][col] & direction) !== 0;
};

export const setWall = (grid: MazeGrid, row: number, col: number, direction: Wall): void => {
  grid.cells[row][col] |= direction;
  
  // Update adjacent cell
  if (direction === WALL.NORTH && row > 0) {
    grid.cells[row - 1][col] |= WALL.SOUTH;
  } else if (direction === WALL.SOUTH && row < grid.rows - 1) {
    grid.cells[row + 1][col] |= WALL.NORTH;
  } else if (direction === WALL.EAST && col < grid.cols - 1) {
    grid.cells[row][col + 1] |= WALL.WEST;
  } else if (direction === WALL.WEST && col > 0) {
    grid.cells[row][col - 1] |= WALL.EAST;
  }
};

export const removeWall = (grid: MazeGrid, row: number, col: number, direction: Wall): void => {
  grid.cells[row][col] &= ~direction;
  
  // Update adjacent cell
  if (direction === WALL.NORTH && row > 0) {
    grid.cells[row - 1][col] &= ~WALL.SOUTH;
  } else if (direction === WALL.SOUTH && row < grid.rows - 1) {
    grid.cells[row + 1][col] &= ~WALL.NORTH;
  } else if (direction === WALL.EAST && col < grid.cols - 1) {
    grid.cells[row][col + 1] &= ~WALL.WEST;
  } else if (direction === WALL.WEST && col > 0) {
    grid.cells[row][col - 1] &= ~WALL.EAST;
  }
};

export const cellToWorld = (grid: MazeGrid, row: number, col: number): { x: number; y: number } => {
  const x = col * grid.cellSize + grid.cellSize / 2;
  const y = row * grid.cellSize + grid.cellSize / 2;
  return { x, y };
};

export const mazeToWallSegments = (grid: MazeGrid): WallSegment[] => {
  const segments: WallSegment[] = [];
  const halfCell = grid.cellSize / 2;
  const wallThickness = grid.wallThickness;
  
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const centerX = col * grid.cellSize + halfCell;
      const centerY = row * grid.cellSize + halfCell;
      
      // North wall
      if (hasWall(grid, row, col, WALL.NORTH)) {
        segments.push({
          x: centerX,
          y: centerY - halfCell,
          width: grid.cellSize,
          height: wallThickness,
          angle: 0,
        });
      }
      
      // West wall (only left boundary or if west wall exists)
      if (col === 0 || hasWall(grid, row, col, WALL.WEST)) {
        segments.push({
          x: centerX - halfCell,
          y: centerY,
          width: wallThickness,
          height: grid.cellSize,
          angle: 0,
        });
      }
    }
  }
  
  // North boundary
  for (let col = 0; col < grid.cols; col++) {
    const centerX = col * grid.cellSize + halfCell;
    const centerY = wallThickness / 2;
    segments.push({
      x: centerX,
      y: centerY,
      width: grid.cellSize,
      height: wallThickness,
      angle: 0,
    });
  }
  
  // South boundary
  for (let col = 0; col < grid.cols; col++) {
    const centerX = col * grid.cellSize + halfCell;
    const centerY = grid.rows * grid.cellSize - wallThickness / 2;
    segments.push({
      x: centerX,
      y: centerY,
      width: grid.cellSize,
      height: wallThickness,
      angle: 0,
    });
  }
  
  // East boundary
  for (let row = 0; row < grid.rows; row++) {
    const centerX = grid.cols * grid.cellSize - wallThickness / 2;
    const centerY = row * grid.cellSize + halfCell;
    segments.push({
      x: centerX,
      y: centerY,
      width: wallThickness,
      height: grid.cellSize,
      angle: 0,
    });
  }
  
  return segments;
};

export function clearInternalWalls2x2(grid: MazeGrid, row: number, col: number): void {
  if (row < 0 || row >= grid.rows - 1 || col < 0 || col >= grid.cols - 1) return;
  // Remove walls between (r, c) and (r, c+1)
  removeWall(grid, row, col, WALL.EAST);
  // Remove walls between (r+1, c) and (r+1, c+1)
  removeWall(grid, row + 1, col, WALL.EAST);
  // Remove walls between (r, c) and (r+1, c)
  removeWall(grid, row, col, WALL.SOUTH);
  // Remove walls between (r, c+1) and (r+1, c+1)
  removeWall(grid, row, col + 1, WALL.SOUTH);
}

export function cloneCells(cells: number[][]): number[][] {
  return cells.map(r => [...r]);
}

/**
 * Flood-fill distance from goal. BFS from goal cell, each open neighbor = distance + 1.
 * Returns a 2D array where cells[row][col] = distance, -1 if unreachable.
 */
export function floodFillDistances(
  grid: MazeGrid,
  goal: { row: number; col: number }
): number[][] {
  const dist: number[][] = Array.from({ length: grid.rows }, () => Array(grid.cols).fill(-1));
  const queue: { row: number; col: number }[] = [];
  
  const isCenter2x2 = grid.goalType === 'center2x2';
  const goalCells = isCenter2x2
    ? [
        { row: goal.row, col: goal.col },
        { row: goal.row, col: goal.col + 1 },
        { row: goal.row + 1, col: goal.col },
        { row: goal.row + 1, col: goal.col + 1 },
      ]
    : [{ row: goal.row, col: goal.col }];

  goalCells.forEach(cell => {
    if (cell.row >= 0 && cell.row < grid.rows && cell.col >= 0 && cell.col < grid.cols) {
      dist[cell.row][cell.col] = 0;
      queue.push(cell);
    }
  });

  const dirs = [
    { dr: -1, dc: 0, wall: WALL.NORTH },
    { dr: 1, dc: 0, wall: WALL.SOUTH },
    { dr: 0, dc: 1, wall: WALL.EAST },
    { dr: 0, dc: -1, wall: WALL.WEST },
  ];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const nd = dist[cur.row][cur.col] + 1;
    for (const d of dirs) {
      const nr = cur.row + d.dr;
      const nc = cur.col + d.dc;
      if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols && dist[nr][nc] === -1 && !hasWall(grid, cur.row, cur.col, d.wall)) {
        dist[nr][nc] = nd;
        queue.push({ row: nr, col: nc });
      }
    }
  }
  return dist;
}

export function isReachable(
  grid: MazeGrid,
  start: { row: number; col: number },
  goal: { row: number; col: number }
): { reachable: boolean; steps: number } {
  if (start.row === goal.row && start.col === goal.col)
    return { reachable: true, steps: 0 };

  const visited: boolean[][] = Array.from({ length: grid.rows }, () => Array(grid.cols).fill(false));
  const queue: { row: number; col: number; dist: number }[] = [];

  visited[start.row][start.col] = true;
  queue.push({ row: start.row, col: start.col, dist: 0 });

  const dirs = [
    { dr: -1, dc: 0, wall: WALL.NORTH },
    { dr: 1, dc: 0, wall: WALL.SOUTH },
    { dr: 0, dc: 1, wall: WALL.EAST },
    { dr: 0, dc: -1, wall: WALL.WEST },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const d of dirs) {
      const nr = cur.row + d.dr;
      const nc = cur.col + d.dc;
      if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols && !visited[nr][nc] && !hasWall(grid, cur.row, cur.col, d.wall)) {
        if (nr === goal.row && nc === goal.col)
          return { reachable: true, steps: cur.dist + 1 };
        visited[nr][nc] = true;
        queue.push({ row: nr, col: nc, dist: cur.dist + 1 });
      }
    }
  }

  return { reachable: false, steps: -1 };
}
