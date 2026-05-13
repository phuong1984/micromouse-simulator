import { useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  help?: string;
  integer?: boolean;
  inputClassName?: string;
}

export function NumberField({
  label, value, onChange, min, max, step, disabled, help,
  integer, inputClassName = 'config-input',
}: NumberFieldProps) {
  const [local, setLocal] = useState(() => String(value));
  const [synced, setSynced] = useState(value);

  if (synced !== value) {
    setSynced(value);
    setLocal(String(value));
  }

  const parseFn = integer ? parseInt : parseFloat;
  const localNum = parseFn(local);
  const isInvalid = !isNaN(localNum) && (
    (min != null && localNum < min) ||
    (max != null && localNum > max)
  );

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
          setLocal(e.target.value);
        }}
        onBlur={() => {
          const num = parseFn(local);
          if (!isNaN(num)) {
            const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, num));
            if (clamped !== synced) onChange(clamped);
            setSynced(clamped);
            setLocal(String(clamped));
          } else {
            setLocal(String(synced));
          }
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`${inputClassName}${isInvalid ? ' config-input-invalid' : ''}`}
      />
    </label>
  );
}
