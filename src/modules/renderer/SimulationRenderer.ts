import * as PIXI from 'pixi.js';
import { MazeGrid, WALL } from '../../shared/types/maze';
import { RobotSpec } from '../../shared/types/robot';
import { SimState } from '../../shared/types/simulation';
import { RenderOptions } from './types';

export class SimulationRenderer {
  private app: PIXI.Application | null = null;
  private mazeLayer!: PIXI.Graphics;
  private robotLayer!: PIXI.Container;
  private overlayLayer!: PIXI.Container;
  private robotBody!: PIXI.Graphics;
  private directionArrow!: PIXI.Graphics;
  private sensorRays!: PIXI.Graphics;
  private scale: number = 1;
  private currentGrid: MazeGrid | null = null;
  private containerRef: HTMLElement | null = null;
  private destroyed = false;

  async init(container: HTMLElement): Promise<void> {
    this.destroyed = false;
    this.containerRef = container;

    const app = new PIXI.Application();
    await app.init({
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

    if (this.destroyed) {
      app.destroy(true, { children: true });
      return;
    }

    container.appendChild(app.canvas);

    this.mazeLayer = new PIXI.Graphics();
    this.robotLayer = new PIXI.Container();
    this.overlayLayer = new PIXI.Container();

    app.stage.addChild(this.mazeLayer);
    app.stage.addChild(this.robotLayer);
    app.stage.addChild(this.overlayLayer);

    this.robotBody = new PIXI.Graphics();
    this.directionArrow = new PIXI.Graphics();
    this.sensorRays = new PIXI.Graphics();
    this.robotLayer.addChild(this.robotBody);
    this.robotLayer.addChild(this.directionArrow);
    this.robotLayer.addChild(this.sensorRays);

    this.app = app;
    this.resize();
  }

  loadMaze(grid: MazeGrid): void {
    if (this.destroyed || !this.mazeLayer) return;
    this.currentGrid = grid;
    this.mazeLayer.clear();
    this.scale = this.computeScale(grid);

    const wallColor = 0x2d2d2d;
    const floorColor = 0xf5f5f0;
    const startColor = 0x2ecc71;
    const goalColor = 0xe74c3c;

    this.mazeLayer.rect(0, 0, grid.cols * grid.cellSize * this.scale, grid.rows * grid.cellSize * this.scale);
    this.mazeLayer.fill(floorColor);

    this.drawWalls(grid, wallColor);
    this.drawMarkers(grid, startColor, goalColor);
  }

  private drawWalls(grid: MazeGrid, color: number): void {
    const s = this.scale;
    const wt = grid.wallThickness * s;
    const cs = grid.cellSize * s;

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const cell = grid.cells[row][col];
        const x = col * cs;
        const y = row * cs;

        if (cell & WALL.NORTH) {
          this.mazeLayer.rect(x, y, cs, wt).fill(color);
        }
        if (cell & WALL.WEST) {
          this.mazeLayer.rect(x, y, wt, cs).fill(color);
        }
      }
    }

    this.mazeLayer.rect(0, 0, grid.cols * cs, wt).fill(color);
    this.mazeLayer.rect(0, 0, wt, grid.rows * cs).fill(color);
    this.mazeLayer.rect(0, grid.rows * cs - wt, grid.cols * cs, wt).fill(color);
    this.mazeLayer.rect(grid.cols * cs - wt, 0, wt, grid.rows * cs).fill(color);
  }

  private drawMarkers(grid: MazeGrid, startColor: number, goalColor: number): void {
    const s = this.scale;
    const cs = grid.cellSize * s;
    const halfCs = cs / 2;

    const startCx = grid.start.col * cs + halfCs;
    const startCy = grid.start.row * cs + halfCs;
    this.mazeLayer.rect(startCx - halfCs, startCy - halfCs, cs, cs)
      .fill({ color: startColor, alpha: 0.5 });

    const goalCx = grid.goal.col * cs + halfCs;
    const goalCy = grid.goal.row * cs + halfCs;
    this.mazeLayer.rect(goalCx - halfCs, goalCy - halfCs, cs, cs)
      .fill({ color: goalColor, alpha: 0.5 });
  }

  updateFrame(state: SimState, robotSpec: RobotSpec, options: RenderOptions): void {
    if (this.destroyed || !this.robotBody) return;
    this.robotBody.clear();
    this.directionArrow.clear();
    this.sensorRays.clear();

    const scale = this.scale;
    const x = state.robot.x * scale;
    const y = state.robot.y * scale;
    const angle = state.robot.angle;

    this.robotLayer.x = x;
    this.robotLayer.y = y;
    this.robotLayer.rotation = angle;

    this.robotBody.rect(
      -robotSpec.base.width / 2 * scale,
      -robotSpec.base.height / 2 * scale,
      robotSpec.base.width * scale,
      robotSpec.base.height * scale
    );
    this.robotBody.fill(0x1976d2);

    this.directionArrow.moveTo(0, 0);
    this.directionArrow.lineTo(0, -robotSpec.base.height / 2 * scale);
    this.directionArrow.stroke({ color: 0xffffff, width: 2 * scale });

    if (options.showSensorRays && state.sensors) {
      this.drawSensorRays(state, robotSpec);
    }
  }

  private drawSensorRays(state: SimState, spec: RobotSpec): void {
    const sc = this.scale;
    const g = this.sensorRays;

    for (const sensor of spec.sensors) {
      const dist = state.sensors[sensor.id] ?? -1;
      const sensorAngleRad = (sensor.angle * Math.PI) / 180;
      const maxLen = sensor.range * sc;
      const rayLen = dist > 0 ? Math.min(dist * sc, maxLen) : maxLen;
      const color = dist > 0 ? 0xff4444 : 0x44ff44;

      const ex = sensor.position.x * sc + Math.sin(sensorAngleRad) * rayLen;
      const ey = sensor.position.y * sc - Math.cos(sensorAngleRad) * rayLen;

      g.moveTo(sensor.position.x * sc, sensor.position.y * sc);
      g.lineTo(ex, ey);
      g.stroke({ color, width: 1.5, alpha: 0.7 });

      if (dist > 0) {
        g.circle(ex, ey, 3);
        g.fill({ color: 0xff4444, alpha: 0.8 });
      }
    }
  }

  reset(): void {
    if (this.destroyed || !this.mazeLayer) return;
    this.mazeLayer.clear();
    this.robotBody.clear();
    this.directionArrow.clear();
    this.sensorRays.clear();
    this.overlayLayer.removeChildren();
  }

  destroy(): void {
    this.destroyed = true;
    if (!this.app) return;
    this.app.destroy(true, { children: true });
    this.app = null;
  }

  resize(): void {
    if (!this.containerRef || !this.containerRef.parentElement || !this.app) return;

    const rect = this.containerRef.parentElement.getBoundingClientRect();
    this.app.renderer.resize(rect.width, rect.height);

    if (this.currentGrid) {
      this.scale = this.computeScale(this.currentGrid);
      this.loadMaze(this.currentGrid);
    }
  }

  private computeScale(grid: MazeGrid): number {
    if (!this.containerRef || !this.containerRef.parentElement) return 1;

    const rect = this.containerRef.parentElement.getBoundingClientRect();
    const maxW = rect.width * 0.9;
    const maxH = rect.height * 0.9;
    const mazeW = grid.cols * grid.cellSize;
    const mazeH = grid.rows * grid.cellSize;
    return Math.min(maxW / mazeW, maxH / mazeH);
  }
}
