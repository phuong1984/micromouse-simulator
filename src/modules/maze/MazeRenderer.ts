import * as PIXI from 'pixi.js';
import { MazeGrid, WALL, Wall } from '../../shared/types/maze';
import { drawMazeWalls, drawMazeMarkers, drawMazeGridLines, computeMazeScale, computeMazeOffset } from '../../shared/utils/maze-render';
import { WALL_COLOR, FLOOR_COLOR, START_COLOR, GOAL_COLOR, GRID_LINE_COLOR } from '../../shared/constants/render-colors';
import { createPixiApp, destroyPixiApp, resizePixiRenderer } from '../../shared/utils/pixi-utils';

export interface MazeEditorCallbacks {
  toggleWall: (row: number, col: number, direction: Wall) => void;
  setStart: (row: number, col: number) => void;
  setGoal: (row: number, col: number) => void;
}

const HOVER_COLOR = 0x3b82f6;
const HIT_THRESHOLD_PX = 10;

export class MazeRenderer {
  private app: PIXI.Application | null = null;
  private floorLayer!: PIXI.Graphics;
  private gridLayer!: PIXI.Graphics;
  private wallLayer!: PIXI.Graphics;
  private markerLayer!: PIXI.Graphics;
  private hoverLayer!: PIXI.Graphics;
  private mazeContainer!: PIXI.Container;
  private containerRef: HTMLElement | null = null;
  private destroyed = false;
  private scale = 1;
  private currentGrid: MazeGrid | null = null;
  private callbacks: MazeEditorCallbacks;
  private editMode: 'wall' | 'start' | 'goal' = 'wall';

  private hoverEdge: { row: number; col: number; dir: Wall } | null = null;
  private isDragging = false;
  private lastToggledKey = '';

  constructor(callbacks: MazeEditorCallbacks) {
    this.callbacks = callbacks;
  }

  private edgeKey(edge: { row: number; col: number; dir: Wall }): string {
    return `${edge.row}-${edge.col}-${edge.dir}`;
  }

  private doToggle(edge: { row: number; col: number; dir: Wall }): void {
    if (edge.dir === WALL.NORTH || edge.dir === WALL.SOUTH) {
      this.callbacks.toggleWall(edge.row, edge.col, WALL.NORTH);
    } else {
      this.callbacks.toggleWall(edge.row, edge.col, WALL.WEST);
    }
  }

  async init(container: HTMLElement): Promise<void> {
    this.destroyed = false;
    this.containerRef = container;

    const app = await createPixiApp(container);
    if (!app || this.destroyed) { if (app) destroyPixiApp(app); return; }

    this.mazeContainer = new PIXI.Container();

    this.floorLayer = new PIXI.Graphics();
    this.gridLayer = new PIXI.Graphics();
    this.wallLayer = new PIXI.Graphics();
    this.markerLayer = new PIXI.Graphics();
    this.hoverLayer = new PIXI.Graphics();

    this.mazeContainer.addChild(this.floorLayer);
    this.mazeContainer.addChild(this.wallLayer);
    this.mazeContainer.addChild(this.markerLayer);
    this.mazeContainer.addChild(this.gridLayer);
    this.mazeContainer.addChild(this.hoverLayer);
    app.stage.addChild(this.mazeContainer);

    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointermove', this.onPointerMove.bind(this));
    app.stage.on('pointerdown', this.onPointerDown.bind(this));
    app.stage.on('pointerup', this.onPointerUp.bind(this));
    app.stage.on('pointerupoutside', this.onPointerUp.bind(this));

    this.app = app;
    this.resize();
  }

  loadMaze(grid: MazeGrid): void {
    if (this.destroyed) return;
    if (!this.floorLayer) return;
    this.currentGrid = grid;
    this.scale = this.computeScale(grid);
    this.drawAll(grid);
  }

  setEditMode(mode: 'wall' | 'start' | 'goal'): void {
    this.editMode = mode;
  }

  destroy(): void {
    this.destroyed = true;
    destroyPixiApp(this.app);
    this.app = null;
  }

  resize(): void {
    const size = resizePixiRenderer(this.app, this.containerRef);
    if (!size) return;
    if (this.currentGrid) {
      this.scale = this.computeScale(this.currentGrid);
      this.drawAll(this.currentGrid);
    }
  }

  private computeScale(grid: MazeGrid): number {
    if (!this.containerRef || !this.containerRef.parentElement) return 1;
    const rect = this.containerRef.parentElement.getBoundingClientRect();
    return computeMazeScale(rect.width, rect.height, grid, 2.5 / grid.wallThickness);
  }

  private drawAll(grid: MazeGrid): void {
    const s = this.scale;
    const cs = grid.cellSize * s;
    const totalW = grid.cols * cs;
    const totalH = grid.rows * cs;

    this.floorLayer.clear();
    this.floorLayer.rect(0, 0, totalW, totalH).fill(FLOOR_COLOR);

    this.wallLayer.clear();
    drawMazeWalls(this.wallLayer, grid, s, WALL_COLOR);

    this.markerLayer.clear();
    drawMazeMarkers(this.markerLayer, grid, s, START_COLOR, GOAL_COLOR, { alpha: 0.4, circleSize: 6 });

    this.gridLayer.clear();
    drawMazeGridLines(this.gridLayer, grid, s, GRID_LINE_COLOR);

    const wt = grid.wallThickness * s;
    const off = computeMazeOffset(this.app!.screen.width, this.app!.screen.height, totalW, totalH, wt);
    this.mazeContainer.x = off.x;
    this.mazeContainer.y = off.y;

    this.hoverLayer.clear();
  }

  private getCanvasCoords(e: PIXI.FederatedPointerEvent): { mx: number; my: number } {
    const rect = this.app!.canvas.getBoundingClientRect();
    const canvasX = (e.clientX ?? e.global.x) - rect.left;
    const canvasY = (e.clientY ?? e.global.y) - rect.top;
    return {
      mx: (canvasX - this.mazeContainer.x) / this.scale,
      my: (canvasY - this.mazeContainer.y) / this.scale,
    };
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  private findEdge(mx: number, my: number): { row: number; col: number; dir: Wall } | null {
    if (!this.currentGrid) return null;
    const grid = this.currentGrid;
    const cs = grid.cellSize;
    const threshold = HIT_THRESHOLD_PX / this.scale;
    let best: { row: number; col: number; dir: Wall } | null = null;
    let bestDist = threshold;

    for (let r = 0; r <= grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const d = this.distToSegment(mx, my, c * cs, r * cs, (c + 1) * cs, r * cs);
        if (d < bestDist && r > 0 && r < grid.rows) {
          bestDist = d;
          best = { row: r, col: c, dir: WALL.NORTH };
        }
      }
    }

    for (let c = 0; c <= grid.cols; c++) {
      for (let r = 0; r < grid.rows; r++) {
        const d = this.distToSegment(mx, my, c * cs, r * cs, c * cs, (r + 1) * cs);
        if (d < bestDist && c > 0 && c < grid.cols) {
          bestDist = d;
          best = { row: r, col: c, dir: WALL.WEST };
        }
      }
    }

    return best;
  }

  private findCell(mx: number, my: number): { row: number; col: number } | null {
    if (!this.currentGrid) return null;
    const cs = this.currentGrid.cellSize;
    const col = Math.floor(mx / cs);
    const row = Math.floor(my / cs);
    if (row < 0 || row >= this.currentGrid.rows || col < 0 || col >= this.currentGrid.cols) return null;
    return { row, col };
  }

  private drawHover(grid: MazeGrid): void {
    this.hoverLayer.clear();
    if (!this.hoverEdge) return;
    const s = this.scale;
    const cs = grid.cellSize * s;
    const wt = grid.wallThickness * s;
    const { row, col, dir } = this.hoverEdge;

    let x: number, y: number, w: number, h: number;
    if (dir === WALL.NORTH || dir === WALL.SOUTH) {
      x = col * cs;
      y = row * cs - wt / 2;
      w = cs;
      h = wt;
    } else {
      x = col * cs - wt / 2;
      y = row * cs;
      w = wt;
      h = cs;
    }

    this.hoverLayer.rect(x, y, w, h).fill({ color: HOVER_COLOR, alpha: 0.7 });
  }

  private onPointerMove(e: PIXI.FederatedPointerEvent): void {
    if (!this.currentGrid) return;
    const { mx, my } = this.getCanvasCoords(e);

    if (this.editMode === 'wall') {
      this.hoverEdge = this.findEdge(mx, my);

      if (this.isDragging && this.hoverEdge) {
        const key = this.edgeKey(this.hoverEdge);
        if (key !== this.lastToggledKey) {
          this.lastToggledKey = key;
          this.doToggle(this.hoverEdge);
        }
      }
    } else {
      this.hoverEdge = null;
    }
    this.drawHover(this.currentGrid);

    if (this.editMode !== 'wall') {
      const cell = this.findCell(mx, my);
      if (cell) {
        const s = this.scale;
        const cs = this.currentGrid.cellSize * s;
        this.hoverLayer.clear();
        this.hoverLayer.rect(cell.col * cs, cell.row * cs, cs, cs)
          .fill({ color: HOVER_COLOR, alpha: 0.3 });
      }
    }
  }

  private onPointerDown(e: PIXI.FederatedPointerEvent): void {
    if (!this.currentGrid) return;
    const { mx, my } = this.getCanvasCoords(e);

    if (this.editMode === 'wall') {
      const edge = this.findEdge(mx, my);
      if (edge) {
        this.isDragging = true;
        this.lastToggledKey = this.edgeKey(edge);
        this.doToggle(edge);
      }
    } else if (this.editMode === 'start') {
      const cell = this.findCell(mx, my);
      if (cell) this.callbacks.setStart(cell.row, cell.col);
    } else if (this.editMode === 'goal') {
      const cell = this.findCell(mx, my);
      if (cell) this.callbacks.setGoal(cell.row, cell.col);
    }
  }

  private onPointerUp(): void {
    this.isDragging = false;
    this.lastToggledKey = '';
  }
}
