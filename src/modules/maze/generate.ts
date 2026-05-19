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

export function generateMaze(
  rows: number,
  cols: number,
  difficulty: 'easy' | 'medium' | 'hard',
  attempt = 0,
  currentMaze?: MazeGrid
): MazeGrid {
  const diffIdx = ['easy', 'medium', 'hard'].indexOf(difficulty);
  const rng = createRng(rows * 1000 + cols * 10 + diffIdx + attempt * 7919);

  // Enforce competitive standards: Start at bottom-left, Goal at top-right or center 2x2
  const goalType = currentMaze?.goalType || 'manual';
  
  const canBeCenter = (rows % 2 === 0) && (cols % 2 === 0) && (rows >= 16) && (cols >= 16);
  const finalGoalType = (goalType === 'center2x2' && canBeCenter) ? 'center2x2' : 'manual';

  const goal = (finalGoalType === 'center2x2') 
    ? { row: Math.floor(rows / 2) - 1, col: Math.floor(cols / 2) - 1 }
    : { row: 0, col: cols - 1 };
  
  const start = { row: rows - 1, col: 0 };

  const cells: number[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = WALL.NORTH | WALL.EAST | WALL.SOUTH | WALL.WEST;
    }
  }

  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack: { row: number; col: number }[] = [];

  const sr = start.row;
  const sc = start.col;
  visited[sr][sc] = true;
  stack.push({ row: sr, col: sc });

  // DFS ensures everything is connected as a tree
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

  // Clear internal walls for 2x2 goal immediately to ensure connectivity logic doesn't ignore it
  if (goalType === 'center2x2') {
    cells[goal.row][goal.col] &= ~WALL.EAST;
    cells[goal.row][goal.col + 1] &= ~WALL.WEST;
    cells[goal.row + 1][goal.col] &= ~WALL.EAST;
    cells[goal.row + 1][goal.col + 1] &= ~WALL.WEST;
    cells[goal.row][goal.col] &= ~WALL.SOUTH;
    cells[goal.row + 1][goal.col] &= ~WALL.NORTH;
    cells[goal.row][goal.col + 1] &= ~WALL.SOUTH;
    cells[goal.row + 1][goal.col + 1] &= ~WALL.NORTH;
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
    // For hard, we sometimes add walls back, but we must not block the goal.
    // Simplifying: difficulty mostly affects loopiness and branchiness in this DFS.
    // The previous implementation was breaking reachability.
    // To make it "harder", we could just avoid extra path removals.
  }

  return {
    rows,
    cols,
    cellSize: 180,
    wallThickness: 12,
    cells,
    start,
    goal,
    goalType,
  };
}
