import type { RobotSpec } from '../types/robot';
import { useRobotConfigStore } from '../../modules/robot-config/store';
import { useMazeStore } from '../../modules/maze/store';
import { useCodeEditorStore } from '../../modules/code-editor/store';

interface ShareData {
  r: RobotSpec;
  m: {
    cells: number[][];
    rows: number;
    cols: number;
    start: [number, number];
    goal: [number, number];
  };
  c: string;
  w: string | null;
}

export function encodeShareState(): string {
  const { spec } = useRobotConfigStore.getState();
  const { mazeGrid } = useMazeStore.getState();
  const { pythonCode, workspaceXml } = useCodeEditorStore.getState();

  const data: ShareData = {
    r: spec,
    m: {
      cells: mazeGrid.cells,
      rows: mazeGrid.rows,
      cols: mazeGrid.cols,
      start: [mazeGrid.start.row, mazeGrid.start.col],
      goal: [mazeGrid.goal.row, mazeGrid.goal.col],
    },
    c: pythonCode,
    w: workspaceXml,
  };

  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeShareState(hash: string): ShareData | null {
  try {
    const json = decodeURIComponent(atob(hash));
    return JSON.parse(json) as ShareData;
  } catch {
    return null;
  }
}

export function getShareUrl(): string {
  const hash = encodeShareState();
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}

export function restoreFromHash(): boolean {
  const hash = window.location.hash.slice(1);
  if (!hash) return false;

  const data = decodeShareState(hash);
  if (!data) return false;

  const { m, r, c, w } = data;

  if (m) {
    const mazeStore = useMazeStore.getState();
    const snapshot = { ...mazeStore.mazeGrid, cells: mazeStore.mazeGrid.cells.map(row => [...row]) };
    useMazeStore.setState({
      mazeGrid: {
        rows: m.rows,
        cols: m.cols,
        cellSize: 180 as const,
        wallThickness: 12 as const,
        cells: m.cells,
        start: { row: m.start[0], col: m.start[1] },
        goal: { row: m.goal[0], col: m.goal[1] },
      },
      history: [...mazeStore.history, snapshot],
      future: [],
    });
  }

  if (r) {
    useRobotConfigStore.getState().loadPreset(r);
  }

  if (c) {
    useCodeEditorStore.getState().setPythonCode(c);
  }
  if (w) {
    useCodeEditorStore.getState().triggerImport(w);
  }

  window.history.replaceState(null, '', window.location.pathname);
  return true;
}
