# Phase 4 — Physics Engine & Simulation Loop

> **Goal**: Vật lý robot hoạt động, tick loop chạy mượt, robot di chuyển đúng.
> **Ước tính**: 10h (+2h bug fixes)
> **Input**: Phase 3 (MicroPython load được), Phase 0 (types, presets)
> **Output**: Robot di chuyển, va chạm, goal detection

---

## Completed: ✅

- [x] 4.1 — createPhysicsWorld()
- [x] 4.2 — createRobotBody(spec)
- [x] 4.3 — addMazeWalls(engine, segments)
- [x] 4.4 — applyMotorForces()
- [x] 4.5 — Fixed timestep tick loop
- [x] 4.6 — Keyboard control (temp)
- [x] 4.7 — Goal detection
- [x] 4.8 — Integrate MicroPython sync

## Bugs Fixed During Phase 4

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | Robot không di chuyển | `Matter.Composite.add(engine.world, body)` missing | Added line in `initPhysics()` |
| 2 | Maze walls sai vị trí | `mazeToWallSegments`: thiếu north boundary, sai south/east centers | Fixed coordinate math |
| 3 | Renderer walls sai | Boundary walls vẽ sai offsets | Fixed `drawWalls` boundary logic |
| 4 | Robot xuyên tường (quá nhanh) | Matter.js Verlet: `Δv = F/m·dt²` (dt=16.67ms, dt²=277.78) | Scaled force by dtSq in PD controller |
| 5 | Robot không quay | Wheel positions đặt ở Y-offset thay vì X-offset | Changed `y`→`x` in `motorModel.ts:63-65` |
| 6 | Bogus angular damping | `setAngularVelocity(body, av·0.95)` bị Body.update ghi đè | Removed line (vô hiệu + gây instability) |
| 7 | Robot quay/di chuyển quá chậm | `maxTorque=1.5` quá nhỏ (terminal ~90 mm/s) | Tăng lên 10 (terminal ~600 mm/s) |
| 8 | RPM values hardcoded | Magic numbers 2400, 1200, 600 trong worker + toolbox | Định nghĩa hằng số: `FORWARD_RPM`, `TURN_RPM`, `DIAGONAL_INNER_RPM` |

---

## Architecture

### Data Flow
```
Keyboard / MicroPython API
        │ set motor speeds (RPM)
        ▼
MotorModel.applyMotorForces()
  ├─── RPM → targetLinearVel (mm/s) → targetPerTick (mm/tick)
  ├─── dot(body.velocity, forceDir) → currentPerTick
  ├─── PD: Kp·error·mass/dtSq → force
  ├─── Clamp: ±maxTorque/radius/dtSq
  └─── Body.applyForce(wheelWorldPos, forceDir·clampedForce)
        │
        ▼
Matter.Engine.update()
  ├─── Body.update: velocity = velocity·frictionAir + F/m·dt²
  ├─── Collision detection
  └─── Position integration
        │
        ▼
checkPendingMoves() → resolve Promise when distance/angle reached
        │
        ▼
postMessage({ type: 'STATE_UPDATE', payload })
```

### Key Constants
```typescript
// physicsWorld.ts
PHYSICS_TIMESTEP_MS = 1000 / 60;  // ~16.67ms, 60fps

// simulation.worker.ts
FORWARD_RPM = 1200;       // forward/backward move speed
TURN_RPM = 1200;          // in-place rotation speed
DIAGONAL_INNER_RPM = 600; // inner wheel during diagonal

// robotBody.ts
frictionAir = 0.12;       // Matter.js air friction

// robot-presets.ts
maxTorque = 10;   // N·mm per motor
maxSpeed = 500;   // RPM (≈785 mm/s theoretical)
radius = 15;      // mm
distanceFromCenter = 35;  // mm
```

---

## Acceptance Criteria

- [x] Matter.js engine tạo thành công trong Worker
- [x] Robot body di chuyển khi set motor speeds
- [x] Va chạm với walls — robot dừng lại (không xuyên tường)
- [x] Goal detection hoạt động
- [x] Tick loop chạy ổn định 60fps
- [x] State postMessage từ Worker → Main thread mỗi tick
- [x] Renderer update position từ SimState
- [x] Keyboard control (tạm) hoạt động
- [x] Motor model data-driven (đọc từ RobotSpec, sẵn sàng cho Phase 6)
- [x] RPM constants centralized (đổi 1 dòng là thay đổi toàn bộ tốc độ)
- [x] `npm run build` ✅, `npm run lint` ✅