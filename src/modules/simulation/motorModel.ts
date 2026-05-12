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

  // Matter.js Body.update: body.velocity = prevVel * frictionAir + (F/m) * deltaTime²
  // where deltaTime is in ms (16.67) and deltaTime² = 277.78
  // body.velocity is displacement PER TICK (not per second)
  const dtMs = dt * 1000;
  const dtSq = dtMs * dtMs;

  for (const wheel of spec.wheels) {
    const motor = spec.motors[wheel.motorId];
    if (!motor) continue;

    const targetRPM = robotState.motorSpeeds.get(String(wheel.motorId)) ?? 0;

    // Target velocity: mm/s → mm/tick (Matter.js native velocity unit)
    const circumference = 2 * Math.PI * wheel.radius;
    const targetLinearVel = (targetRPM / 60) * circumference;
    const targetPerTick = targetLinearVel * dt;

    // Current velocity from Matter.js body (already in mm/tick)
    const currentPerTick = dotProduct(body.velocity, forceDir);

    // Velocity error in mm/tick
    const velError = targetPerTick - currentPerTick;

    // PD controller: F = Kp * error * mass / dtSq
    // This counteracts Matter.js's (F/m) * dtSq integration
    // Kp < 1 for stable exponential approach (corrects fraction of error per tick)
    const Kp = 0.3;
    const pdForce = Kp * velError * body.mass / dtSq;

    // Max motor torque force at wheel, also scaled for Matter.js dt²
    const maxMotorForce = motor.maxTorque / wheel.radius / dtSq;
    const clampedForce = Math.max(-maxMotorForce, Math.min(maxMotorForce, pdForce));

    // Wheel offset: left/right from center (differential drive)
    const wheelPos = wheel.position ?? {
      x: wheel.motorId === 0 ? -wheel.distanceFromCenter : wheel.distanceFromCenter,
      y: 0,
    };

    const wheelWorldPos = localToWorld(body, wheelPos);

    Matter.Body.applyForce(body, wheelWorldPos, {
      x: forceDir.x * clampedForce,
      y: forceDir.y * clampedForce,
    });
  }
}
