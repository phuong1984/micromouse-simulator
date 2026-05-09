# 04 — Sensor Simulation

## Mục tiêu

Mô phỏng tín hiệu cảm biến dựa trên trạng thái vật lý của robot và maze. Sensor readings phải được tính mỗi physics tick và trả về cho user code qua Robot API.

---

## Kiến trúc tổng quan

```
[Robot position + angle] + [Maze wall segments]
           ↓
   SensorSimulator.update(simState)
           ↓
   Raycast từng sensor theo góc cấu hình
           ↓
   Thêm noise
           ↓
   Record<sensorId, distanceMM> → gắn vào SimState
```

---

## Raycasting — IR / Ultrasonic Sensor

```typescript
// modules/simulation/sensorSimulator.ts

export interface Ray {
  origin: { x: number; y: number };
  direction: { x: number; y: number }; // unit vector
}

export interface RayHit {
  distance: number; // mm
  point: { x: number; y: number };
}

/**
 * Cast một ray, trả về khoảng cách đến wall segment gần nhất
 */
export function castRay(ray: Ray, wallSegments: WallSegment[], maxRange: number): number {
  let minDist = maxRange + 1;

  for (const seg of wallSegments) {
    const hit = raySegmentIntersect(ray, seg);
    if (hit && hit.distance < minDist) {
      minDist = hit.distance;
    }
  }

  return minDist > maxRange ? -1 : minDist; // -1 = không có gì trong range
}

/**
 * Tính giao điểm ray và wall segment (AABB approach)
 */
function raySegmentIntersect(ray: Ray, seg: WallSegment): RayHit | null {
  // Convert WallSegment → 4 line segments rồi test intersection
  const halfW = seg.width / 2;
  const halfH = seg.height / 2;
  const corners = [
    { x: seg.x - halfW, y: seg.y - halfH },
    { x: seg.x + halfW, y: seg.y - halfH },
    { x: seg.x + halfW, y: seg.y + halfH },
    { x: seg.x - halfW, y: seg.y + halfH },
  ];

  const edges = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]],
  ];

  let closest: RayHit | null = null;
  for (const [a, b] of edges) {
    const hit = rayLineSegmentIntersect(ray, a, b);
    if (hit && (!closest || hit.distance < closest.distance)) {
      closest = hit;
    }
  }
  return closest;
}

function rayLineSegmentIntersect(
  ray: Ray,
  a: { x: number; y: number },
  b: { x: number; y: number }
): RayHit | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const denom = ray.direction.x * dy - ray.direction.y * dx;
  if (Math.abs(denom) < 1e-10) return null; // parallel

  const t = ((a.x - ray.origin.x) * dy - (a.y - ray.origin.y) * dx) / denom;
  const u = ((a.x - ray.origin.x) * ray.direction.y - (a.y - ray.origin.y) * ray.direction.x) / denom;

  if (t < 0 || u < 0 || u > 1) return null; // behind ray or outside segment

  return {
    distance: t,
    point: { x: ray.origin.x + ray.direction.x * t, y: ray.origin.y + ray.direction.y * t },
  };
}
```

---

## SensorSimulator Class

```typescript
// modules/simulation/sensorSimulator.ts

export class SensorSimulator {
  private wallSegments: WallSegment[];
  private spec: RobotSpec;
  private lastReadings: Record<string, number> = {};

  constructor(spec: RobotSpec, wallSegments: WallSegment[]) {
    this.spec = spec;
    this.wallSegments = wallSegments;
  }

  update(robotX: number, robotY: number, robotAngle: number): Record<string, number> {
    const readings: Record<string, number> = {};

    for (const sensor of this.spec.sensors) {
      readings[sensor.id] = this.readSensor(sensor, robotX, robotY, robotAngle);
    }

    this.lastReadings = readings;
    return readings;
  }

  private readSensor(
    sensor: SensorSpec,
    robotX: number,
    robotY: number,
    robotAngle: number
  ): number {
    // Transform sensor position từ local → world
    const worldPos = localToWorld({ x: robotX, y: robotY }, robotAngle, sensor.position);

    // Góc cảm biến trong world space (radian)
    const worldAngle = robotAngle + degToRad(sensor.angle);

    // Tạo primary ray
    const primaryRay: Ray = {
      origin: worldPos,
      direction: { x: Math.sin(worldAngle), y: -Math.cos(worldAngle) },
    };

    // Với FOV > 0: cast nhiều rays trong cone, lấy min distance
    const numRays = sensor.fov > 0 ? 5 : 1;
    let minDist = sensor.maxRange + 1;

    for (let i = 0; i < numRays; i++) {
      const spreadAngle = numRays === 1 ? 0 :
        degToRad(sensor.fov) * ((i / (numRays - 1)) - 0.5);
      const rayAngle = worldAngle + spreadAngle;
      const ray: Ray = {
        origin: worldPos,
        direction: { x: Math.sin(rayAngle), y: -Math.cos(rayAngle) },
      };
      const dist = castRay(ray, this.wallSegments, sensor.maxRange);
      if (dist > 0 && dist < minDist) minDist = dist;
    }

    const rawDist = minDist > sensor.maxRange ? -1 : minDist;

    // Thêm Gaussian noise
    return this.addNoise(rawDist, sensor);
  }

  private addNoise(distance: number, sensor: SensorSpec): number {
    if (distance < 0) return -1;
    // Gaussian noise: stddev tăng theo khoảng cách
    const stddev = distance * sensor.noiseLevel;
    const noise = gaussianRandom(0, stddev);
    return Math.max(0, Math.round(distance + noise));
  }
}

// Box-Muller transform để tạo Gaussian noise
function gaussianRandom(mean: number, stddev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function degToRad(deg: number): number { return deg * Math.PI / 180; }
```

---

## Encoder / Odometry Sensor

Không cần raycast — đọc trực tiếp từ physics body:

```typescript
export function computeEncoderReadings(
  body: Matter.Body,
  spec: RobotSpec,
  prevPositions: Map<string, { x: number; y: number }>
): Record<string, number> {
  const readings: Record<string, number> = {};

  spec.wheels.forEach(wheel => {
    const prev = prevPositions.get(wheel.id) ?? body.position;
    const dx = body.position.x - prev.x;
    const dy = body.position.y - prev.y;
    const displacement = Math.sqrt(dx * dx + dy * dy);

    // Tích lũy encoder ticks (giả sử 360 ticks/revolution)
    const revolutions = displacement / (2 * Math.PI * wheel.radius);
    readings[`encoder_${wheel.id}`] = Math.round(revolutions * 360);

    prevPositions.set(wheel.id, { ...body.position });
  });

  return readings;
}
```

---

## Gyroscope Sensor

```typescript
export function computeGyroReading(
  body: Matter.Body,
  prevAngle: number,
  dt: number,  // seconds
  biasAccumulator: { value: number }
): number {
  // Angular velocity (rad/s)
  const angularVel = body.angularVelocity / dt;

  // Gyro drift — tích lũy theo thời gian
  biasAccumulator.value += gaussianRandom(0, 0.001); // rất nhỏ
  
  return angularVel + biasAccumulator.value;
}
```

---

## Sensor Readings trong Robot API

User code truy cập sensors qua:

```javascript
// Trong user code (qua Robot API)
const frontDist = await robot.getSensor('front');     // mm hoặc -1
const leftDist  = await robot.getSensor('left');      // mm hoặc -1
const gyroRate  = await robot.getSensor('gyro');      // rad/s (nếu có)
```

Mapping: `sensorId` trong `SensorSpec` → key trong `SimState.sensors`.

---

## Visualization

Khi render, hiện sensor rays trên canvas:
- Ray màu xanh lá = không phát hiện tường (trong range nhưng không hit)
- Ray màu đỏ = đang phát hiện tường (hit), độ dài = khoảng cách đo được
- Cone FOV hiện bằng sector mờ

Toggle hiện/ẩn sensor visualization qua UI checkbox.

---

## Lưu ý

- Tất cả sensor calculations chạy **sau** mỗi physics step, **trước** khi trả state về user code
- Noise có thể tắt trong debug mode (`sensor.noiseLevel = 0`)
- Cần test kỹ edge cases: sensor ở góc tường, sensor nhìn qua khe hở, robot gần sát tường
- `maxRange = -1` trong reading → user code phải handle trường hợp này (không thấy tường)
