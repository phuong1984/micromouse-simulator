import Matter from 'matter-js';
import type { RobotSpec } from '../../shared/types/robot';
import type { RobotState } from '../../shared/types/simulation';

export interface RobotPhysicsState {
  body: Matter.Body;
  motorSpeeds: Map<string, number>;
}

export function createRobotBody(spec: RobotSpec, x: number, y: number): RobotPhysicsState {
  const { width, height, mass } = spec.base;

  const body = Matter.Bodies.rectangle(x, y, width, height, {
    mass: mass / 1000,
    frictionAir: 0.12,
    restitution: 0.1,
    label: 'robot',
    collisionFilter: { category: 0x0001, mask: 0x0002 },
  });

  return {
    body,
    motorSpeeds: new Map(spec.motors.map((_, i) => [String(i), 0])),
  };
}

export function extractRobotState(body: Matter.Body): RobotState {
  return {
    x: body.position.x,
    y: body.position.y,
    angle: body.angle,
    vx: body.velocity.x * 1000,
    vy: body.velocity.y * 1000,
    av: body.angularVelocity,
  };
}

export function setRobotPosition(body: Matter.Body, x: number, y: number, angle: number): void {
  Matter.Body.setPosition(body, { x, y });
  Matter.Body.setAngle(body, angle);
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(body, 0);
}
