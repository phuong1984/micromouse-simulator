import * as PIXI from 'pixi.js';
import type { MazeGrid } from '../../shared/types/maze';
import type { RobotSpec } from '../../shared/types/robot';
import type { SimState } from '../../shared/types/simulation';
import { RenderOptions } from './types';
import { drawMazeWalls, drawMazeMarkers, drawMazeGridLines, computeMazeScale, computeMazeOffset } from '../../shared/utils/maze-render';
import { WALL_COLOR, FLOOR_COLOR, START_COLOR, GOAL_COLOR, GRID_LINE_COLOR, BASE_CORNER_RADIUS, WHEEL_CORNER_RADIUS } from '../../shared/constants/render-colors';
import { createPixiApp, destroyPixiApp, resizePixiRenderer } from '../../shared/utils/pixi-utils';
import { floodFillDistances } from '../../shared/utils/maze';

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
  private floodFillLayer!: PIXI.Container;
  private scale: number = 1;
  private currentGrid: MazeGrid | null = null;
  private containerRef: HTMLElement | null = null;
  private destroyed = false;
  private celebrated = false;
  private floodFillTexts: PIXI.Text[] = [];
  private showCellNumbers = false;
  private prevShowCellNumbers = false;

  private confettiParticles: Array<{
    x: number; y: number; vx: number; vy: number;
    rotation: number; rotSpeed: number;
    color: number; alpha: number; life: number; maxLife: number;
    size: { w: number; h: number };
  }> = [];
  private confettiG: PIXI.Graphics | null = null;

  async init(container: HTMLElement): Promise<void> {
    this.destroyed = false;
    this.containerRef = container;

    const app = await createPixiApp(container);
    if (!app || this.destroyed) { if (app) destroyPixiApp(app); return; }

    this.sceneContainer = new PIXI.Container();
    this.mazeLayer = new PIXI.Graphics();
    this.robotLayer = new PIXI.Container();
    this.overlayLayer = new PIXI.Container();

    this.floodFillLayer = new PIXI.Container();
    this.floodFillLayer.visible = false;

    this.sceneContainer.addChild(this.mazeLayer);
    this.sceneContainer.addChild(this.floodFillLayer);
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

    this.rebuildFloodFill();
  }

  private rebuildFloodFill(): void {
    this.floodFillLayer.removeChildren();
    this.floodFillTexts = [];
    if (!this.currentGrid) return;

    const dist = floodFillDistances(this.currentGrid, this.currentGrid.goal);
    const s = this.scale;
    const cs = this.currentGrid.cellSize * s;
    const halfCs = cs / 2;

    for (let r = 0; r < this.currentGrid.rows; r++) {
      for (let c = 0; c < this.currentGrid.cols; c++) {
        const d = dist[r][c];
        if (d < 0) continue;

        const text = new PIXI.Text({
          text: String(d),
          style: {
            fontSize: Math.max(cs * 0.35, 10),
            fill: d === 0 ? 0xef4444 : 0x1f2937,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            align: 'center',
            stroke: { color: d === 0 ? 0xffffff : 0xffffff, width: 2 },
          },
        });
        text.anchor.set(0.5);
        text.x = c * cs + halfCs;
        text.y = r * cs + halfCs;
        text.alpha = 0.85;
        this.floodFillTexts.push(text);
        this.floodFillLayer.addChild(text);
      }
    }
  }

  celebrate(): void {
    if (this.destroyed || !this.app || this.celebrated) return;
    this.celebrated = true;

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const colors = [0xff4444, 0x44ff44, 0x4488ff, 0xffaa00, 0xff44ff, 0xffff44];

    this.confettiParticles = [];
    for (let i = 0; i < 120; i++) {
      this.confettiParticles.push({
        x: w * 0.2 + Math.random() * w * 0.6,
        y: h * 0.1 + Math.random() * h * -0.3,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 300 + Math.random() * 180,
        size: { w: 4 + Math.random() * 6, h: 2 + Math.random() * 4 },
      });
    }

    this.confettiG = new PIXI.Graphics();
    this.overlayLayer.addChild(this.confettiG);

    const ticker = () => {
      if (this.destroyed || !this.confettiG) return;
      this.confettiG.clear();

      let alive = false;
      for (const p of this.confettiParticles) {
        if (p.life >= p.maxLife) continue;
        p.life++;
        alive = true;
        p.x += p.vx;
        p.vy += 0.05;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha = 1 - p.life / p.maxLife;

        const s = Math.sin(p.rotation);
        const c = Math.cos(p.rotation);
        const hw = p.size.w / 2;
        const hh = p.size.h / 2;
        const cx = p.x;
        const cy = p.y;

        this.confettiG.moveTo(cx + (-hw * c - -hh * s), cy + (-hw * s + -hh * c));
        this.confettiG.lineTo(cx + (hw * c - -hh * s), cy + (hw * s + -hh * c));
        this.confettiG.lineTo(cx + (hw * c - hh * s), cy + (hw * s + hh * c));
        this.confettiG.lineTo(cx + (-hw * c - hh * s), cy + (-hw * s + hh * c));
        this.confettiG.closePath();
        this.confettiG.fill({ color: p.color, alpha: p.alpha });
      }

      if (!alive) {
        this.cleanupConfetti();
      }
    };

    this.app.ticker.add(ticker);
  }

  private cleanupConfetti(): void {
    if (this.confettiG) {
      this.overlayLayer.removeChild(this.confettiG);
      this.confettiG.destroy();
      this.confettiG = null;
    }
    this.confettiParticles = [];
    this.celebrated = false;
  }

  updateFrame(state: SimState, robotSpec: RobotSpec, options: RenderOptions): void {
    if (this.destroyed || !this.robotBody) return;

    if (!state.isFinished) {
      this.celebrated = false;
    }

    this.showCellNumbers = options.showCellNumbers;
    if (this.showCellNumbers !== this.prevShowCellNumbers) {
      this.prevShowCellNumbers = this.showCellNumbers;
      this.floodFillLayer.visible = this.showCellNumbers;
      if (this.showCellNumbers) {
        this.rebuildFloodFill();
      }
    }

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
      this.robotBody.roundRect(-bw / 2, -bh / 2, bw, bh, BASE_CORNER_RADIUS * s);
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
      this.robotWheels.roundRect(wx - ww / 2, wy - wr, ww, wr * 2, WHEEL_CORNER_RADIUS * s);
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
    this.cleanupConfetti();
    this.overlayLayer.removeChildren();
    this.floodFillLayer.removeChildren();
    this.floodFillTexts = [];
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
