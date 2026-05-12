import type { RobotSpec } from '../../shared/types/robot';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateRobotSpec(spec: RobotSpec): ValidationError[] {
  const errors: ValidationError[] = [];

  if (spec.base.width < 20 || spec.base.width > 180)
    errors.push({ field: 'base.width', message: 'Width must be 20–180mm' });
  if (spec.base.height < 20 || spec.base.height > 180)
    errors.push({ field: 'base.height', message: 'Height must be 20–180mm' });
  if (spec.base.mass < 10 || spec.base.mass > 5000)
    errors.push({ field: 'base.mass', message: 'Mass must be 10–5000g' });
  if (spec.wheels.length === 0)
    errors.push({ field: 'wheels', message: 'Need at least 1 wheel' });

  const hw = spec.base.width / 2;
  const hh = spec.base.height / 2;
  spec.wheels.forEach((w) => {
    if (w.position.x < -hw || w.position.x > hw)
      errors.push({ field: `wheel.${w.id}.posX`, message: `Wheel pos X must be ${-hw}–${hw}mm` });
    if (w.position.y < -hh || w.position.y > hh)
      errors.push({ field: `wheel.${w.id}.posY`, message: `Wheel pos Y must be ${-hh}–${hh}mm` });
    if (w.radius < 1 || w.radius > 50)
      errors.push({ field: `wheel.${w.id}.radius`, message: `Wheel radius must be 1–50mm` });
    if (w.maxRPM < 1 || w.maxRPM > 5000)
      errors.push({ field: `wheel.${w.id}.maxRPM`, message: `Max RPM must be 1–5000` });
    if (w.maxTorque < 0.1 || w.maxTorque > 100)
      errors.push({ field: `wheel.${w.id}.maxTorque`, message: `Max torque must be 0.1–100 N·mm` });
    if (w.gearRatio < 0.1 || w.gearRatio > 20)
      errors.push({ field: `wheel.${w.id}.gearRatio`, message: `Gear ratio must be 0.1–20` });
  });

  const sensorIds = new Set<string>();
  spec.sensors.forEach((sen) => {
    if (sen.position.x < -hw || sen.position.x > hw)
      errors.push({ field: `sensor.${sen.id}.posX`, message: `Sensor pos X must be ${-hw}–${hw}mm` });
    if (sen.position.y < -hh || sen.position.y > hh)
      errors.push({ field: `sensor.${sen.id}.posY`, message: `Sensor pos Y must be ${-hh}–${hh}mm` });
    if (sen.maxRange < 1 || sen.maxRange > 180)
      errors.push({ field: `sensor.${sen.id}.maxRange`, message: `Max range must be 1–180mm` });
    if (sen.fov != null && (sen.fov < 1 || sen.fov > 90))
      errors.push({ field: `sensor.${sen.id}.fov`, message: `FOV must be 1–90°` });
    if (sensorIds.has(sen.id))
      errors.push({
        field: `sensor.${sen.id}.id`,
        message: `Duplicate sensor ID '${sen.id}'`,
      });
    sensorIds.add(sen.id);
  });

  return errors;
}
