import * as PIXI from 'pixi.js';
import type { MazeGrid } from '../../shared/types/maze';
import type { RobotSpec } from '../../shared/types/robot';
import type { SimState } from '../../shared/types/simulation';
import { RenderOptions } from './types';
import { drawMazeWalls, drawMazeMarkers, drawMazeGridLines, computeMazeScale, computeMazeOffset } from '../../shared/utils/maze-render';
import { WALL_COLOR, FLOOR_COLOR, START_COLOR, GOAL_COLOR, GRID_LINE_COLOR } from '../../shared/constants/render-colors';
import { createPixiApp, destroyPixiApp, resizePixiRenderer } from '../../shared/utils/pixi-utils';

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
  private sceneContainer!: PIXI.Container;
  private scale: number = 1;
  private currentGrid: MazeGrid | null = null;
  private containerRef: HTMLElement | null = null;
  private destroyed = false;

  async init(container: HTMLElement): Promise<void> {
    this.destroyed = false;
    this.containerRef = container;

    const app = await createPixiApp(container);
    if (!app || this.destroyed) { if (app) destroyPixiApp(app); return; }

    this.sceneContainer = new PIXI.Container();
    this.mazeLayer = new PIXI.Graphics();
    this.robotLayer = new PIXI.Container();
    this.overlayLayer = new PIXI.Container();

    this.sceneContainer.addChild(this.mazeLayer);
    this.sceneContainer.addChild(this.robotLayer);
    this.sceneContainer.addChild(this.overlayLayer);
    app.stage.addChild(this.sceneContainer);

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

    const s = this.scale;
    const cs = grid.cellSize * s;
    const wt = grid.wallThickness * s;
    const totalW = grid.cols * cs;
    const totalH = grid.rows * cs;

    this.mazeLayer.rect(0, 0, totalW, totalH).fill(FLOOR_COLOR);

    drawMazeWalls(this.mazeLayer, grid, s, WALL_COLOR);
    drawMazeMarkers(this.mazeLayer, grid, s, START_COLOR, GOAL_COLOR, { alpha: 0.5 });
    drawMazeGridLines(this.mazeLayer, grid, s, GRID_LINE_COLOR);

    const off = computeMazeOffset(this.app!.screen.width, this.app!.screen.height, totalW, totalH, wt);
    this.sceneContainer.x = off.x;
    this.sceneContainer.y = off.y;
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
    destroyPixiApp(this.app);
    this.app = null;
  }

  resize(): void {
    const size = resizePixiRenderer(this.app, this.containerRef);
    if (!size) return;

    if (this.currentGrid) {
      this.scale = this.computeScale(this.currentGrid);
      this.loadMaze(this.currentGrid);
    }
  }

  private computeScale(grid: MazeGrid): number {
    if (!this.containerRef || !this.containerRef.parentElement) return 1;
    const rect = this.containerRef.parentElement.getBoundingClientRect();
    return computeMazeScale(rect.width, rect.height, grid);
  }
}
