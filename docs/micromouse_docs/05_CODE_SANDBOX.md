# 05 — Code Sandbox & Robot API

## Mục tiêu

Chạy code của user một cách an toàn, cô lập với main thread, và cung cấp Robot API cho phép điều khiển simulation.

---

## Kiến trúc tổng quan

```
Main Thread                    Web Worker
─────────────────────────────────────────────────────
SimulationController           SimulationWorker
  │                              │
  │── START (RobotSpec,          │
  │         MazeGrid,            │
  │         userCode) ──────────►│
  │                              │ Khởi tạo Engine
  │                              │ Compile user code
  │                              │ Start tick loop
  │                              │
  │◄── STATE_UPDATE (SimState) ──│ (mỗi tick)
  │                              │
  │                              │ [User code gọi move()]
  │                              │   → enqueue command
  │                              │   → await resolution
  │                              │
  │── PAUSE / RESUME / STOP ────►│
  │                              │
  │◄── FINISHED (result) ────────│
```

---

## Web Worker Setup

```typescript
// workers/simulation.worker.ts

import Matter from 'matter-js';
import { createPhysicsWorld, addMazeWalls } from '../modules/simulation/physicsWorld';
import { applyMotorForces } from '../modules/simulation/motorModel';
import { SensorSimulator } from '../modules/simulation/sensorSimulator';
import { mazeToWallSegments } from '../modules/simulation/mazeToPhysics';
import { createRobotBody } from '../modules/simulation/robotBody';
import { RobotAPI } from './robotAPI';

let engine: Matter.Engine;
let robotState: RobotPhysicsState;
let sensorSim: SensorSimulator;
let robotAPI: RobotAPI;
let isRunning = false;
let tickCount = 0;
let startTime = 0;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'START':
      await handleStart(payload);
      break;
    case 'PAUSE':
      isRunning = false;
      break;
    case 'RESUME':
      isRunning = true;
      scheduleTick();
      break;
    case 'STOP':
      isRunning = false;
      break;
    case 'SET_MOTOR_SPEED':
      robotState.motorSpeeds.set(payload.motorId, payload.rpm);
      break;
  }
};

async function handleStart(payload: StartPayload) {
  const { robotSpec, mazeGrid, userCode } = payload;

  // Khởi tạo physics
  engine = createPhysicsWorld();
  robotState = createRobotBody(robotSpec);

  const startCell = mazeGrid.start;
  const startPos = cellToWorld(mazeGrid, startCell.row, startCell.col);
  Matter.Body.setPosition(robotState.body, startPos);

  const wallSegments = mazeToWallSegments(mazeGrid);
  addMazeWalls(engine, wallSegments);
  Matter.World.add(engine.world, robotState.body);

  // Khởi tạo sensor simulator
  sensorSim = new SensorSimulator(robotSpec, wallSegments);

  // Tạo Robot API
  robotAPI = new RobotAPI(robotSpec, robotState, engine);

  // Compile và chạy user code trong closure an toàn
  startTime = Date.now();
  tickCount = 0;
  isRunning = true;

  runUserCode(userCode, robotAPI);
  scheduleTick();
}

// Fixed timestep loop
function scheduleTick() {
  if (!isRunning) return;

  const tickFn = () => {
    if (!isRunning) return;

    // Physics step
    applyMotorForces(engine, robotState, currentSpec, PHYSICS_TIMESTEP_MS / 1000);
    Matter.Engine.update(engine, PHYSICS_TIMESTEP_MS);

    // Sensor update
    const { x, y } = robotState.body.position;
    const angle = robotState.body.angle;
    const sensorReadings = sensorSim.update(x, y, angle);

    // Cập nhật Robot API với state mới (để .getSensor() trả đúng giá trị)
    robotAPI.updateState({ x, y, angle, sensorReadings });

    // Giải quyết pending movement promises
    robotAPI.tick(PHYSICS_TIMESTEP_MS);

    // Check goal
    const isFinished = checkGoalReached(robotState.body, mazeGrid);

    tickCount++;
    const simState: SimState = {
      tick: tickCount,
      timestampMs: Date.now(),
      robot: { x, y, angle, velocityX: robotState.body.velocity.x, velocityY: robotState.body.velocity.y, angularVelocity: robotState.body.angularVelocity },
      sensors: sensorReadings,
      motorRPMs: computeActualRPMs(robotState, currentSpec),
      isFinished,
      elapsedMs: Date.now() - startTime,
    };

    self.postMessage({ type: 'STATE_UPDATE', payload: simState });

    if (isFinished) {
      isRunning = false;
      self.postMessage({ type: 'FINISHED', payload: { elapsedMs: simState.elapsedMs } });
    } else {
      setTimeout(tickFn, PHYSICS_TIMESTEP_MS);
    }
  };

  setTimeout(tickFn, 0);
}
```

---

## Robot API

Đây là interface mà user code dùng. Mọi method đều trả **Promise** để hỗ trợ async/await.

```typescript
// workers/robotAPI.ts

export class RobotAPI {
  private pendingMoves: PendingMove[] = [];
  private currentState: { x: number; y: number; angle: number; sensorReadings: Record<string, number> };
  private robotState: RobotPhysicsState;
  private spec: RobotSpec;

  // ──────────────────────────────
  // Movement commands
  // ──────────────────────────────

  /**
   * Di chuyển thẳng một khoảng cách (mm)
   * Positive = tiến, Negative = lùi
   */
  async move(distanceMM: number): Promise<void> {
    return new Promise((resolve) => {
      const startPos = { ...this.currentState };
      const targetDist = Math.abs(distanceMM);
      const direction = Math.sign(distanceMM);
      const speed = direction * DEFAULT_MOVE_SPEED_RPM;

      this.setMotorSpeeds(speed, speed);

      this.pendingMoves.push({
        type: 'distance',
        targetDistance: targetDist,
        startX: startPos.x,
        startY: startPos.y,
        resolve,
      });
    });
  }

  /**
   * Quay tại chỗ một góc (độ)
   * Positive = phải (clockwise), Negative = trái
   */
  async turn(angleDeg: number): Promise<void> {
    return new Promise((resolve) => {
      const targetAngle = this.currentState.angle + degToRad(angleDeg);
      const direction = Math.sign(angleDeg);
      const speed = DEFAULT_TURN_SPEED_RPM;

      this.setMotorSpeeds(direction * speed, -direction * speed);

      this.pendingMoves.push({
        type: 'angle',
        targetAngle,
        startAngle: this.currentState.angle,
        resolve,
      });
    });
  }

  /**
   * Set tốc độ motor trực tiếp (cho advanced users)
   * @param leftRPM  - RPM motor trái (-maxRPM đến +maxRPM)
   * @param rightRPM - RPM motor phải
   */
  setMotorSpeeds(leftRPM: number, rightRPM: number): void {
    const leftMotor = this.spec.motors[0]; // convention: motors[0] = left
    const rightMotor = this.spec.motors[1];
    if (leftMotor) this.robotState.motorSpeeds.set(leftMotor.id, leftRPM);
    if (rightMotor) this.robotState.motorSpeeds.set(rightMotor.id, rightRPM);
  }

  /** Dừng hoàn toàn */
  async stop(): Promise<void> {
    this.setMotorSpeeds(0, 0);
    return new Promise(resolve => setTimeout(resolve, 100)); // chờ coast down
  }

  // ──────────────────────────────
  // Sensor readings
  // ──────────────────────────────

  /**
   * Đọc cảm biến theo ID
   * @returns khoảng cách (mm) hoặc -1 nếu không có vật trong range
   */
  getSensor(sensorId: string): number {
    return this.currentState.sensorReadings[sensorId] ?? -1;
  }

  /** Đọc tất cả sensors cùng lúc */
  getAllSensors(): Record<string, number> {
    return { ...this.currentState.sensorReadings };
  }

  // ──────────────────────────────
  // State queries
  // ──────────────────────────────

  getPosition(): { x: number; y: number } {
    return { x: this.currentState.x, y: this.currentState.y };
  }

  getAngle(): number {
    return radToDeg(this.currentState.angle);
  }

  // ──────────────────────────────
  // Internal: called each tick
  // ──────────────────────────────

  updateState(state: { x: number; y: number; angle: number; sensorReadings: Record<string, number> }) {
    this.currentState = state;
  }

  tick(dtMs: number) {
    this.pendingMoves = this.pendingMoves.filter(move => {
      if (move.type === 'distance') {
        const dx = this.currentState.x - move.startX;
        const dy = this.currentState.y - move.startY;
        const traveled = Math.sqrt(dx * dx + dy * dy);
        if (traveled >= move.targetDistance - 0.5) {
          this.setMotorSpeeds(0, 0);
          move.resolve();
          return false; // remove from pending
        }
      } else if (move.type === 'angle') {
        const angleDiff = Math.abs(normalizeAngle(this.currentState.angle - move.startAngle));
        const targetDiff = Math.abs(normalizeAngle(move.targetAngle - move.startAngle));
        if (angleDiff >= targetDiff - degToRad(1)) {
          this.setMotorSpeeds(0, 0);
          move.resolve();
          return false;
        }
      }
      return true; // keep waiting
    });
  }
}
```

---

## User Code Execution — An toàn

```typescript
// workers/userCodeRunner.ts

export function runUserCode(code: string, robot: RobotAPI): void {
  // Tạo function từ user code, inject 'robot' vào scope
  // KHÔNG dùng eval trực tiếp — dùng Function constructor
  
  const wrappedCode = `
    'use strict';
    return async function(robot) {
      ${code}
    };
  `;

  try {
    const userFn = new Function(wrappedCode)();
    userFn(robot).catch((err: Error) => {
      self.postMessage({ type: 'USER_CODE_ERROR', payload: { message: err.message } });
    });
  } catch (err) {
    self.postMessage({ type: 'USER_CODE_ERROR', payload: { message: String(err) } });
  }
}

// Các API bị cấm trong worker context (đã tự động bị sandbox):
// - fetch, XMLHttpRequest (origin policy)
// - DOM access (không tồn tại trong worker)
// - localStorage (không tồn tại trong worker)
// Chỉ có: Math, Array, Object, setTimeout... và robot API
```

---

## Message Protocol (Main Thread ↔ Worker)

```typescript
// shared/types/workerMessages.ts

export type MainToWorker =
  | { type: 'START'; payload: { robotSpec: RobotSpec; mazeGrid: MazeGrid; userCode: string } }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'SET_SPEED_MULTIPLIER'; payload: { multiplier: number } }; // 0.5x, 1x, 2x, 4x

export type WorkerToMain =
  | { type: 'STATE_UPDATE'; payload: SimState }
  | { type: 'FINISHED'; payload: { elapsedMs: number; pathRecording: PathPoint[] } }
  | { type: 'USER_CODE_ERROR'; payload: { message: string; line?: number } }
  | { type: 'PHYSICS_ERROR'; payload: { message: string } }
  | { type: 'READY' };
```

---

## Ví dụ User Code (để test)

```javascript
// Thuật toán wall-following đơn giản (left-hand rule)
async function solve(robot) {
  while (true) {
    const front = robot.getSensor('front');
    const left  = robot.getSensor('left');

    if (left > 80) {
      // Không có tường bên trái → quẹo trái
      await robot.turn(-90);
      await robot.move(180); // 1 ô = 180mm
    } else if (front > 80) {
      // Trống phía trước → đi thẳng
      await robot.move(180);
    } else {
      // Bị chặn → quẹo phải
      await robot.turn(90);
    }
  }
}

solve(robot);
```

---

## Lưu ý

- Worker không có access vào DOM hay window — rất an toàn
- Timeout: nếu user code chạy quá 30s không đến đích → tự động dừng và báo lỗi
- `speed multiplier`: nhân số lượng ticks xử lý mỗi frame để sim nhanh hơn, không đổi physics
- Stack overflow trong user code (đệ quy vô hạn) → Worker sẽ crash → main thread nhận `error` event từ Worker, khởi động lại Worker mới
- User code KHÔNG được `import` bất kỳ module nào — chỉ dùng `robot` object và built-ins (Math, Array, v.v.)
