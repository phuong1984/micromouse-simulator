import { useRef, useState } from 'react';
import { useRobotConfigStore } from './store';
import { validateRobotSpec } from './validation';
import { useSimulationStore } from '../simulation/store';
import { DEFAULT_ROBOT } from '../../shared/constants/robot-presets';

type SubTab = 'base' | 'wheels' | 'sensors';

const H: Record<string, string> = {
  baseWidth: 'Physical width of the robot body. Wider robots may not fit in narrow maze corridors (max 180mm for IEEE standard).',
  baseHeight: 'Physical length of the robot. Affects turning clearance in tight spaces.',
  mass: 'Robot weight. Heavier robots accelerate slower but maintain momentum better through turns.',
  shape: 'Body shape. Rectangle provides stable straight-line motion. Circle allows smoother rotation in place.',
  x: 'Horizontal offset from robot center. Positive = right, negative = left.',
  y: 'Vertical offset from robot center. Positive = forward toward the front.',
  radius: 'Wheel size. Larger wheels cover more ground per revolution (higher top speed) but reduce effective torque.',
  wheelWidth: 'Wheel contact patch width. Wider wheels provide more traction and stability.',
  maxRPM: 'Maximum motor speed. Higher RPM = faster robot. The code can request any speed, capped by this limit.',
  maxTorque: 'Maximum rotational force. Higher torque = stronger acceleration and better hill climbing.',
  gearRatio: 'Mechanical reduction between motor and wheel. Higher ratio = more torque but lower wheel speed.',
  friction: 'Traction coefficient between wheel and floor. Higher = better grip but more resistance.',
  sensorType: 'Sensor technology. IR detects reflected light (short range). Ultrasonic measures sound echo (long range). Encoder tracks wheel rotation distance.',
  angle: 'Sensor direction relative to robot forward. 0° = forward, -90° = left, 90° = right, 180° = backward.',
  maxRange: 'Maximum distance the sensor can detect. Longer range sensors can see walls further ahead.',
  fov: 'Field of view. Wider FOV detects obstacles from the side but reduces angular precision.',
  noiseLevel: 'Random measurement error (0 = perfect, 1 = maximum noise). Higher values make readings less reliable.',
};

function NumberField({
  label, value, onChange, min, max, step, disabled, help,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; disabled?: boolean;
  help?: string;
}) {
  const [local, setLocal] = useState(() => String(value));
  const [synced, setSynced] = useState(value);

  if (synced !== value) {
    setSynced(value);
    setLocal(String(value));
  }

  const displayHelp = help
    ? help + '  [ ' + (min != null ? `Min: ${min}` : '') + (min != null && max != null ? ', ' : '') + (max != null ? `Max: ${max}` : '') + ' ]'
    : undefined;

  return (
    <label className="config-field">
      <span className="config-label">
        {label}
        {displayHelp && <span className="label-tooltip">{displayHelp}</span>}
      </span>
      <input
        type="number"
        value={local}
        onChange={(e) => {
          const raw = e.target.value;
          setLocal(raw);
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, num));
            if (clamped !== num) {
              setLocal(String(clamped));
            }
            onChange(clamped);
            setSynced(clamped);
          }
        }}
        min={min} max={max} step={step} disabled={disabled}
        className="config-input"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options, disabled, help,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
  help?: string;
}) {
  return (
    <label className="config-field">
      <span className="config-label">
        {label}
        {help && <span className="label-tooltip">{help}</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="config-input"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function BaseTab({ disabled }: { disabled?: boolean }) {
  const base = useRobotConfigStore((s) => s.spec.base);
  const updateBase = useRobotConfigStore((s) => s.updateBase);

  return (
    <div className="config-form">
      <NumberField label="Width (mm)" help={H.baseWidth} value={base.width} onChange={(v) => updateBase({ width: v })} min={20} max={180} disabled={disabled} />
      <NumberField label="Height (mm)" help={H.baseHeight} value={base.height} onChange={(v) => updateBase({ height: v })} min={20} max={180} disabled={disabled} />
      <NumberField label="Mass (g)" help={H.mass} value={base.mass} onChange={(v) => updateBase({ mass: v })} min={10} max={5000} disabled={disabled} />
      <SelectField
        label="Shape"
        help={H.shape}
        value={base.shape ?? 'rectangle'}
        onChange={(v) => updateBase({ shape: v as 'rectangle' | 'circle' })}
        options={[
          { value: 'rectangle', label: 'Rectangle' },
          { value: 'circle', label: 'Circle' },
        ]}
        disabled={disabled}
      />
    </div>
  );
}

function CollapseBtn({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-collapse">
      {collapsed ? '▶' : '▼'}
    </button>
  );
}

function WheelsTab({ disabled }: { disabled?: boolean }) {
  const spec = useRobotConfigStore((s) => s.spec);
  const addWheel = useRobotConfigStore((s) => s.addWheel);
  const updateWheel = useRobotConfigStore((s) => s.updateWheel);
  const removeWheel = useRobotConfigStore((s) => s.removeWheel);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="config-form">
      {spec.wheels.map((w) => (
        <div key={w.id} className="config-card">
          <div className="config-card-header">
            <div className="config-header-label">
              <CollapseBtn collapsed={!!collapsed[w.id]} onClick={() => toggle(w.id)} />
              <span className="config-label">ID</span>
            </div>
            <input
              type="text"
              value={w.id}
              onChange={(e) => updateWheel(w.id, { id: e.target.value })}
              className="config-input config-input-sm"
              disabled={disabled}
            />
            <button onClick={() => removeWheel(w.id)} className="btn-remove" disabled={disabled}>✕</button>
          </div>
          {!collapsed[w.id] && (
            <>
              <NumberField label="Pos X (mm)" help={H.x} value={w.position.x} onChange={(v) => updateWheel(w.id, { position: { x: v, y: w.position.y } })} min={-spec.base.width / 2} max={spec.base.width / 2} disabled={disabled} />
              <NumberField label="Pos Y (mm)" help={H.y} value={w.position.y} onChange={(v) => updateWheel(w.id, { position: { x: w.position.x, y: v } })} min={-spec.base.height / 2} max={spec.base.height / 2} disabled={disabled} />
              <NumberField label="Radius (mm)" help={H.radius} value={w.radius} onChange={(v) => updateWheel(w.id, { radius: v })} min={1} max={50} disabled={disabled} />
              <NumberField label="Width (mm)" help={H.wheelWidth} value={w.width} onChange={(v) => updateWheel(w.id, { width: v })} min={1} max={30} disabled={disabled} />
              <NumberField label="Max RPM" help={H.maxRPM} value={w.maxRPM} onChange={(v) => updateWheel(w.id, { maxRPM: v })} min={1} max={5000} disabled={disabled} />
              <NumberField label="Max Torque (N·mm)" help={H.maxTorque} value={w.maxTorque} onChange={(v) => updateWheel(w.id, { maxTorque: v })} min={0.1} max={100} step={0.1} disabled={disabled} />
              <NumberField label="Gear Ratio" help={H.gearRatio} value={w.gearRatio} onChange={(v) => updateWheel(w.id, { gearRatio: v })} min={0.1} max={20} step={0.1} disabled={disabled} />
              <NumberField label="Friction" help={H.friction} value={w.frictionCoeff ?? 0.8} onChange={(v) => updateWheel(w.id, { frictionCoeff: v })} min={0} max={1} step={0.05} disabled={disabled} />
            </>
          )}
        </div>
      ))}
      <button onClick={addWheel} className="btn-add" disabled={disabled || spec.wheels.length >= 4}>
        + Add Wheel
      </button>
      {spec.wheels.length >= 4 && (
        <p className="text-xs text-gray-500 mt-1">Maximum 4 wheels</p>
      )}
    </div>
  );
}

function SensorsTab({ disabled }: { disabled?: boolean }) {
  const spec = useRobotConfigStore((s) => s.spec);
  const sensors = spec.sensors;
  const addSensor = useRobotConfigStore((s) => s.addSensor);
  const updateSensor = useRobotConfigStore((s) => s.updateSensor);
  const removeSensor = useRobotConfigStore((s) => s.removeSensor);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="config-form">
      {sensors.map((sen) => (
        <div key={sen.id} className="config-card">
          <div className="config-card-header">
            <div className="config-header-label">
              <CollapseBtn collapsed={!!collapsed[sen.id]} onClick={() => toggle(sen.id)} />
              <span className="config-label">ID</span>
            </div>
            <input
              type="text"
              value={sen.id}
              onChange={(e) => updateSensor(sen.id, { id: e.target.value })}
              className="config-input config-input-sm"
              disabled={disabled}
            />
            <button onClick={() => removeSensor(sen.id)} className="btn-remove" disabled={disabled}>✕</button>
          </div>
          {!collapsed[sen.id] && (
            <>
              <SelectField
                label="Type"
                help={H.sensorType}
                value={sen.type}
                onChange={(v) => updateSensor(sen.id, { type: v as 'IR' | 'Ultrasonic' | 'Encoder' })}
                options={[
                  { value: 'IR', label: 'IR' },
                  { value: 'Ultrasonic', label: 'Ultrasonic' },
                  { value: 'Encoder', label: 'Encoder' },
                ]}
                disabled={disabled}
              />
              <NumberField label="Pos X (mm)" help={H.x} value={sen.position.x} onChange={(v) => updateSensor(sen.id, { position: { x: v, y: sen.position.y } })} min={-spec.base.width / 2} max={spec.base.width / 2} disabled={disabled} />
              <NumberField label="Pos Y (mm)" help={H.y} value={sen.position.y} onChange={(v) => updateSensor(sen.id, { position: { x: sen.position.x, y: v } })} min={-spec.base.height / 2} max={spec.base.height / 2} disabled={disabled} />
              <NumberField label="Angle (°)" help={H.angle} value={sen.angle} onChange={(v) => updateSensor(sen.id, { angle: v })} min={-180} max={180} disabled={disabled} />
              <NumberField label="Max Range (mm)" help={H.maxRange} value={sen.maxRange} onChange={(v) => updateSensor(sen.id, { maxRange: v })} min={1} max={180} disabled={disabled} />
              <NumberField label="FOV (°)" help={H.fov} value={sen.fov ?? 10} onChange={(v) => updateSensor(sen.id, { fov: v })} min={1} max={90} disabled={disabled} />
              <NumberField label="Noise Level" help={H.noiseLevel} value={sen.noiseLevel ?? 0.02} onChange={(v) => updateSensor(sen.id, { noiseLevel: v })} min={0} max={1} step={0.01} disabled={disabled} />
            </>
          )}
        </div>
      ))}
      <button onClick={addSensor} className="btn-add" disabled={disabled}>+ Add Sensor</button>
    </div>
  );
}

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'base', label: 'Base' },
  { key: 'wheels', label: 'Motorized-Wheels' },
  { key: 'sensors', label: 'Sensors' },
];

export function RobotConfig() {
  const [subTab, setSubTab] = useState<SubTab>('base');
  const spec = useRobotConfigStore((s) => s.spec);
  const savedPresets = useRobotConfigStore((s) => s.savedPresets);
  const loadPreset = useRobotConfigStore((s) => s.loadPreset);
  const savePreset = useRobotConfigStore((s) => s.savePreset);
  const deletePreset = useRobotConfigStore((s) => s.deletePreset);
  const simStatus = useSimulationStore((s) => s.status);
  const running = simStatus === 'running';
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = JSON.stringify(spec, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robot-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.base || !data.wheels) {
          alert('Invalid robot config file: missing base or wheels');
          return;
        }
        loadPreset(data);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const errors = validateRobotSpec(spec);

  return (
    <div className="robot-config-panel">
      <div className="config-sub-tabs">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={`config-sub-tab ${subTab === t.key ? 'active' : ''}`}
            onClick={() => setSubTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="config-content">
        {subTab === 'base' && <BaseTab disabled={running} />}
        {subTab === 'wheels' && <WheelsTab disabled={running} />}
        {subTab === 'sensors' && <SensorsTab disabled={running} />}

        {errors.length > 0 && (
          <div className="config-errors">
            {errors.map((e, i) => (
              <p key={i} className="text-red-400 text-xs">{e.message}</p>
            ))}
          </div>
        )}
      </div>

      <div className="config-footer">
        <div className="preset-section">
          <span className="text-xs text-gray-400">Presets</span>
          <div className="flex gap-1">
            <button
              onClick={() => loadPreset(DEFAULT_ROBOT)}
              className="btn-add btn-add-sm"
              disabled={running}
            >
              Default
            </button>
            <select
              className="config-input config-input-sm flex-1"
              value={selectedPresetId}
              disabled={running}
              onChange={(e) => {
                setSelectedPresetId(e.target.value);
                if (e.target.value) {
                  const p = savedPresets.find((pr) => pr.id === e.target.value);
                  if (p) loadPreset(p);
                }
              }}
            >
              <option value="">Load preset...</option>
              {savedPresets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedPresetId && (
              <button
                onClick={() => { deletePreset(selectedPresetId); setSelectedPresetId(''); }}
                className="btn-remove btn-remove-sm"
                disabled={running}
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex gap-1 mt-1">
            <input
              type="text"
              className="config-input config-input-sm flex-1"
              placeholder="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              disabled={running}
            />
            <button
              onClick={() => {
                if (presetName) { savePreset(presetName); setPresetName(''); }
              }}
              className="btn-add btn-add-sm"
              disabled={running || !presetName.trim()}
            >
              Save
            </button>
          </div>
          <div className="flex gap-1 mt-2 border-t border-gray-700 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-import-export"
              disabled={running}
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="btn-import-export"
              disabled={running}
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
