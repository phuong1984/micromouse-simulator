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
  
  // South boundary
  for (let col = 0; col < grid.cols; col++) {
    const centerX = col * grid.cellSize + halfCell;
    const centerY = (grid.rows - 0.5) * grid.cellSize;
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
    const centerX = (grid.cols - 0.5) * grid.cellSize;
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
