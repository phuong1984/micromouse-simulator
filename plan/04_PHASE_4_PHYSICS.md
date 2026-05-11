# Phase 4 — Physics Engine & Simulation Loop

> **Goal**: Vật lý robot hoạt động, tick loop chạy mượt, robot di chuyển đúng.
> **Ước tính**: 8h
> **Input**: Phase 3 (MicroPython load được), Phase 0 (types, presets)
> **Output**: Robot di chuyển, va chạm, goal detection

---

## Completed: ✅

- [ ] 4.1 — createPhysicsWorld()
- [ ] 4.2 — createRobotBody(spec)
- [ ] 4.3 — addMazeWalls(engine, segments)
- [ ] 4.4 — applyMotorForces()
- [ ] 4.5 — Fixed timestep tick loop
- [ ] 4.6 — Keyboard control (temp)
- [ ] 4.7 — Goal detection
- [ ] 4.8 — Integrate MicroPython sync

---

## Task Details

### 4.1 — createPhysicsWorld()
**Deliverable**: Matter.js engine, gravity=0  
**Ước tính**: 30p

```typescript
import Matter from 'matter-js';

export function createPhysicsWorld() {
  return Matter.Engine.create({
    gravity: { x: 0, y: 0 },
    positionIterations: 10,
    velocityIterations: 8,
  });
}

export const PHYSICS_TIMESTEP_MS = 1000 / 60; // ~16.67ms
```

### 4.2 — createRobotBody(spec)
**Deliverable**: Rectangle body from RobotSpec  
**Ước tính**: 1h

```typescript
export interface RobotPhysicsState {
  body: Matter.Body;
  motorSpeeds: Map<string, number>;
}

export function createRobotBody(spec: RobotSpec): RobotPhysicsState {
  const body = Matter.Bodies.rectangle(
    0, 0,
    spec.base.width,    // mm
    spec.base.height,   // mm
    {
      mass: spec.base.mass / 1000,  // gram → kg
      frictionAir: 0.05,
      restitution: 0.1,
      label: 'robot',
      collisionFilter: { category: 0x0001, mask: 0x0002 },
    }
  );
  
  return {
    body,
    motorSpeeds: new Map(spec.motors.map(m => [m.id, 0])),
  };
}
```

**Note**: All mm values. Renderer scales to pixels.

### 4.3 — addMazeWalls(engine, segments)
**Deliverable**: Static bodies from WallSegments  
**Ước tính**: 30p

```typescript
export function addMazeWalls(engine, segments) {
  const wallBodies = segments.map(seg => 
    Matter.Bodies.rectangle(seg.x, seg.y, seg.width, seg.height, {
      isStatic: true,
      label: 'wall',
      restitution: 0.1,
      friction: 0.8,
      collisionFilter: { category: 0x0002, mask: 0x0001 },
    })
  );
  
  // Goal zone (sensor body)
  const goalBody = Matter.Bodies.rectangle(
    goalX, goalY, cellSize * 0.8, cellSize * 0.8, {
      isStatic: true,
      isSensor: true,
      label: 'goal-zone',
    }
  );
  
  Matter.World.add(engine.world, [...wallBodies, goalBody]);
}
```

### 4.4 — applyMotorForces()
**Deliverable**: Differential drive model  
**Ước tính**: 2h

Algorithm from `03_PHYSICS_ENGINE.md`:
1. RPM → linear velocity at wheel edge: `v = (RPM/60) × 2πr`
2. PD controller to reach target velocity
3. Traction limit based on friction coefficient
4. Apply force at wheel position in robot's forward direction

```typescript
export function applyMotorForces(engine, robotState, spec, dt) {
  const body = robotState.body;
  const angle = body.angle;
  
  spec.wheels.forEach(wheel => {
    const motor = spec.motors.find(m => m.id === wheel.motorId);
    const targetRPM = robotState.motorSpeeds.get(motor.id) ?? 0;
    
    const circumference = 2 * Math.PI * wheel.radius;
    const targetLinearVel = (targetRPM / 60) * circumference; // mm/s
    
    const forceDir = { x: Math.sin(angle), y: -Math.cos(angle) };
    const maxForce = (motor.maxTorque * motor.gearRatio) / wheel.radius / 1000;
    
    const currentVel = dot(body.velocity, forceDir);
    const velError = targetLinearVel / 1000 - currentVel;
    let force = Math.min(Math.abs(velError) * 50, maxForce) * Math.sign(velError);
    
    const tractionLimit = wheel.frictionCoeff * (spec.base.mass / 1000 / spec.wheels.length) * 9.81;
    force = Math.max(-tractionLimit, Math.min(tractionLimit, force));
    
    const worldPos = localToWorld(body, wheel.position);
    Matter.Body.applyForce(body, worldPos, {
      x: forceDir.x * force,
      y: forceDir.y * force,
    });
  });
}
```

### 4.5 — Fixed Timestep Tick Loop
**Deliverable**: 60fps simulation loop  
**Ước tính**: 1h

```typescript
let lastTime = 0;
let accumulator = 0;
let isRunning = false;

function tick(now) {
  if (!isRunning) return;
  
  const delta = Math.min(now - lastTime, 50);
  lastTime = now;
  accumulator += delta;
  
  while (accumulator >= PHYSICS_TIMESTEP_MS) {
    // 1. Apply motor forces
    applyMotorForces(engine, robotState, spec, PHYSICS_TIMESTEP_MS / 1000);
    // 2. Physics step
    Matter.Engine.update(engine, PHYSICS_TIMESTEP_MS);
    // 3. Sensor update
    const readings = sensorSim.update(robotState.body.position.x, robotState.body.position.y, robotState.body.angle);
    // 4. Check pending moves (from MicroPython)
    robotAPI.tick(PHYSICS_TIMESTEP_MS);
    // 5. Post state
    const simState = extractSimState(engine, readings);
    self.postMessage({ type: 'STATE_UPDATE', payload: simState });
    // 6. Check goal
    checkGoal(robotState.body);
    
    accumulator -= PHYSICS_TIMESTEP_MS;
  }
  
  setTimeout(tick, 0);
}
```

### 4.6 — Keyboard Control (Temp)
**Deliverable**: Arrow keys → motor speeds  
**Ước tính**: 1h

```typescript
// Only for testing in Phase 4
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':    setMotors(2400, 2400); break;
    case 'ArrowDown':  setMotors(-2400, -2400); break;
    case 'ArrowLeft':  setMotors(-1200, 1200); break;
    case 'ArrowRight': setMotors(1200, -1200); break;
  }
});
```

### 4.7 — Goal Detection
**Deliverable**: Collision with goal zone triggers FINISHED  
**Ước tính**: 30p

```typescript
Matter.Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const labels = [pair.bodyA.label, pair.bodyB.label];
    if (labels.includes('robot') && labels.includes('goal-zone')) {
      isRunning = false;
      postMessage({ type: 'FINISHED', payload: { elapsedMs } });
    }
  }
});
```

### 4.8 — MicroPython Sync
**Deliverable**: Pending moves check mỗi tick  
**Ước tính**: 45p

Tick function check:
- **Distance move**: traveled distance ≥ target ± 0.5mm → stop motors, resolve promise
- **Angle turn**: angle diff ≥ target ± 1° → stop motors, resolve promise

```typescript
function checkPendingMoves(currentState, robotAPI) {
  robotAPI.pendingMoves = robotAPI.pendingMoves.filter(move => {
    if (move.type === 'distance') {
      const dx = currentState.x - move.startX;
      const dy = currentState.y - move.startY;
      const traveled = Math.sqrt(dx * dx + dy * dy);
      if (traveled >= move.targetDistance - 0.5) {
        robotState.motorSpeeds.set(move.leftMotorId, 0);
        robotState.motorSpeeds.set(move.rightMotorId, 0);
        move.resolve();
        return false;
      }
    } else if (move.type === 'angle') {
      const diff = Math.abs(normalizeAngle(currentState.angle - move.startAngle));
      if (diff >= move.targetDiff - degToRad(1)) {
        // stop motors
        move.resolve();
        return false;
      }
    }
    return true;
  });
}
```

---

## Acceptance Criteria

- [ ] Matter.js engine tạo thành công trong Worker
- [ ] Robot body di chuyển khi set motor speeds
- [ ] Va chạm với walls — robot dừng lại (không xuyên tường)
- [ ] Goal detection hoạt động
- [ ] Tick loop chạy ổn định 60fps
- [ ] State postMessage từ Worker → Main thread mỗi tick
- [ ] Renderer update position từ SimState
- [ ] Keyboard control (tạm) hoạt động