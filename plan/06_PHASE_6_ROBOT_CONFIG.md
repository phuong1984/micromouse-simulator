# Phase 6 — Robot Config UI

> **Goal**: User tùy chỉnh robot (base, motors, wheels, sensors) qua UI. Config ảnh hưởng simulation.
> **Ước tính**: 8h
> **Input**: Phase 0 (types, presets), Phase 1 (layout)
> **Output**: Config panel hoạt động, SVG preview, CRUD components

---

## Completed: ✅

- [ ] 6.1 — Config panel layout (Tailwind)
- [ ] 6.2 — SVG preview component
- [ ] 6.3 — CRUD: add/remove motors, wheels, sensors
- [ ] 6.4 — Base config fields
- [ ] 6.5 — Validation rules
- [ ] 6.6 — Sensor ID ↔ Blockly dropdown sync
- [ ] 6.7 — Save/load presets
- [ ] 6.8 — Config disabled khi sim running

---

## Task Details

### 6.1 — Config Panel Layout
**Deliverable**: Tab layout: Base / Motors / Wheels / Sensors  
**Ước tính**: 2h

```
┌─────────────────────────────────────┐
│  Robot Configuration                │
├─────────┬─────────┬─────────────────┤
│ Base    │ Motors  │ Preview         │
│ • Width │ [+ Add] │ [Robot SVG]     │
│ • Height│ Motor 1 │                 │
│ • Mass  │   RPM   │ Sensors shown   │
│ • Shape │   Torque│ as colored dots │
├─────────┼─────────┤                 │
│ Wheels  │ Sensors │                 │
│ [+ Add] │ [+ Add] │                 │
│ Wheel 1 │ front ──│                 │
│   Radius│ angle   │                 │
│   Width │ range   │                 │
└─────────┴─────────┴─────────────────┘
```

Tailwind classes cho dark theme tabs, form inputs, spacing.

### 6.2 — SVG Preview
**Deliverable**: Top-down view of robot with sensors  
**Ước tính**: 1.5h

- Draw base rectangle theo `BaseSpec.width` × `BaseSpec.height`
- Draw wheels as rectangles at `WheelSpec.position`
- Draw sensors as colored dots + FOV cone (màu mờ)
- Draw motors as small circles
- **Real-time update**: mỗi khi user thay đổi config → preview cập nhật

### 6.3 — CRUD Components
**Deliverable**: Dynamic add/remove motors, wheels, sensors  
**Ước tính**: 1.5h

- Mỗi motor: form group với `id`, `position.x`, `position.y`, `maxRPM`, `maxTorque`, `gearRatio`
- Mỗi wheel: `id`, `motorId` (dropdown chọn motor), `position`, `radius`, `width`, `frictionCoeff`
- Mỗi sensor: `id`, `type` (dropdown: infrared/ultrasonic), `position`, `angle`, `maxRange`, `fov`, `noiseLevel`

### 6.4 — Base Config Fields
**Deliverable**: Width, height, mass, shape  
**Ước tính**: 45p

Validation:
- Width: 20–200mm
- Height: 20–200mm
- Mass: 10–5000g
- Shape: rectangle | circle

### 6.5 — Validation Rules
**Deliverable**: Validate trước khi Run  
**Ước tính**: 30p

```typescript
function validateRobotSpec(spec: RobotSpec): ValidationError[] {
  const errors = [];
  if (spec.base.width < 20 || spec.base.width > 200)
    errors.push({ field: 'base.width', message: 'Width phải từ 20–200mm' });
  if (spec.motors.length === 0)
    errors.push({ field: 'motors', message: 'Cần ít nhất 1 motor' });
  if (spec.wheels.length === 0)
    errors.push({ field: 'wheels', message: 'Cần ít nhất 1 bánh xe' });
  spec.wheels.forEach(w => {
    if (!spec.motors.find(m => m.id === w.motorId))
      errors.push({ field: `wheel.${w.id}`, message: `Motor '${w.motorId}' không tồn tại` });
  });
  return errors;
}
```

### 6.6 — Sensor ID ↔ Blockly Sync
**Deliverable**: Đổi sensor ID → Blockly dropdown cập nhật  
**Ước tính**: 1h

- Subscribe vào `robotConfigStore`
- Khi sensors thay đổi → regenerate `robot_get_sensor` block options
- Blockly toolbox update dynamic

### 6.7 — Save/Load Presets
**Deliverable**: localStorage persistence, preset selector  
**Ước tính**: 45p

```typescript
function savePreset(name: string, spec: RobotSpec) {
  const presets = JSON.parse(localStorage.getItem('robot-presets') || '{}');
  presets[name] = spec;
  localStorage.setItem('robot-presets', JSON.stringify(presets));
}

function loadPresets(): RobotSpec[] {
  return Object.values(JSON.parse(localStorage.getItem('robot-presets') || '{}'));
}
```

### 6.8 — Config Disabled Khi Running
**Deliverable**: Panels disabled khi `status === 'running' || status === 'paused'`  
**Ước tính**: 30p

---

## Acceptance Criteria

- [ ] Config panel hiển thị đúng, responsive
- [ ] Thay đổi base config → preview SVG cập nhật real-time
- [ ] Thêm/xóa motor, wheel, sensor hoạt động
- [ ] Validation bắt lỗi trước khi Run
- [ ] Thay đổi sensor ID → Blockly dropdown cập nhật
- [ ] Presets lưu/load từ localStorage
- [ ] Config disabled khi simulation running
- [ ] Chạy simulation với custom config → robot di chuyển đúng với thông số mới