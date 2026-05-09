# 07 — Renderer (PixiJS)

## Mục tiêu

Render simulation real-time ở 60fps sử dụng PixiJS (WebGL). Main thread nhận `SimState` từ Web Worker và cập nhật scene graph.

---

## Scene Graph Structure

```
PixiJS Stage
├── mazeLayer      (Graphics — static, vẽ 1 lần)
│   ├── wallGraphics
│   ├── startMarker
│   └── goalMarker
├── robotLayer     (Container — update mỗi frame)
│   ├── bodyGraphic
│   ├── sensorRays  (Graphics — update mỗi frame)
│   └── directionArrow
└── overlayLayer   (Container — HUD)
    ├── pathTrail   (Graphics — append mỗi frame khi recording)
    └── cellLabels  (Text — flood fill numbers, toggle on/off)
```

---

## Khởi tạo

```typescript
// modules/renderer/SimulationRenderer.ts

import * as PIXI from 'pixi.js';

export class SimulationRenderer {
  private app: PIXI.Application;
  private mazeLayer: PIXI.Graphics;
  private robotContainer: PIXI.Container;
  private robotBody: PIXI.Graphics;
  private sensorRays: PIXI.Graphics;
  private pathTrail: PIXI.Graphics;

  private scale: number = 1; // px per mm
  private mazeGrid: MazeGrid | null = null;

  async init(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application();
    await this.app.init({
      canvas,
      resizeTo: canvas.parentElement!,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    this.mazeLayer = new PIXI.Graphics();
    this.robotContainer = new PIXI.Container();
    this.robotBody = new PIXI.Graphics();
    this.sensorRays = new PIXI.Graphics();
    this.pathTrail = new PIXI.Graphics();

    this.robotContainer.addChild(this.sensorRays, this.robotBody);
    this.app.stage.addChild(this.mazeLayer, this.pathTrail, this.robotContainer);
  }

  loadMaze(grid: MazeGrid) {
    this.mazeGrid = grid;
    this.scale = this.computeScale(grid);
    this.drawMaze(grid);
  }

  private computeScale(grid: MazeGrid): number {
    const maxW = this.app.screen.width * 0.9;
    const maxH = this.app.screen.height * 0.9;
    const mazeW = grid.cols * grid.cellSize;
    const mazeH = grid.rows * grid.cellSize;
    return Math.min(maxW / mazeW, maxH / mazeH);
  }

  private drawMaze(grid: MazeGrid) {
    const g = this.mazeLayer;
    g.clear();
    const s = grid.cellSize * this.scale;
    const t = grid.wallThickness * this.scale;

    g.fill({ color: 0xf5f5f0 });
    g.rect(0, 0, grid.cols * s, grid.rows * s);
    g.fill();

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const x = col * s;
        const y = row * s;
        const mask = grid.cells[row][col];

        g.fill({ color: 0x2d2d2d });
        if (mask & WALL.NORTH) g.rect(x, y - t / 2, s + t, t);
        if (mask & WALL.WEST)  g.rect(x - t / 2, y, t, s + t);
        g.fill();
      }
    }

    // Start marker (xanh lá)
    const start = cellToWorld(grid, grid.start.row, grid.start.col);
    g.fill({ color: 0x4caf50, alpha: 0.4 });
    g.rect(start.x * this.scale - s / 2, start.y * this.scale - s / 2, s, s);
    g.fill();

    // Goal marker (đỏ)
    const goal = cellToWorld(grid, grid.goal.row, grid.goal.col);
    g.fill({ color: 0xf44336, alpha: 0.4 });
    g.rect(goal.x * this.scale - s / 2, goal.y * this.scale - s / 2, s, s);
    g.fill();
  }

  // Update mỗi khi nhận SimState mới từ Worker
  updateFrame(state: SimState, robotSpec: RobotSpec, options: RenderOptions) {
    const sc = this.scale;

    // Update robot position
    this.robotContainer.x = state.robot.x * sc;
    this.robotContainer.y = state.robot.y * sc;
    this.robotContainer.rotation = state.robot.angle;

    // Draw robot body
    this.robotBody.clear();
    this.robotBody.fill({ color: 0x1976d2 });
    this.robotBody.rect(
      -robotSpec.base.width / 2 * sc,
      -robotSpec.base.height / 2 * sc,
      robotSpec.base.width * sc,
      robotSpec.base.height * sc
    );
    this.robotBody.fill();

    // Direction arrow
    this.robotBody.stroke({ color: 0xffffff, width: 2 });
    this.robotBody.moveTo(0, robotSpec.base.height / 4 * sc);
    this.robotBody.lineTo(0, -robotSpec.base.height / 2 * sc);
    this.robotBody.stroke();

    // Sensor rays
    if (options.showSensorRays) {
      this.drawSensorRays(state, robotSpec);
    }

    // Path trail
    if (options.showPathTrail) {
      this.pathTrail.stroke({ color: 0xff9800, width: 1, alpha: 0.6 });
      this.pathTrail.lineTo(state.robot.x * sc, state.robot.y * sc);
      this.pathTrail.stroke();
    }
  }

  private drawSensorRays(state: SimState, spec: RobotSpec) {
    const g = this.sensorRays;
    g.clear();
    const sc = this.scale;

    spec.sensors.forEach(sensor => {
      const dist = state.sensors[sensor.id] ?? -1;
      const worldAngle = sensor.angle * Math.PI / 180;
      const rayLength = dist > 0 ? dist * sc : sensor.maxRange * sc;
      const color = dist > 0 ? 0xff4444 : 0x44ff44;

      const endX = Math.sin(worldAngle) * rayLength + sensor.position.x * sc;
      const endY = -Math.cos(worldAngle) * rayLength + sensor.position.y * sc;

      g.stroke({ color, width: 1, alpha: 0.7 });
      g.moveTo(sensor.position.x * sc, sensor.position.y * sc);
      g.lineTo(endX, endY);
      g.stroke();

      if (dist > 0) {
        g.fill({ color: 0xff4444 });
        g.circle(endX, endY, 3);
        g.fill();
      }
    });
  }

  reset() {
    this.pathTrail.clear();
  }

  destroy() {
    this.app.destroy(false);
  }
}

export interface RenderOptions {
  showSensorRays: boolean;
  showPathTrail: boolean;
  showCellNumbers: boolean; // flood fill distances
}
```

---

## Lưu ý

- PixiJS render trên main thread, nhận state từ Worker qua `postMessage`
- Scale tự động tính để maze vừa với viewport
- Path trail dùng Graphics append (không clear mỗi frame) — hiệu suất tốt
- Khi resize viewport: recalculate scale và redraw maze layer
- `devicePixelRatio` để render sắc nét trên HiDPI/Retina screens
