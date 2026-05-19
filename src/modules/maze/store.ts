import { create } from 'zustand';
import type { MazeGrid, Wall } from '../../shared/types/maze';
import { WALL } from '../../shared/types/maze';
import { setWall, removeWall, isReachable, cloneCells, clearInternalWalls2x2 } from '../../shared/utils/maze';
import { loadSavedPresets, persistPresets } from '../../shared/utils/preset-storage';
import { generateMaze } from './generate';

export interface SavedMazePreset {
  id: string;
  name: string;
  maze: MazeGrid;
}

const MAZE_STORAGE_KEY = 'maze-presets';

function createEmptyMaze(rows: number, cols: number): MazeGrid {
  const cells: number[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = 0;
      if (r === 0) cells[r][c] |= WALL.NORTH;
      if (r === rows - 1) cells[r][c] |= WALL.SOUTH;
      if (c === 0) cells[r][c] |= WALL.WEST;
      if (c === cols - 1) cells[r][c] |= WALL.EAST;
    }
  }
  return {
    rows,
    cols,
    cellSize: 180 as const,
    wallThickness: 12 as const,
    cells,
    start: { row: rows - 1, col: 0 },
    goal: { row: 0, col: cols - 1 },
    goalType: 'manual',
  };
}

export const DEFAULT_MAZE = createEmptyMaze(5, 5);

export interface MazeStore {
  mazeGrid: MazeGrid;
  savedPresets: SavedMazePreset[];
  editMode: 'wall' | 'start' | 'goal';
  history: MazeGrid[];
  future: MazeGrid[];

  setRows: (n: number) => void;
  setCols: (n: number) => void;
  toggleWall: (row: number, col: number, direction: Wall) => void;
  setStart: (row: number, col: number) => void;
  setGoal: (row: number, col: number) => void;
  setGoalType: (type: 'manual' | 'center2x2') => void;
  setEditMode: (mode: 'wall' | 'start' | 'goal') => void;
  undo: () => void;
  redo: () => void;
  loadPreset: (preset: MazeGrid) => void;
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
  generateMaze: (difficulty: 'easy' | 'medium' | 'hard') => void;
  exportMaze: () => string;
  importMaze: (json: string) => boolean;
  resetToDefault: () => void;
  reachable: () => { reachable: boolean; steps: number };
}

export const useMazeStore = create<MazeStore>((set, get) => ({
  mazeGrid: { ...DEFAULT_MAZE, cells: cloneCells(DEFAULT_MAZE.cells) },
  savedPresets: loadSavedPresets<SavedMazePreset>(MAZE_STORAGE_KEY),
  editMode: 'wall',
  history: [],
  future: [],

  setRows: (n) => {
    const state = get();
    const snapshot = { ...state.mazeGrid, cells: cloneCells(state.mazeGrid.cells) };
    const newGrid = createEmptyMaze(n, state.mazeGrid.cols);

    // Maintain goalType if valid
    const canBeCenter = (n % 2 === 0) && (state.mazeGrid.cols % 2 === 0) && (n >= 16) && (state.mazeGrid.cols >= 16);
    if (state.mazeGrid.goalType === 'center2x2' && canBeCenter) {
      newGrid.goalType = 'center2x2';
      newGrid.goal = { row: n / 2 - 1, col: state.mazeGrid.cols / 2 - 1 };
      clearInternalWalls2x2(newGrid, newGrid.goal.row, newGrid.goal.col);
    }

    set({
      mazeGrid: newGrid,
      history: [...state.history, snapshot],
      future: [],
    });
  },

  setCols: (n) => {
    const state = get();
    const snapshot = { ...state.mazeGrid, cells: cloneCells(state.mazeGrid.cells) };
    const newGrid = createEmptyMaze(state.mazeGrid.rows, n);

    // Maintain goalType if valid
    const canBeCenter = (state.mazeGrid.rows % 2 === 0) && (n % 2 === 0) && (state.mazeGrid.rows >= 16) && (n >= 16);
    if (state.mazeGrid.goalType === 'center2x2' && canBeCenter) {
      newGrid.goalType = 'center2x2';
      newGrid.goal = { row: state.mazeGrid.rows / 2 - 1, col: n / 2 - 1 };
      clearInternalWalls2x2(newGrid, newGrid.goal.row, newGrid.goal.col);
    }

    set({
      mazeGrid: newGrid,
      history: [...state.history, snapshot],
      future: [],
    });
  },

  toggleWall: (row, col, direction) => {
    const state = get();
    const { mazeGrid } = state;

    // Boundary checks
    if (
      (direction === WALL.NORTH && row === 0) ||
      (direction === WALL.SOUTH && row === mazeGrid.rows - 1) ||
      (direction === WALL.WEST && col === 0) ||
      (direction === WALL.EAST && col === mazeGrid.cols - 1)
    ) return;

    // Prevent internal walls in 2x2 Goal
    if (mazeGrid.goalType === 'center2x2') {
      const gr = mazeGrid.goal.row;
      const gc = mazeGrid.goal.col;
      const isInternal =
        (direction === WALL.EAST && col === gc && (row === gr || row === gr + 1)) ||
        (direction === WALL.WEST && col === gc + 1 && (row === gr || row === gr + 1)) ||
        (direction === WALL.SOUTH && row === gr && (col === gc || col === gc + 1)) ||
        (direction === WALL.NORTH && row === gr + 1 && (col === gc || col === gc + 1));

      if (isInternal) return;
    }

    const snapshot = { ...mazeGrid, cells: cloneCells(mazeGrid.cells) };
    const newCells = cloneCells(mazeGrid.cells);
    const tempGrid = { ...mazeGrid, cells: newCells };

    if (newCells[row][col] & direction) {
      removeWall(tempGrid, row, col, direction);
    } else {
      setWall(tempGrid, row, col, direction);
    }

    set({
      mazeGrid: { ...mazeGrid, cells: newCells },
      history: [...state.history, snapshot],
      future: [],
    });
  },

  setStart: (row, col) => {
    const state = get();
    const { mazeGrid } = state;
    const snapshot = { ...mazeGrid, cells: cloneCells(mazeGrid.cells) };
    set({
      mazeGrid: { ...mazeGrid, start: { row, col } },
      history: [...state.history, snapshot],
      future: [],
    });
  },

  setGoal: (row, col) => {
    const state = get();
    const { mazeGrid } = state;
    if (mazeGrid.goalType === 'center2x2') return;

    const snapshot = { ...mazeGrid, cells: cloneCells(mazeGrid.cells) };
    set({
      mazeGrid: { ...mazeGrid, goal: { row, col } },
      history: [...state.history, snapshot],
      future: [],
    });
  },

  setGoalType: (type) => {
    const state = get();
    const { mazeGrid } = state;
    const snapshot = { ...mazeGrid, cells: cloneCells(mazeGrid.cells) };

    const canBeCenter = (mazeGrid.rows % 2 === 0) && (mazeGrid.cols % 2 === 0) && (mazeGrid.rows >= 16) && (mazeGrid.cols >= 16);
    const finalType = (type === 'center2x2' && canBeCenter) ? 'center2x2' : 'manual';

    const newCells = cloneCells(mazeGrid.cells);
    const newGrid: MazeGrid = { 
      ...mazeGrid, 
      cells: newCells, 
      goalType: finalType as 'manual' | 'center2x2' 
    };

    if (finalType === 'center2x2') {
      newGrid.goal = { row: mazeGrid.rows / 2 - 1, col: mazeGrid.cols / 2 - 1 };
      clearInternalWalls2x2(newGrid, newGrid.goal.row, newGrid.goal.col);
    }

    set({
      mazeGrid: newGrid,
      history: [...state.history, snapshot],
      future: [],
      editMode: finalType === 'center2x2' ? 'wall' : state.editMode,
    });
  },

  setEditMode: (mode) => set({ editMode: mode }),

  undo: () => {
    const { history, mazeGrid, future } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      mazeGrid: prev,
      history: history.slice(0, -1),
      future: [{ ...mazeGrid, cells: cloneCells(mazeGrid.cells) }, ...future],
    });
  },

  redo: () => {
    const { history, mazeGrid, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      mazeGrid: next,
      history: [...history, { ...mazeGrid, cells: cloneCells(mazeGrid.cells) }],
      future: future.slice(1),
    });
  },

  loadPreset: (preset) => {
    const state = get();
    const snapshot = { ...state.mazeGrid, cells: cloneCells(state.mazeGrid.cells) };
    set({
      mazeGrid: { ...preset, cells: cloneCells(preset.cells) },
      history: [...state.history, snapshot],
      future: [],
    });
  },

  savePreset: (name) => {
    const { mazeGrid, savedPresets } = get();
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const entry: SavedMazePreset = { id, name, maze: { ...mazeGrid, cells: cloneCells(mazeGrid.cells) } };
    const updated = [...savedPresets.filter(p => p.id !== id), entry];
    persistPresets(MAZE_STORAGE_KEY, updated);
    set({ savedPresets: updated });
  },

  deletePreset: (id) => {
    const { savedPresets } = get();
    const updated = savedPresets.filter(p => p.id !== id);
    persistPresets(MAZE_STORAGE_KEY, updated);
    set({ savedPresets: updated });
  },

  generateMaze: (difficulty) => {
    const state = get();
    const snapshot = { ...state.mazeGrid, cells: cloneCells(state.mazeGrid.cells) };
    const newGrid = generateMaze(state.mazeGrid.rows, state.mazeGrid.cols, difficulty, 0, state.mazeGrid);
    set({
      mazeGrid: newGrid,
      history: [...state.history, snapshot],
      future: [],
    });
  },

  exportMaze: () => {
    const { mazeGrid } = get();
    return JSON.stringify(mazeGrid);
  },

  importMaze: (json) => {
    try {
      const parsed = JSON.parse(json) as MazeGrid;
      if (!parsed.rows || !parsed.cols || !parsed.cells || !Array.isArray(parsed.cells))
        return false;
      const state = get();
      const snapshot = { ...state.mazeGrid, cells: cloneCells(state.mazeGrid.cells) };
      set({
        mazeGrid: parsed,
        history: [...state.history, snapshot],
        future: [],
      });
      return true;
    } catch {
      return false;
    }
  },

  resetToDefault: () => {
    const state = get();
    const snapshot = { ...state.mazeGrid, cells: cloneCells(state.mazeGrid.cells) };
    set({
      mazeGrid: { ...DEFAULT_MAZE, cells: cloneCells(DEFAULT_MAZE.cells) },
      history: [...state.history, snapshot],
      future: [],
    });
  },

  reachable: () => {
    const { mazeGrid } = get();
    if (mazeGrid.goalType === 'center2x2') {
      const g = mazeGrid.goal;
      const results = [
        isReachable(mazeGrid, mazeGrid.start, { row: g.row, col: g.col }),
        isReachable(mazeGrid, mazeGrid.start, { row: g.row, col: g.col + 1 }),
        isReachable(mazeGrid, mazeGrid.start, { row: g.row + 1, col: g.col }),
        isReachable(mazeGrid, mazeGrid.start, { row: g.row + 1, col: g.col + 1 }),
      ];
      const reachableOnes = results.filter(r => r.reachable);
      if (reachableOnes.length === 0) return { reachable: false, steps: -1 };
      return { 
        reachable: true, 
        steps: Math.min(...reachableOnes.map(r => r.steps)) 
      };
    }
    return isReachable(mazeGrid, mazeGrid.start, mazeGrid.goal);
  },
}));
