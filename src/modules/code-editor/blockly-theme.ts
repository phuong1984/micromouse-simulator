import * as Blockly from 'blockly';

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const colours = {
  movementPrimary: '#5b8dd9',
  sensorPrimary: '#59c059',
  wheelPrimary: '#d9a845',
  logicPrimary: '#b06ad8',
  mathPrimary: '#e86f8a',
  loopPrimary: '#d96b8a',
  textPrimary: '#47b5b5',
  procedurePrimary: '#9c89b8',
} as const;

function makeStyle(primary: string): Blockly.Theme.BlockStyle {
  return {
    colourPrimary: primary,
    colourSecondary: darken(primary, 25),
    colourTertiary: darken(primary, 45),
    hat: '',
  };
}

export const MICROMOUSE_THEME = Blockly.Theme.defineTheme('micromouse', {
  name: 'micromouse',
  base: Blockly.Themes.Zelos,
  blockStyles: {
    robot_movement: makeStyle(colours.movementPrimary),
    robot_sensor: makeStyle(colours.sensorPrimary),
    robot_wheel: makeStyle(colours.wheelPrimary),
    logic_blocks: makeStyle(colours.logicPrimary),
    math_blocks: makeStyle(colours.mathPrimary),
    loop_blocks: makeStyle(colours.loopPrimary),
    text_blocks: makeStyle(colours.textPrimary),
    procedure_blocks: makeStyle(colours.procedurePrimary),
  },
  categoryStyles: {
    movement_category: { colour: colours.movementPrimary },
    sensor_category: { colour: colours.sensorPrimary },
    loop_category: { colour: colours.loopPrimary },
    logic_category: { colour: colours.logicPrimary },
    math_category: { colour: colours.mathPrimary },
    text_category: { colour: '#47b5b5' },
    procedure_category: { colour: '#9c89b8' },
  },
  componentStyles: {
    toolboxBackgroundColour: '#111827',
    toolboxForegroundColour: '#e5e7eb',
    flyoutBackgroundColour: '#374151',
    flyoutForegroundColour: '#d1d5db',
    flyoutOpacity: 1,
    scrollbarColour: '#4b5563',
    scrollbarOpacity: 0.6,
    insertionMarkerColour: '#60a5fa',
    insertionMarkerOpacity: 0.3,
    selectedGlowColour: '#60a5fa',
    selectedGlowOpacity: 0.4,
    markerColour: '#60a5fa',
    cursorColour: '#60a5fa',
  },
  fontStyle: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    weight: '500',
    size: 12,
  },
  startHats: true,
});

export function patchBlocklyTheme(mode: 'dark' | 'light') {
  if (mode === 'dark') {
    MICROMOUSE_THEME.componentStyles = {
      ...MICROMOUSE_THEME.componentStyles,
      toolboxBackgroundColour: '#111827',
      flyoutBackgroundColour: '#374151',
    };
  } else {
    MICROMOUSE_THEME.componentStyles = {
      ...MICROMOUSE_THEME.componentStyles,
      toolboxBackgroundColour: '#f3f4f6',
      flyoutBackgroundColour: '#e5e7eb',
    };
  }
  const ws = Blockly.common.getMainWorkspace();
  if (ws) (ws as Blockly.WorkspaceSvg).setTheme(MICROMOUSE_THEME);
  patchWidgetMenuStyle(mode);
}

const WIDGET_STYLE_ID = 'micromouse-widget-override';

function patchWidgetMenuStyle(mode: 'dark' | 'light') {
  const text = mode === 'dark' ? '#e5e7eb' : '#111827';
  const bg = mode === 'dark' ? '#1f2937' : '#ffffff';
  const hoverBg = mode === 'dark' ? '#1f2937' : '#f3f4f6';
  const border = mode === 'dark' ? '#374151' : '#d1d5db';
  const css = `
.blocklyMenuItem { color: ${text} !important; background: transparent !important; }
.blocklyMenuItemContent { color: ${text} !important; }
.blocklyWidgetDiv .blocklyMenu, .blocklyDropDownDiv .blocklyMenu { background: ${bg} !important; border-color: ${border} !important; }
.blocklyDropDownDiv { background: ${bg} !important; border-color: ${border} !important; }
.blocklyDropdownMenu { background: ${bg} !important; }
.blocklyMenuItemHighlight { background-color: ${hoverBg} !important; }
  `.trim();
  let el = document.getElementById(WIDGET_STYLE_ID);
  if (el) {
    el.textContent = css;
  } else {
    el = document.createElement('style');
    el.id = WIDGET_STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }
}
