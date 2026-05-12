# Session Brief

> Fill this before each coding session. Đây là file đầu tiên AI agent đọc để biết mục tiêu.

---

- **Date**: 2026-05-12
- **Current Phase**: Phase 5 — Sensor Simulation
- **Phase Plan**: `plan/05_PHASE_5_SENSORS.md`
- **Current Tasks**: 5.1 → 5.8

## Last Session Recap

**Phase 4 hoàn tất — tất cả bug fixes và cleanup done (2026-05-12).**

**Bugs fixed:**
1. Robot body không được add vào Matter.js world (missing `Composite.add`)
2. Matter.js Verlet dt² scaling — force phải scale với dtSq=277.78
3. Wheel positions trên Y-offset → đúng X-offset cho differential drive
4. `setAngularVelocity` damping vô hiệu, bị Body.update ghi đè — removed
5. `maxTorque` 1.5→10 N·mm (terminal 90→600 mm/s)
6. RPM magic numbers → constants (`FORWARD_RPM`, `TURN_RPM`, `DIAGONAL_INNER_RPM`)
7. Blockly defaults 2400→1200 RPM

**State hiện tại:**
- `npm run build` ✅, `npm run lint` ✅
- Robot di chuyển, quay tại tâm, va chạm tường, goal detection
- Motor model data-driven (sẵn sàng cho Phase 6 Robot Config)
- SensorSimulator là stub — sẵn sàng cho Phase 5

## Today's Goal

Bắt đầu Phase 5 — Sensor Simulation:
- Task 5.1: `castRay()` và `raySegmentIntersect()` — ray casting math
- Task 5.2: `SensorSimulator` class — wallSegments + robot spec
- Task 5.3: Gaussian noise (Box-Muller) cho readings
- Task 5.4: FOV multi-ray casting trong cone
- Task 5.5: Integrate sensorSim vào tick loop
- Task 5.6: sensors field trong SimState
- Task 5.7: Draw sensor rays trong PixiJS renderer
- Task 5.8: Toggle checkbox "Hiển thị sensor rays"

## Starting Point

- `npm run build` pass
- `npm run lint` pass (0 errors)
- Phase 4 physics hoạt động: robot di chuyển, va chạm, goal detection
- Worker message protocol đã stable

## Blockers

- Need deterministic ray-tracing (không dùng `Math.random` cho noise nếu muốn deterministic replay)

## Notes

- Wall segments từ `mazeToWallSegments()` — cần lưu để reuse trong raycasting
- Noise: deterministic seed nếu replay yêu cầu (optional, có thể thêm sau)
- Sensor rays render trong PixiJS overlay layer
- Python API `robot.get_sensor(id)` trả về distance mm