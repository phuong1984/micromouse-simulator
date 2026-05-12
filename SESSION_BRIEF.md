# Session Brief

> Fill this before each coding session. Đây là file đầu tiên AI agent đọc để biết mục tiêu.

---

- **Date**: 2026-05-12
- **Current Phase**: Phase 6 — Robot Config UI
- **Phase Plan**: `plan/06_PHASE_6_ROBOT_CONFIG.md`
- **Current Tasks**: 6.1 → 6.8

## Last Session Recap

**Phase 5 hoàn tất — Sensor Simulation (2026-05-12).**

**What was done:**
- `sensorSimulator.ts` — ray casting, Box-Muller noise, FOV multi-ray, `get_sensor` on-the-fly
- Worker integration — SensorSimulator in tick loop, sensor readings in STATE_UPDATE
- Renderer — `drawSensorRays()` xanh/đỏ + dot tại hit point
- Toggle — "Show sensor rays" checkbox
- Cleanup — removed `[stop]`, `[set_motor_speeds]`, collision debug logs

**State hiện tại:**
- `npm run build` ✅, `npm run lint` ✅
- Robot di chuyển + sensor rays visualization + Python API returns real mm readings
- Motor model + sensor model đều data-driven từ RobotSpec

## Today's Goal

Bắt đầu Phase 6 — Robot Config UI:
- 6.1: Config panel layout (tabs: Base / Motors / Wheels / Sensors)
- 6.2: SVG preview component (top-down robot view)
- 6.3: CRUD add/remove motors, wheels, sensors
- 6.4: Base config fields + validation
- 6.5: Validation rules before Run
- 6.6: Sensor ID ↔ Blockly dropdown sync
- 6.7: Save/load presets (localStorage)
- 6.8: Config disabled khi sim running

## Starting Point

- `npm run build` pass, `npm run lint` pass
- Phase 5 hoàn tất: physics + sensors + Python API
- Config panel hiện tại là empty `<aside>`:

```html
<aside className="config-panel p-4">
  <h2 className="text-white text-lg font-bold">Robot Config</h2>
</aside>
```

## Blockers

- None

## Notes

- Cần tạo `robotConfigStore` (Zustand) cho config state
- Simulation store cần lấy `robotSpec` từ config store thay vì `DEFAULT_ROBOT` hardcoded
- SVG preview có thể dùng inline SVG hoặc PixiJS (prefer inline SVG cho đơn giản)
- Dynamic Blockly dropdown: update toolbox khi sensor IDs thay đổi
