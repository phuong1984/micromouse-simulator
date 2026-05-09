# 03 — Physics Engine

## Thư viện: Matter.js

Import: `import Matter from 'matter-js'`

---

## Khởi tạo World

```typescript
// modules/simulation/physicsWorld.ts

import Matter from 'matter-js';

export function createPhysicsWorld(gravity = false) {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 0 },  // 2D top-down, không cần gravity
    positionIterations: 10,
    velocityIterations: 8,
  });

  return engine;
}

// Timestep cố định để đảm bảo deterministic
export const PHYSICS_TIMESTEP_MS = 1000 / 60; // 60fps = ~16.67ms
```

---

## Robot Body

Robot được biểu diễn bằng **1 compound body** gồm:
- 1 rectangular body chính (base)
- Không cần body riêng cho bánh xe ở giai đoạn đầu — tính toán lực từ wheel specs

```typescript
// modules/simulation/robotBody.ts

export interface RobotPhysicsState {
  body: Matter.Body;
  motorSpeeds: Map<string, number>; // motorId → current speed (RPM)
}

export function createRobotBody(spec: RobotSpec): RobotPhysicsState {
  const { width, height, mass } = spec.base;

  // Convert mm → physics units (1mm = 1 unit trong sim, scale khi render)
  const body = Matter.Bodies.rectangle(
    0, 0,           // initial position (sẽ set sau)
    width, height,  // mm
    {
      mass: mass / 1000,  // gram → kg
      frictionAir: 0.05,  // air resistance nhẹ
      restitution: 0.1,   // độ nảy khi va chạm
      label: 'robot',
      collisionFilter: { category: 0x0001, mask: 0x0002 }, // chỉ collide với walls
    }
  );

  return {
    body,
    motorSpeeds: new Map(spec.motors.map(m => [m.id, 0])),
  };
}
```

---

## Motor Model & Drive System

### Differential Drive (2 bánh — chuẩn phổ biến)

```typescript
// modules/simulation/motorModel.ts

export function applyMotorForces(
  engine: Matter.Engine,
  robotState: RobotPhysicsState,
  spec: RobotSpec,
  dt: number  // seconds
) {
  const body = robotState.body;
  const angle = body.angle; // hướng robot hiện tại (radian)

  spec.wheels.forEach(wheel => {
    const motor = spec.motors.find(m => m.id === wheel.motorId)!;
    const targetRPM = robotState.motorSpeeds.get(motor.id) ?? 0;

    // RPM → linear velocity tại vành bánh (mm/s)
    const circumference = 2 * Math.PI * wheel.radius;
    const targetLinearVel = (targetRPM / 60) * circumference; // mm/s

    // Tính lực cần thiết (F = m * a, xấp xỉ)
    // Dùng impulse-based approach: tính velocity change cần thiết
    const wheelWorldPos = localToWorld(body, wheel.position);
    
    // Hướng tiến của bánh = hướng robot
    const forceDir = { x: Math.sin(angle), y: -Math.cos(angle) };
    
    // Giới hạn bởi maxTorque → maxForce
    const maxForce = (motor.maxTorque * motor.gearRatio) / wheel.radius / 1000; // N
    
    // Simple PD controller để đạt target velocity
    const currentVel = dotProduct(body.velocity, forceDir);
    const velError = targetLinearVel / 1000 - currentVel; // convert mm/s → m/s
    const force = Math.min(Math.abs(velError) * 50, maxForce) * Math.sign(velError);
    
    // Apply traction limit (friction)
    const tractionLimit = wheel.frictionCoeff * (spec.base.mass / 1000 / spec.wheels.length) * 9.81;
    const clampedForce = Math.max(-tractionLimit, Math.min(tractionLimit, force));

    Matter.Body.applyForce(body, wheelWorldPos, {
      x: forceDir.x * clampedForce,
      y: forceDir.y * clampedForce,
    });
  });
}

function localToWorld(body: Matter.Body, local: Vector2D): Matter.Vector {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  return {
    x: body.position.x + local.x * cos - local.y * sin,
    y: body.position.y + local.x * sin + local.y * cos,
  };
}

function dotProduct(a: Matter.Vector, b: { x: number; y: number }): number {
  return a.x * b.x + a.y * b.y;
}
```

### Turning (Differential Drive)

```typescript
// Khi 2 bánh có RPM khác nhau → robot quay
// Left motor faster → quay phải, Right faster → quay trái
// Không cần xử lý riêng, applyMotorForces() tự xử lý qua lực lệch nhau
```

---

## Maze Walls → Static Bodies

```typescript
// modules/simulation/physicsWorld.ts

export function addMazeWalls(engine: Matter.Engine, segments: WallSegment[]): Matter.Body[] {
  const wallBodies = segments.map(seg => {
    const body = Matter.Bodies.rectangle(
      seg.x, seg.y,
      seg.width, seg.height,
      {
        isStatic: true,
        label: 'wall',
        restitution: 0.1,
        friction: 0.8,
        collisionFilter: { category: 0x0002, mask: 0x0001 },
      }
    );
    if (seg.angle !== 0) Matter.Body.setAngle(body, seg.angle);
    return body;
  });

  Matter.World.add(engine.world, wallBodies);
  return wallBodies;
}
```

---

## Simulation Tick Loop

```typescript
// modules/simulation/simulationLoop.ts

export function createSimulationLoop(engine: Matter.Engine, onTick: (state: SimState) => void) {
  let lastTime = 0;
  let accumulator = 0;
  let isRunning = false;

  function tick(now: number) {
    if (!isRunning) return;
    
    const delta = Math.min(now - lastTime, 50); // cap để tránh spiral of death
    lastTime = now;
    accumulator += delta;

    // Fixed timestep với interpolation
    while (accumulator >= PHYSICS_TIMESTEP_MS) {
      Matter.Engine.update(engine, PHYSICS_TIMESTEP_MS);
      accumulator -= PHYSICS_TIMESTEP_MS;
    }

    // Emit state sau mỗi frame render
    onTick(extractSimState(engine));
    requestAnimationFrame(tick);
  }

  return {
    start: () => { isRunning = true; lastTime = performance.now(); requestAnimationFrame(tick); },
    stop: () => { isRunning = false; },
    reset: () => { Matter.World.clear(engine.world, false); Matter.Engine.clear(engine); },
  };
}
```

---

## SimState — State trả về mỗi tick

```typescript
// shared/types/simulation.ts

export interface SimState {
  tick: number;                        // frame count
  timestampMs: number;
  robot: {
    x: number;                         // mm
    y: number;                         // mm
    angle: number;                     // radian
    velocityX: number;                 // mm/s
    velocityY: number;                 // mm/s
    angularVelocity: number;           // rad/s
  };
  sensors: Record<string, number>;     // sensorId → distance (mm), -1 nếu ngoài range
  motorRPMs: Record<string, number>;   // motorId → actual RPM
  isFinished: boolean;                 // đã đến goal chưa
  elapsedMs: number;                   // thời gian từ lúc start
}
```

---

## Collision Detection — Goal Check

```typescript
Matter.Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const labels = [pair.bodyA.label, pair.bodyB.label];
    if (labels.includes('robot') && labels.includes('goal-zone')) {
      onGoalReached();
    }
  }
});

// Goal zone là sensor body (isSensor: true) tại vị trí goal cell
const goalBody = Matter.Bodies.rectangle(gx, gy, cellSize * 0.8, cellSize * 0.8, {
  isStatic: true,
  isSensor: true,
  label: 'goal-zone',
});
```

---

## Lưu ý implementation

- Simulation chạy trong **Web Worker**, không phải main thread (xem 05_CODE_SANDBOX.md)
- Matter.js hoạt động tốt trong Worker — không dùng DOM
- Đơn vị: 1 unit = 1mm trong simulation. Renderer sẽ scale theo viewport
- `frictionAir` quan trọng để robot không trượt mãi — tune giá trị này thực nghiệm
- Nếu cần độ chính xác cao hơn → migrate sang Rapier WASM (API tương tự)
