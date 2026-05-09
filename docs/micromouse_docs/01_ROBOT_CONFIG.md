# 01 — Robot Configuration Module

## Mục tiêu module

Cho phép người dùng tạo và lưu cấu hình robot micromouse. Mọi tham số vật lý của robot đều được mô tả bởi type `RobotSpec` — đây là nguồn sự thật duy nhất cho simulation engine.

---

## TypeScript Types

```typescript
// shared/types/robot.ts

export interface RobotSpec {
  id: string;
  name: string;
  base: BaseSpec;
  motors: MotorSpec[];
  wheels: WheelSpec[];
  sensors: SensorSpec[];
}

export interface BaseSpec {
  width: number;       // mm — chiều ngang robot
  height: number;      // mm — chiều dọc robot  
  mass: number;        // gram
  shape: 'rectangle' | 'circle';
}

export interface MotorSpec {
  id: string;
  position: Vector2D;   // mm, relative to robot center
  maxRPM: number;       // vòng/phút tối đa
  maxTorque: number;    // N·mm — moment xoắn tối đa
  gearRatio: number;    // tỉ số truyền động
}

export interface WheelSpec {
  id: string;
  motorId: string;      // motor nào dẫn động bánh này
  position: Vector2D;   // mm, relative to robot center
  radius: number;       // mm — bán kính bánh
  width: number;        // mm — bề rộng bánh
  frictionCoeff: number; // 0.0 – 1.0, độ bám đường
}

export interface SensorSpec {
  id: string;           // user-facing name, dùng trong code: getSensor('front')
  type: 'infrared' | 'ultrasonic';
  position: Vector2D;   // mm, relative to robot center
  angle: number;        // độ, 0 = thẳng trước, 90 = phải, -90 = trái
  maxRange: number;     // mm — tầm đo tối đa
  fov: number;          // độ — field of view (góc cone)
  noiseLevel: number;   // 0.0 – 1.0, mức nhiễu tín hiệu
}

export interface Vector2D {
  x: number;
  y: number;
}
```

---

## Preset mặc định

```typescript
// shared/constants/robot-presets.ts

export const DEFAULT_ROBOT: RobotSpec = {
  id: 'default',
  name: 'Basic Micromouse',
  base: {
    width: 80,    // 8cm
    height: 80,   // 8cm
    mass: 150,    // 150g
    shape: 'rectangle',
  },
  motors: [
    {
      id: 'motor-left',
      position: { x: -30, y: 0 },
      maxRPM: 3000,
      maxTorque: 50,
      gearRatio: 10,
    },
    {
      id: 'motor-right',
      position: { x: 30, y: 0 },
      maxRPM: 3000,
      maxTorque: 50,
      gearRatio: 10,
    },
  ],
  wheels: [
    {
      id: 'wheel-left',
      motorId: 'motor-left',
      position: { x: -30, y: 0 },
      radius: 15,
      width: 8,
      frictionCoeff: 0.8,
    },
    {
      id: 'wheel-right',
      motorId: 'motor-right',
      position: { x: 30, y: 0 },
      radius: 15,
      width: 8,
      frictionCoeff: 0.8,
    },
  ],
  sensors: [
    { id: 'front', type: 'infrared', position: { x: 0, y: 40 }, angle: 0, maxRange: 200, fov: 15, noiseLevel: 0.05 },
    { id: 'left', type: 'infrared', position: { x: -40, y: 0 }, angle: -90, maxRange: 200, fov: 15, noiseLevel: 0.05 },
    { id: 'right', type: 'infrared', position: { x: 40, y: 0 }, angle: 90, maxRange: 200, fov: 15, noiseLevel: 0.05 },
    { id: 'front-left', type: 'infrared', position: { x: -20, y: 35 }, angle: -45, maxRange: 150, fov: 15, noiseLevel: 0.05 },
    { id: 'front-right', type: 'infrared', position: { x: 20, y: 35 }, angle: 45, maxRange: 150, fov: 15, noiseLevel: 0.05 },
  ],
};
```

---

## UI Config Panel

### Layout

```
┌─────────────────────────────────────────────┐
│  Robot Configuration                        │
├────────────┬────────────┬───────────────────┤
│  Base      │  Motors    │  Preview          │
│  • Width   │  [+ Add]   │                   │
│  • Height  │  Motor 1 ▾ │   [Robot SVG      │
│  • Mass    │    RPM     │    top-down view] │
│  • Shape   │    Torque  │                   │
├────────────┼────────────┤   Sensors shown   │
│  Wheels    │  Sensors   │   as colored dots │
│  [+ Add]   │  [+ Add]   │                   │
│  Wheel 1 ▾ │  front ▾   │                   │
│    Radius  │    angle   │                   │
│    Friction│    range   │                   │
└────────────┴────────────┴───────────────────┘
```

### Preview component

- Vẽ SVG top-down view của robot theo đúng tỉ lệ `BaseSpec.width` × `BaseSpec.height`
- Mỗi `SensorSpec` hiện là dot màu + mũi tên hướng góc + cone FOV mờ
- Mỗi `WheelSpec` hiện là hình chữ nhật ở đúng vị trí `position`
- Preview cập nhật real-time khi user thay đổi config

### Validation rules

```typescript
// Kiểm tra trước khi cho phép chạy simulation
function validateRobotSpec(spec: RobotSpec): ValidationError[] {
  const errors: ValidationError[] = [];

  if (spec.base.width < 20 || spec.base.width > 200)
    errors.push({ field: 'base.width', message: 'Width phải từ 20–200mm' });

  if (spec.motors.length === 0)
    errors.push({ field: 'motors', message: 'Cần ít nhất 1 motor' });

  if (spec.wheels.length === 0)
    errors.push({ field: 'wheels', message: 'Cần ít nhất 1 bánh xe' });

  spec.wheels.forEach(w => {
    if (!spec.motors.find(m => m.id === w.motorId))
      errors.push({ field: `wheel.${w.id}.motorId`, message: `Motor '${w.motorId}' không tồn tại` });
  });

  return errors;
}
```

---

## State Management (Zustand)

```typescript
// modules/robot-config/store.ts

interface RobotConfigStore {
  spec: RobotSpec;
  savedPresets: RobotSpec[];

  updateBase: (base: Partial<BaseSpec>) => void;
  addMotor: () => void;
  updateMotor: (id: string, data: Partial<MotorSpec>) => void;
  removeMotor: (id: string) => void;
  addWheel: () => void;
  updateWheel: (id: string, data: Partial<WheelSpec>) => void;
  removeWheel: (id: string) => void;
  addSensor: () => void;
  updateSensor: (id: string, data: Partial<SensorSpec>) => void;
  removeSensor: (id: string) => void;
  loadPreset: (preset: RobotSpec) => void;
  savePreset: (name: string) => void;
}
```

---

## Lưu ý implementation

- `RobotSpec` serialize được sang JSON hoàn toàn — lưu vào localStorage hoặc URL params để share
- Khi user thay đổi sensor `id`, phải validate không trùng — vì user code dùng id này để gọi `getSensor('front')`
- Motor và wheel liên kết qua `motorId` — khi xóa motor phải cảnh báo nếu có wheel đang dùng nó
- Tất cả đơn vị đo là **mm** và **gram** trong config, simulation engine sẽ convert sang SI (m, kg)
