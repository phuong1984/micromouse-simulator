export interface Vector2D {
  x: number;
  y: number;
}

export interface BaseSpec {
  width: number;
  height: number;
  mass: number;
}

export interface MotorSpec {
  name: string;
  maxSpeed: number;
  maxTorque: number;
}

export interface WheelSpec {
  radius: number;
  distanceFromCenter: number;
  motorId: number;
  frictionCoeff?: number;
  position?: Vector2D;
}

export interface SensorSpec {
  id: string;
  type: 'IR' | 'Ultrasonic' | 'Encoder';
  position: Vector2D;
  angle: number;
  range: number;
}

export interface RobotSpec {
  base: BaseSpec;
  motors: MotorSpec[];
  wheels: WheelSpec[];
  sensors: SensorSpec[];
}
