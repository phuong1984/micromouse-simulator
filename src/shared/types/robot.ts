export interface Vector2D {
  x: number;
  y: number;
}

export interface BaseSpec {
  width: number;
  height: number;
  mass: number;
  shape?: 'rectangle' | 'circle';
}

export interface WheelSpec {
  id: string;
  position: Vector2D;
  radius: number;
  width: number;
  maxRPM: number;
  maxTorque: number;
  gearRatio: number;
  frictionCoeff?: number;
}

export interface SensorSpec {
  id: string;
  type: 'IR' | 'Ultrasonic' | 'Encoder';
  position: Vector2D;
  angle: number;
  maxRange: number;
  fov?: number;
  noiseLevel?: number;
}

export interface RobotSpec {
  id?: string;
  name?: string;
  base: BaseSpec;
  wheels: WheelSpec[];
  sensors: SensorSpec[];
}
