export const WALL = {
  NORTH: 8,
  EAST: 4,
  SOUTH: 2,
  WEST: 1,
} as const;

export type Wall = 8 | 4 | 2 | 1;

export interface CellPos {
  row: number;
  col: number;
}

export interface MazeGrid {
  rows: number;
  cols: number;
  cellSize: 180;
  wallThickness: 12;
  cells: number[][];
  start: CellPos;
  goal: CellPos;
  goalType?: 'manual' | 'center2x2';
}
