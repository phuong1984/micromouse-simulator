import type { RobotSpec } from '../types/robot';

export const DEFAULT_ROBOT: RobotSpec = {
  base: {
    width: 80,
    height: 80,
    mass: 150,
    shape: 'rectangle',
  },
  wheels: [
    {
      id: 'wheel-left',
      position: { x: -35, y: 0 },
      radius: 15,
      width: 8,
      maxRPM: 500,
      maxTorque: 40,
      gearRatio: 1,
      frictionCoeff: 0.8,
    },
    {
      id: 'wheel-right',
      position: { x: 35, y: 0 },
      radius: 15,
      width: 8,
      maxRPM: 500,
      maxTorque: 40,
      gearRatio: 1,
      frictionCoeff: 0.8,
    },
  ],
  sensors: [
    {
      id: 'front',
      type: 'IR',
      position: { x: 0, y: 40 },
      angle: 0,
      maxRange: 180,
      fov: 10,
      noiseLevel: 0.02,
    },
    {
      id: 'left',
      type: 'IR',
      position: { x: -40, y: 0 },
      angle: -90,
      maxRange: 180,
      fov: 10,
      noiseLevel: 0.02,
    },
    {
      id: 'right',
      type: 'IR',
      position: { x: 40, y: 0 },
      angle: 90,
      maxRange: 180,
      fov: 10,
      noiseLevel: 0.02,
    },
  ],
};
