import { MazeGrid } from '../types/maze';

const createEmptyCells = (rows: number, cols: number): number[][] => {
  return Array(rows).fill(null).map(() => Array(cols).fill(0));
};

export const MAZE_5x5_SIMPLE: MazeGrid = {
  rows: 5,
  cols: 5,
  cellSize: 180,
  wallThickness: 12,
  cells: createEmptyCells(5, 5),
  start: { row: 4, col: 0 },
  goal: { row: 0, col: 4 },
};

export const MAZE_16x16_STANDARD: MazeGrid = {
  rows: 16,
  cols: 16,
  cellSize: 180,
  wallThickness: 12,
  cells: createEmptyCells(16, 16),
  start: { row: 15, col: 0 },
  goal: { row: 0, col: 15 },
};
