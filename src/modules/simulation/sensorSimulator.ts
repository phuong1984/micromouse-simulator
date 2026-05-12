import type { RobotSpec, SensorSpec } from '../../shared/types/robot';
import type { WallSegment } from '../../shared/types/simulation';

export function gaussianRandom(mean: number, stddev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function rayLineSegmentIntersect(
  ox: number, oy: number,
  dx: number, dy: number,
  ax: number, ay: number,
  bx: number, by: number,
): { t: number; u: number } | null {
  const ex = bx - ax;
  const ey = by - ay;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((ax - ox) * ey - (ay - oy) * ex) / denom;
  const u = ((ax - ox) * dy - (ay - oy) * dx) / denom;
  if (t >= 0 && u >= 0 && u <= 1) return { t, u };
  return null;
}

function wallCorners(seg: WallSegment): [[number, number], [number, number], [number, number], [number, number]] {
  const cos = Math.cos(seg.angle);
  const sin = Math.sin(seg.angle);
  const hw = seg.width / 2;
  const hh = seg.height / 2;
  return [
    [seg.x + (-hw) * cos - (-hh) * sin, seg.y + (-hw) * sin + (-hh) * cos],
    [seg.x + (hw) * cos - (-hh) * sin, seg.y + (hw) * sin + (-hh) * cos],
    [seg.x + (hw) * cos - (hh) * sin, seg.y + (hw) * sin + (hh) * cos],
    [seg.x + (-hw) * cos - (hh) * sin, seg.y + (-hw) * sin + (hh) * cos],
  ];
}

function castRay(
  ox: number, oy: number,
  angleRad: number,
  wallSegments: WallSegment[],
  maxRange: number,
): number {
  const dx = Math.sin(angleRad);
  const dy = -Math.cos(angleRad);
  let minDist = maxRange;
  let hit = false;

  for (const seg of wallSegments) {
    const corners = wallCorners(seg);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const result = rayLineSegmentIntersect(ox, oy, dx, dy, corners[i][0], corners[i][1], corners[j][0], corners[j][1]);
      if (result && result.t < minDist) {
        minDist = result.t;
        hit = true;
      }
    }
  }

  return hit ? minDist : -1;
}

export class SensorSimulator {
  private wallSegments: WallSegment[];
  private spec: RobotSpec;

  constructor(spec: RobotSpec, wallSegments: WallSegment[]) {
    this.spec = spec;
    this.wallSegments = wallSegments;
  }

  update(x: number, y: number, angle: number): Record<string, number> {
    const readings: Record<string, number> = {};
    for (const sensor of this.spec.sensors) {
      readings[sensor.id] = this.readSensor(sensor, x, y, angle);
    }
    return readings;
  }

  private readSensor(sensor: SensorSpec, robotX: number, robotY: number, robotAngle: number): number {
    const cos = Math.cos(robotAngle);
    const sin = Math.sin(robotAngle);
    const wx = robotX + sensor.position.x * cos - sensor.position.y * sin;
    const wy = robotY + sensor.position.x * sin + sensor.position.y * cos;

    const fov = sensor.fov ?? 0;
    const numRays = fov > 0 ? 5 : 1;
    let minDist = sensor.range;

    for (let i = 0; i < numRays; i++) {
      const spreadOffset = numRays === 1 ? 0 : ((i / (numRays - 1)) - 0.5) * (fov * Math.PI / 180);
      const worldAngle = robotAngle + (sensor.angle * Math.PI / 180) + spreadOffset;
      const dist = castRay(wx, wy, worldAngle, this.wallSegments, sensor.range);
      if (dist >= 0 && dist < minDist) {
        minDist = dist;
      }
    }

    if (minDist >= sensor.range) return -1;

    const noiseLevel = sensor.noiseLevel ?? 0;
    if (noiseLevel > 0) {
      const stddev = minDist * noiseLevel;
      const noisy = minDist + gaussianRandom(0, stddev);
      return Math.max(0, Math.round(noisy));
    }

    return Math.round(minDist);
  }
}
