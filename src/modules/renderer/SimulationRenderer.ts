import * as PIXI from 'pixi.js';
import { MazeGrid, WALL } from '../../shared/types/maze';
import { RobotSpec } from '../../shared/types/robot';
import { SimState } from '../../shared/types/simulation';
import { RenderOptions } from './types';

const BASE_COLOR = 0x1e3a5f;
const BASE_STROKE = 0x3b82f6;
const DIR_COLOR = 0x60a5fa;
const WHEEL_COLOR = 0x374151;
const WHEEL_STROKE = 0x6b7280;

const SENSOR_COLOR = 0xef4444;
const FOV_FILL = 0x3b82f6;

export class SimulationRenderer {
  private app: PIXI.Application | null = null;
  private mazeLayer!: PIXI.Graphics;
  private robotLayer!: PIXI.Container;
  private overlayLayer!: PIXI.Container;
  private robotBody!: PIXI.Graphics;
  private directionArrow!: PIXI.Graphics;
  private robotWheels!: PIXI.Graphics;
  private robotMotors!: PIXI.Graphics;
  private robotSensors!: PIXI.Graphics;
  private sensorFov!: PIXI.Graphics;
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
    this.robotWheels = new PIXI.Graphics();
    this.robotMotors = new PIXI.Graphics();
    this.robotSensors = new PIXI.Graphics();
    this.sensorFov = new PIXI.Graphics();
    this.sensorRays = new PIXI.Graphics();

    this.robotLayer.addChild(this.sensorFov);
    this.robotLayer.addChild(this.robotBody);
    this.robotLayer.addChild(this.directionArrow);
    this.robotLayer.addChild(this.robotWheels);
    this.robotLayer.addChild(this.robotMotors);
    this.robotLayer.addChild(this.robotSensors);
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
    this.robotWheels.clear();
    this.robotMotors.clear();
    this.robotSensors.clear();
    this.sensorFov.clear();
    this.sensorRays.clear();

    const s = this.scale;
    const x = state.robot.x * s;
    const y = state.robot.y * s;
    const angle = state.robot.angle;

    this.robotLayer.x = x;
    this.robotLayer.y = y;
    this.robotLayer.rotation = angle;

    const bw = robotSpec.base.width * s;
    const bh = robotSpec.base.height * s;

    if (robotSpec.base.shape === 'circle') {
      this.robotBody.ellipse(0, 0, bw / 2, bh / 2);
      this.robotBody.fill(BASE_COLOR);
      this.robotBody.stroke({ color: BASE_STROKE, width: 2 * s });
    } else {
      this.robotBody.rect(-bw / 2, -bh / 2, bw, bh);
      this.robotBody.fill(BASE_COLOR);
      this.robotBody.stroke({ color: BASE_STROKE, width: 2 * s });
    }

    {
      const tipY = -bh / 2 - 6 * s;
      this.directionArrow.moveTo(0, tipY);
      this.directionArrow.lineTo(-5 * s, -bh / 2 + 2 * s);
      this.directionArrow.lineTo(5 * s, -bh / 2 + 2 * s);
      this.directionArrow.closePath();
      this.directionArrow.fill(DIR_COLOR);
    }

    if (options.showSensorRays) {
      this.drawSensorFov(robotSpec);
    }

    for (const w of robotSpec.wheels) {
      const wx = w.position.x * s;
      const wy = -w.position.y * s;
      const ww = (w.width ?? 8) * s;
      const wr = w.radius * s;
      this.robotWheels.rect(wx - ww / 2, wy - wr, ww, wr * 2);
      this.robotWheels.fill(WHEEL_COLOR);
      if (s > 0.5) this.robotWheels.stroke({ color: WHEEL_STROKE, width: 1 * s });
    }

    for (const sen of robotSpec.sensors) {
      const sx = sen.position.x * s;
      const sy = -sen.position.y * s;
      const aRad = (sen.angle * Math.PI) / 180;
      const arrowLen = 12 * s;

      this.robotSensors.circle(sx, sy, 3 * s);
      this.robotSensors.fill(SENSOR_COLOR);
      this.robotSensors.moveTo(sx, sy);
      this.robotSensors.lineTo(
        sx + arrowLen * Math.sin(aRad),
        sy - arrowLen * Math.cos(aRad)
      );
      this.robotSensors.stroke({ color: SENSOR_COLOR, width: 1.5 * s });
    }

    if (options.showSensorRays && state.sensors) {
      this.drawSensorRays(state, robotSpec);
    }
  }

  private drawSensorFov(spec: RobotSpec): void {
    const s = this.scale;
    for (const sen of spec.sensors) {
      const sx = sen.position.x * s;
      const sy = -sen.position.y * s;
      const aRad = (sen.angle * Math.PI) / 180;
      const fovRad = ((sen.fov ?? 10) * Math.PI) / 180;
      const range = sen.maxRange * s;

      const x1 = sx + range * Math.sin(aRad - fovRad / 2);
      const y1 = sy - range * Math.cos(aRad - fovRad / 2);
      const x2 = sx + range * Math.sin(aRad + fovRad / 2);
      const y2 = sy - range * Math.cos(aRad + fovRad / 2);

      this.sensorFov.moveTo(sx, sy);
      this.sensorFov.lineTo(x1, y1);
      this.sensorFov.lineTo(x2, y2);
      this.sensorFov.closePath();
      this.sensorFov.fill({ color: FOV_FILL, alpha: 0.08 });
    }
  }

  private drawSensorRays(state: SimState, spec: RobotSpec): void {
    const s = this.scale;
    const g = this.sensorRays;

    for (const sensor of spec.sensors) {
      const dist = state.sensors[sensor.id] ?? -1;
      const aRad = (sensor.angle * Math.PI) / 180;
      const maxLen = sensor.maxRange * s;
      const rayLen = dist > 0 ? Math.min(dist * s, maxLen) : maxLen;
      const color = dist > 0 ? 0xff4444 : 0x44ff44;

      const sx = sensor.position.x * s;
      const sy = -sensor.position.y * s;
      const ex = sx + Math.sin(aRad) * rayLen;
      const ey = sy - Math.cos(aRad) * rayLen;

      g.moveTo(sx, sy);
      g.lineTo(ex, ey);
      g.stroke({ color, width: 1.5 * s, alpha: 0.7 });

      if (dist > 0) {
        g.circle(ex, ey, 3 * s);
        g.fill({ color: 0xff4444, alpha: 0.8 });
      }
    }
  }

  reset(): void {
    if (this.destroyed || !this.mazeLayer) return;
    this.mazeLayer.clear();
    this.robotBody.clear();
    this.directionArrow.clear();
    this.robotWheels.clear();
    this.robotMotors.clear();
    this.robotSensors.clear();
    this.sensorFov.clear();
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
