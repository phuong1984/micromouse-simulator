import { MazeGrid, WALL } from '../../shared/types/maze';

const DIRS = [
  { dr: -1, dc: 0, wall: WALL.NORTH, opp: WALL.SOUTH },
  { dr: 1, dc: 0, wall: WALL.SOUTH, opp: WALL.NORTH },
  { dr: 0, dc: 1, wall: WALL.EAST, opp: WALL.WEST },
  { dr: 0, dc: -1, wall: WALL.WEST, opp: WALL.EAST },
];

function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function findPathCells(
  cells: number[][],
  rows: number,
  cols: number,
  startRow: number,
  startCol: number,
  goalRow: number,
  goalCol: number,
): boolean[][] {
  const onPath: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const prev: ({ r: number; c: number } | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const queue: { r: number; c: number }[] = [{ r: startRow, c: startCol }];
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  visited[startRow][startCol] = true;
  let qi = 0;

  while (qi < queue.length) {
    const cur = queue[qi++];
    if (cur.r === goalRow && cur.c === goalCol) {
      let p: { r: number; c: number } | null = cur;
      while (p) {
        onPath[p.r][p.c] = true;
        p = prev[p.r][p.c];
      }
      return onPath;
    }
    for (const d of DIRS) {
      const nr = cur.r + d.dr;
      const nc = cur.c + d.dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && !(cells[cur.r][cur.c] & d.wall)) {
        visited[nr][nc] = true;
        prev[nr][nc] = { r: cur.r, c: cur.c };
        queue.push({ r: nr, c: nc });
      }
    }
  }

  return onPath;
}

export function generateMaze(
  rows: number,
  cols: number,
  difficulty: 'easy' | 'medium' | 'hard',
  attempt = 0
): MazeGrid {
  const diffIdx = ['easy', 'medium', 'hard'].indexOf(difficulty);
  const rng = createRng(rows * 1000 + cols * 10 + diffIdx + attempt * 7919);

  const cells: number[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = WALL.NORTH | WALL.EAST | WALL.SOUTH | WALL.WEST;
    }
  }

  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack: { row: number; col: number }[] = [];

  const sr = Math.floor(rng() * rows);
  const sc = Math.floor(rng() * cols);
  visited[sr][sc] = true;
  stack.push({ row: sr, col: sc });

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const neighbors = DIRS.filter(d => {
      const nr = cur.row + d.dr;
      const nc = cur.col + d.dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc];
    });

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const d = neighbors[Math.floor(rng() * neighbors.length)];
      const nr = cur.row + d.dr;
      const nc = cur.col + d.dc;
      cells[cur.row][cur.col] &= ~d.wall;
      cells[nr][nc] &= ~d.opp;
      visited[nr][nc] = true;
      stack.push({ row: nr, col: nc });
    }
  }

  if (difficulty === 'easy') {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((cells[r][c] & WALL.EAST) && c < cols - 1 && rng() < 0.3) {
          cells[r][c] &= ~WALL.EAST;
          cells[r][c + 1] &= ~WALL.WEST;
        }
        if ((cells[r][c] & WALL.SOUTH) && r < rows - 1 && rng() < 0.3) {
          cells[r][c] &= ~WALL.SOUTH;
          cells[r + 1][c] &= ~WALL.NORTH;
        }
      }
    }
  } else if (difficulty === 'hard') {
    const onPath = findPathCells(cells, rows, cols, rows - 1, 0, 0, cols - 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (onPath[r][c]) continue;
        if (rng() < 0.2) {
          const d = DIRS[Math.floor(rng() * DIRS.length)];
          const nr = r + d.dr;
          const nc = c + d.dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !onPath[nr][nc]) {
            cells[r][c] |= d.wall;
            cells[nr][nc] |= d.opp;
          }
        }
      }
    }
  }

  return {
    rows,
    cols,
    cellSize: 180,
    wallThickness: 12,
    cells,
    start: { row: rows - 1, col: 0 },
    goal: { row: 0, col: cols - 1 },
  };
}
