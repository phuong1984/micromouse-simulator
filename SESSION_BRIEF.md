# Session Brief

> Fill this before each coding session. Đây là file đầu tiên AI agent đọc để biết mục tiêu.

---

- **Date**: 2026-05-11
- **Current Phase**: Phase 4 — Physics Engine & Simulation Loop
- **Phase Plan**: `plan/04_PHASE_4_PHYSICS.md`
- **Current Tasks**: 4.1 → 4.8

## Last Session Recap

Phase 3 (MicroPython Execution Engine) đã hoàn tất:
- MicroPython WASM load trong Web Worker (446KB, `worker.format: 'es'`)
- Robot API bridge qua `registerJsModule('robot', ...)` — 8 sync stub functions
- Code execution qua `runPythonAsync` + auto `import robot`
- SimStatus Zustand: `idle → running → finished/error`
- Run ▶ / Stop ⏹ / Reset ↺ buttons
- ConsolePanel hiển thị log từ Worker stdout + robot API logs + errors
- `npm run lint` ✅, `npm run build` ✅

## Today's Goal

Bắt đầu Phase 4 — Physics Engine & Simulation Loop:
- Task 4.1: `createPhysicsWorld()` — Matter.js engine không gravity
- Task 4.2: `createRobotBody(spec)` — compound body từ RobotSpec
- Task 4.3: `addMazeWalls(engine, segments)` — static wall bodies
- Task 4.4: `applyMotorForces()` — differential drive model
- Task 4.5: Fixed timestep tick loop (60fps)
- Task 4.6: Keyboard control (tạm) để test physics
- Task 4.7: Goal detection (collision → FINISHED)
- Task 4.8: Integrate MicroPython sync (Promise-based robot API)

## Starting Point
<!-- Check: npm run dev works? Files created? -->

- `npm run build` pass
- `npm run lint` pass (0 errors)
- Phase 3 hoàn tất, Phase 4 sẵn sàng

## Blockers

- Matter.js trong Worker (không dùng DOM)?
- PD controller tuning cho differential drive?
- Timing: tick loop + MicroPython async bridge?

## Notes

- Tất cả logic physics trong Worker (không block UI)
- Robot API stub ở Phase 3 sẽ được thay bằng Promise-based (await physics tick)
- Keyboard control chỉ toggle motor speeds tạm, không qua MicroPython
- Goal zone = sensor body tại ô goal, isStatic + isSensor