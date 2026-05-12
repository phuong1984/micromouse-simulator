# Phase 5 — Sensor Simulation

> **Goal**: Cảm biến hoạt động, raycasting hiển thị, readings trả về Python API.
> **Ước tính**: 8h
> **Input**: Phase 4 (physics hoạt động), Phase 0 (types)
> **Output**: Sensor rays trên canvas, readings chính xác, Python API trả về distance

---

## Completed: ✅

- [x] 5.1 — castRay() và raySegmentIntersect()
- [x] 5.2 — SensorSimulator class
- [x] 5.3 — Gaussian noise
- [x] 5.4 — FOV multi-ray casting
- [x] 5.5 — Integrate vào tick loop
- [x] 5.6 — Sensors trong SimState
- [x] 5.7 — Render sensor rays trong PixiJS
- [x] 5.8 — Toggle sensor visualization

---

## Task Details

### 5.1 — Ray Casting Algorithms
**Deliverable**: `castRay()` và intersection functions  
**Ước tính**: 1.5h

```typescript
interface Ray {
  origin: { x: number; y: number };
  direction: { x: number; y: number };  // unit vector
}

interface RayHit {
  distance: number;  // mm
  point: { x: number; y: number };
}

function castRay(ray: Ray, wallSegments: WallSegment[], maxRange: number): number {
  let minDist = maxRange + 1;
  for (const seg of wallSegments) {
    const hit = raySegmentIntersect(ray, seg);
    if (hit && hit.distance < minDist) minDist = hit.distance;
  }
  return minDist > maxRange ? -1 : minDist;
}

function raySegmentIntersect(ray: Ray, seg: WallSegment): RayHit | null {
  // Convert WallSegment → 4 corners → 4 edges
  // Test mỗi edge với ray
  // Return closest hit
}

function rayLineSegmentIntersect(ray, a, b): RayHit | null {
  // Standard ray-line segment intersection
  // denom = ray.dir × edge.dir
  // t = distance along ray
  // u = position along edge (0-1)
}
```

### 5.2 — SensorSimulator Class
**Deliverable**: `modules/simulation/sensorSimulator.ts`  
**Ước tính**: 1.5h

```typescript
class SensorSimulator {
  private wallSegments: WallSegment[];
  private spec: RobotSpec;
  
  constructor(spec, wallSegments);
  update(robotX, robotY, robotAngle): Record<string, number>;
  private readSensor(sensor, robotX, robotY, robotAngle): number;
  private addNoise(distance, sensor): number;
}
```

For mỗi sensor:
1. Transform vị trí sensor từ local → world coords
2. Tính hướng ray (robotAngle + sensorAngle)
3. Nếu FOV > 0: cast nhiều rays trong cone
4. Lấy min distance
5. Thêm Gaussian noise

### 5.3 — Gaussian Noise
**Deliverable**: Box-Muller transform  
**Ước tính**: 30p

```typescript
function gaussianRandom(mean: number, stddev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Usage: noise stddev = distance * sensor.noiseLevel
function addNoise(distance, sensor) {
  if (distance < 0) return -1;
  const stddev = distance * sensor.noiseLevel;
  return Math.max(0, Math.round(distance + gaussianRandom(0, stddev)));
}
```

### 5.4 — FOV Multi-Ray Casting
**Deliverable**: Multiple rays per sensor  
**Ước tính**: 1h

```typescript
const numRays = sensor.fov > 0 ? 5 : 1;
let minDist = sensor.maxRange + 1;

for (let i = 0; i < numRays; i++) {
  const spreadAngle = numRays === 1 ? 0 :
    degToRad(sensor.fov) * ((i / (numRays - 1)) - 0.5);
  const rayAngle = worldAngle + spreadAngle;
  // Cast ray, take min
}
```

### 5.5 — Tick Loop Integration
**Deliverable**: Sensor update trong tick loop  
**Ước tính**: 30p

Trong tick function (Phase 4):
```typescript
// Sau physics step, trước postMessage
const sensorReadings = sensorSim.update(x, y, angle);
```

### 5.6 — SimState Sensors Field
**Deliverable**: Type `sensors: Record<string, number>`  
**Ước tính**: 30p

```typescript
interface SimState {
  // ...existing fields...
  sensors: Record<string, number>;  // sensorId → distance (mm), -1 nếu ngoài range
}
```

### 5.7 — Render Sensor Rays (PixiJS)
**Deliverable**: `renderer.drawSensorRays()`  
**Ước tính**: 1.5h

```typescript
private drawSensorRays(state: SimState, spec: RobotSpec) {
  const g = this.sensorRays;
  g.clear();
  const sc = this.scale;
  
  spec.sensors.forEach(sensor => {
    const dist = state.sensors[sensor.id] ?? -1;
    const worldAngle = degToRad(sensor.angle);  // relative to robot heading
    const rayLength = dist > 0 ? dist * sc : sensor.maxRange * sc;
    const color = dist > 0 ? 0xff4444 : 0x44ff44;
    
    // Calculate end point
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
```

**Visualization colors**:
- Green (`0x44ff44`): không phát hiện tường (trong range)
- Red (`0xff4444`): phát hiện tường (hit)

### 5.8 — Toggle UI
**Deliverable**: Checkbox "Hiển thị sensor rays"  
**Ước tính**: 30p

---

## Post-Implementation Improvements

- `get_sensor` changed from cache-based → on-the-fly computation (returns real-time reading even before first tick)
- Removed verbose debug logging: `[stop]`, `[set_motor_speeds]`, collision wall logging
- Added periodic sensor logging for keyboard test mode (`[sensors] front=xx left=yy right=zz` every 1s)
- Label changed from Vietnamese → English: "Show sensor rays"

---

## Acceptance Criteria

- [x] Sensor rays hiển thị đúng hướng, đúng chiều dài
- [x] Raycast trả về khoảng cách chính xác (so với thực tế mê cung)
- [x] Noise hoạt động — readings dao động nhẹ
- [x] FOV > 0: nhiều rays cast trong cone
- [x] Python: `robot.get_sensor('front')` trả về số chính xác (mm)
- [x] Python: `robot.get_sensor('left')` trả về -1 khi không có tường
- [x] Toggle hiển thị/ẩn sensor rays hoạt động
- [x] Performance: raycasting không gây lag (60fps)
- [x] `npm run build` ✅, `npm run lint` ✅

---

## Notes

- Wall segments dùng cho raycasting phải được lưu trữ để tái sử dụng (không cần tạo lại mỗi tick)
- Cần handle edge case: sensor ở góc tường, sensor nhìn xuyên khe hở giữa 2 wall segments
- `maxRange = -1` trong reading → user code handle trường hợp không thấy tường