import { RobotSpec } from '../types/robot';

export const DEFAULT_ROBOT: RobotSpec = {
  base: {
    width: 80,
    height: 80,
    mass: 150,
  },
  motors: [
    {
      name: 'left',
      maxSpeed: 500,
      maxTorque: 10,
    },
    {
      name: 'right',
      maxSpeed: 500,
      maxTorque: 10,
    },
  ],
  wheels: [
    {
      radius: 15,
      distanceFromCenter: 35,
      motorId: 0,
    },
    {
      radius: 15,
      distanceFromCenter: 35,
      motorId: 1,
    },
  ],
  sensors: [
    {
      id: 'front',
      type: 'IR',
      position: { x: 35, y: 0 },
      angle: 0,
      range: 180,
    },
    {
      id: 'left',
      type: 'IR',
      position: { x: 25, y: -15 },
      angle: -90,
      range: 180,
    },
    {
      id: 'right',
      type: 'IR',
      position: { x: 25, y: 15 },
      angle: 90,
      range: 180,
    },
  ],
};
