import type { Graphics } from 'pixi.js';
import type { MazeGrid } from '../types/maze';
import { WALL } from '../types/maze';
import { hasWall } from './maze';

export function drawMazeWalls(g: Graphics, grid: MazeGrid, scale: number, color: number): void {
  const wt = grid.wallThickness * scale;
  const cs = grid.cellSize * scale;
  const totalW = grid.cols * cs;
  const totalH = grid.rows * cs;

  g.rect(-wt, -wt, totalW + 2 * wt, wt).fill(color);
  g.rect(-wt, 0, wt, totalH).fill(color);
  g.rect(-wt, totalH, totalW + 2 * wt, wt).fill(color);
  g.rect(totalW, 0, wt, totalH).fill(color);

  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (hasWall(grid, r, c, WALL.NORTH) && r > 0) {
        const hasW = hasWall(grid, r, c, WALL.WEST);
        const hasE = hasWall(grid, r, c, WALL.EAST) || hasWall(grid, r - 1, c, WALL.EAST);
        g.rect(c * cs - (hasW ? wt / 2 : 0), r * cs - wt / 2,
          cs + (hasW ? wt / 2 : 0) + (hasE ? wt / 2 : 0), wt).fill(color);
      }
      if (hasWall(grid, r, c, WALL.WEST) && c > 0) {
        const hasS = hasWall(grid, r, c, WALL.SOUTH) || hasWall(grid, r, c - 1, WALL.SOUTH);
        g.rect(c * cs - wt / 2, r * cs, wt,
          cs + (hasS ? wt / 2 : 0)).fill(color);
      }
    }
  }
}

const GRID_LINE_WIDTH = 3;
const GRID_LINE_ALPHA = 0.5;
const GRID_DASH_LEN = 12;
const GRID_GAP_LEN = 8;

function addDashedLine(g: Graphics, x1: number, y1: number, x2: number, y2: number, dashLen: number, gapLen: number): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const ux = dx / len;
  const uy = dy / len;
  let drawn = 0;
  let isDash = true;
  while (drawn < len) {
    const remaining = len - drawn;
    const segLen = Math.min((isDash ? dashLen : gapLen), remaining);
    if (isDash) {
      g.moveTo(x1 + ux * drawn, y1 + uy * drawn)
       .lineTo(x1 + ux * (drawn + segLen), y1 + uy * (drawn + segLen));
    }
    drawn += segLen;
    isDash = !isDash;
  }
}

export function drawMazeGridLines(g: Graphics, grid: MazeGrid, scale: number, color: number): void {
  const cs = grid.cellSize * scale;
  const totalW = grid.cols * cs;
  const totalH = grid.rows * cs;
  const dashLen = GRID_DASH_LEN * scale;
  const gapLen = GRID_GAP_LEN * scale;
  const lineWidth = Math.max(GRID_LINE_WIDTH * scale, 2);

  for (let r = 1; r < grid.rows; r++) {
    addDashedLine(g, 0, r * cs, totalW, r * cs, dashLen, gapLen);
  }
  for (let c = 1; c < grid.cols; c++) {
    addDashedLine(g, c * cs, 0, c * cs, totalH, dashLen, gapLen);
  }
  g.stroke({ color, width: lineWidth, alpha: GRID_LINE_ALPHA });
}

export function drawMazeMarkers(
  g: Graphics,
  grid: MazeGrid,
  scale: number,
  startColor: number,
  goalColor: number,
  options?: { alpha?: number; circleSize?: number }
): void {
  const cs = grid.cellSize * scale;
  const halfCs = cs / 2;
  const alpha = options?.alpha ?? 0.4;
  const circleSize = options?.circleSize;

  const startCx = grid.start.col * cs + halfCs;
  const startCy = grid.start.row * cs + halfCs;
  g.rect(startCx - halfCs, startCy - halfCs, cs, cs)
    .fill({ color: startColor, alpha });
  if (circleSize) {
    g.circle(startCx, startCy, circleSize * scale).fill(startColor);
  }

  const isCenter2x2 = grid.goalType === 'center2x2';
  const goalCells = isCenter2x2
    ? [
        { r: grid.goal.row, c: grid.goal.col },
        { r: grid.goal.row, c: grid.goal.col + 1 },
        { r: grid.goal.row + 1, c: grid.goal.col },
        { r: grid.goal.row + 1, c: grid.goal.col + 1 },
      ]
    : [{ r: grid.goal.row, c: grid.goal.col }];

  goalCells.forEach(cell => {
    const goalCx = cell.c * cs + halfCs;
    const goalCy = cell.r * cs + halfCs;
    g.rect(goalCx - halfCs, goalCy - halfCs, cs, cs)
      .fill({ color: goalColor, alpha });
    if (circleSize) {
      g.circle(goalCx, goalCy, circleSize * scale).fill(goalColor);
    }
  });
}

export function computeMazeScale(
  containerW: number, containerH: number,
  grid: MazeGrid, minScale = 0,
): number {
  const maxW = containerW * 0.9;
  const maxH = containerH * 0.9;
  const mazeW = grid.cols * grid.cellSize + 2 * grid.wallThickness;
  const mazeH = grid.rows * grid.cellSize + 2 * grid.wallThickness;
  return Math.max(Math.min(maxW / mazeW, maxH / mazeH), minScale);
}

export function computeMazeOffset(
  containerW: number, containerH: number,
  totalPixelW: number, totalPixelH: number,
  wt: number,
): { x: number; y: number } {
  return {
    x: (containerW - totalPixelW - 2 * wt) / 2 + wt,
    y: (containerH - totalPixelH - 2 * wt) / 2 + wt,
  };
}
