import Matter from 'matter-js';
import type { RobotSpec } from '../../shared/types/robot';
import type { RobotPhysicsState } from './robotBody';

function localToWorld(body: Matter.Body, local: { x: number; y: number }): Matter.Vector {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  return {
    x: body.position.x + local.x * cos - local.y * sin,
    y: body.position.y + local.x * sin + local.y * cos,
  };
}

function dotProduct(a: Matter.Vector, b: { x: number; y: number }): number {
  return a.x * b.x + a.y * b.y;
}

export function applyMotorForces(
  _engine: Matter.Engine,
  robotState: RobotPhysicsState,
  spec: RobotSpec,
  dt: number
): void {
  const body = robotState.body;
  const angle = body.angle;

  const forceDir = { x: Math.sin(angle), y: -Math.cos(angle) };

  // Matter.js Body.update uses Verlet integration:
  //   velocity = prevVel * frictionAir + (F/m) * deltaTime²
  //   position += velocity
  // body.velocity is displacement PER TICK (mm/frame), NOT per ms or per s
  const dtMs = dt * 1000;
  const dtSq = dtMs * dtMs;

  for (const wheel of spec.wheels) {
    const cmdRPM = robotState.motorSpeeds.get(wheel.id) ?? 0;
    const wheelRPM = cmdRPM / wheel.gearRatio;

    // target in mm/s, then mm/tick to match body.velocity's Verlet units
    const circumference = 2 * Math.PI * wheel.radius;
    const targetLinearVel = (wheelRPM / 60) * circumference;
    const targetPerTick = targetLinearVel * dt;

    const currentPerTick = dotProduct(body.velocity, forceDir);

    const velError = targetPerTick - currentPerTick;

    const Kp = 0.9;
    const frictionAir = body.frictionAir;
    const totalForce = (Kp * velError + frictionAir * targetPerTick) * body.mass / dtSq;

    const effectiveTorque = wheel.maxTorque * wheel.gearRatio;
    const maxMotorForce = effectiveTorque / wheel.radius / dtSq * 5;
    const clampedForce = Math.max(-maxMotorForce, Math.min(maxMotorForce, totalForce));

    const wheelWorldPos = localToWorld(body, wheel.position);

    Matter.Body.applyForce(body, wheelWorldPos, {
      x: forceDir.x * clampedForce,
      y: forceDir.y * clampedForce,
    });
  }
}
