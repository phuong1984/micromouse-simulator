import { create } from 'zustand';
import type { RobotSpec, BaseSpec, WheelSpec, SensorSpec } from '../../shared/types/robot';
import { DEFAULT_ROBOT } from '../../shared/constants/robot-presets';

function nextId(ids: string[], prefix: string, max: number): string {
  const existing = new Set(ids);
  for (let i = 1; i <= max; i++) {
    const id = `${prefix} ${i}`;
    if (!existing.has(id)) return id;
  }
  return '';
}

function loadSavedPresets(): RobotSpec[] {
  try {
    return JSON.parse(localStorage.getItem('robot-presets') || '[]');
  } catch {
    return [];
  }
}

function persistPresets(presets: RobotSpec[]): void {
  localStorage.setItem('robot-presets', JSON.stringify(presets));
}

export interface RobotConfigStore {
  spec: RobotSpec;
  savedPresets: RobotSpec[];
  updateBase: (data: Partial<BaseSpec>) => void;
  addWheel: () => void;
  updateWheel: (id: string, data: Partial<WheelSpec>) => void;
  removeWheel: (id: string) => void;
  addSensor: () => void;
  updateSensor: (id: string, data: Partial<SensorSpec>) => void;
  removeSensor: (id: string) => void;
  loadPreset: (preset: RobotSpec) => void;
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
}

export const useRobotConfigStore = create<RobotConfigStore>((set, get) => ({
  spec: { ...DEFAULT_ROBOT, id: 'custom', name: 'Custom Robot' },
  savedPresets: loadSavedPresets(),

  updateBase: (data) =>
    set((s) => ({ spec: { ...s.spec, base: { ...s.spec.base, ...data } } })),

  addWheel: () => {
    const { spec } = get();
    if (spec.wheels.length >= 4) return;
    const id = nextId(spec.wheels.map(w => w.id), 'wheel', 4);
    if (!id) return;
    const wheel: WheelSpec = {
      id,
      position: { x: 0, y: 0 },
      radius: 15,
      width: 8,
      maxRPM: 500,
      maxTorque: 40,
      gearRatio: 1,
      frictionCoeff: 0.8,
    };
    set((s) => ({ spec: { ...s.spec, wheels: [...s.spec.wheels, wheel] } }));
  },

  updateWheel: (id, data) =>
    set((s) => ({
      spec: {
        ...s.spec,
        wheels: s.spec.wheels.map((w) => (w.id === id ? { ...w, ...data } : w)),
      },
    })),

  removeWheel: (id) =>
    set((s) => ({
      spec: { ...s.spec, wheels: s.spec.wheels.filter((w) => w.id !== id) },
    })),

  addSensor: () => {
    const { spec } = get();
    if (spec.sensors.length >= 8) return;
    const id = nextId(spec.sensors.map(s => s.id), 'sensor', 8);
    if (!id) return;
    const sensor: SensorSpec = {
      id,
      type: 'IR',
      position: { x: 0, y: 40 },
      angle: 0,
      maxRange: 180,
      fov: 10,
      noiseLevel: 0.02,
    };
    set((s) => ({ spec: { ...s.spec, sensors: [...s.spec.sensors, sensor] } }));
  },

  updateSensor: (id, data) =>
    set((s) => ({
      spec: {
        ...s.spec,
        sensors: s.spec.sensors.map((sen) =>
          sen.id === id ? { ...sen, ...data } : sen
        ),
      },
    })),

  removeSensor: (id) =>
    set((s) => ({
      spec: { ...s.spec, sensors: s.spec.sensors.filter((sen) => sen.id !== id) },
    })),

  loadPreset: (preset) =>
    set({ spec: { ...preset, id: 'custom', name: preset.name + ' (modified)' } }),

  savePreset: (name) => {
    const { spec, savedPresets } = get();
    const newPreset: RobotSpec = { ...spec, id: name, name };
    const updated = [...savedPresets.filter((p) => p.id !== name), newPreset];
    persistPresets(updated);
    set({ savedPresets: updated });
  },

  deletePreset: (id) => {
    const { savedPresets } = get();
    const updated = savedPresets.filter((p) => p.id !== id);
    persistPresets(updated);
    set({ savedPresets: updated });
  },
}));
