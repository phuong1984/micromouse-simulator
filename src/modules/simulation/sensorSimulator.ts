import type { RobotSpec } from '../../shared/types/robot';

export class SensorSimulator {
  constructor(_spec: RobotSpec) {}

  update(_x: number, _y: number, _angle: number): Record<string, number> {
    return {};
  }
}
