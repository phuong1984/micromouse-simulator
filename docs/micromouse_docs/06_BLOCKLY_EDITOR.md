# 06 — Blockly Editor (Kéo thả)

## Mục tiêu

Cung cấp giao diện lập trình kéo thả dành cho người mới, sử dụng Google Blockly với custom blocks cho Robot API.

---

## Setup Blockly

```typescript
// modules/code-editor/BlocklyEditor.tsx

import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { registerRobotBlocks } from './robotBlocks';
import { ROBOT_TOOLBOX } from './toolbox';

export function BlocklyEditor({ onChange }: { onChange: (code: string) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    registerRobotBlocks(); // đăng ký custom blocks

    const workspace = Blockly.inject(divRef.current!, {
      toolbox: ROBOT_TOOLBOX,
      theme: Blockly.Themes.Modern,
      grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3 },
      trashcan: true,
      scrollbars: true,
    });

    workspace.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(workspace);
      onChange(wrapUserCode(code));
    });

    workspaceRef.current = workspace;
    return () => workspace.dispose();
  }, []);

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />;
}

function wrapUserCode(code: string): string {
  return `async function solve(robot) {\n${code}\n}\nsolve(robot);`;
}
```

---

## Custom Blocks — Định nghĩa

### 1. Move Forward

```typescript
// modules/code-editor/robotBlocks.ts

Blockly.Blocks['robot_move'] = {
  init() {
    this.appendValueInput('DISTANCE')
        .setCheck('Number')
        .appendField('di chuyển');
    this.appendDummyInput()
        .appendField('mm');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(120); // xanh lá
    this.setTooltip('Di chuyển thẳng một khoảng cách (mm)');
  }
};

javascriptGenerator.forBlock['robot_move'] = function(block) {
  const distance = javascriptGenerator.valueToCode(block, 'DISTANCE', 0) || '180';
  return `await robot.move(${distance});\n`;
};
```

### 2. Turn

```typescript
Blockly.Blocks['robot_turn'] = {
  init() {
    this.appendDummyInput()
        .appendField('quay')
        .appendField(new Blockly.FieldDropdown([
          ['trái', 'LEFT'],
          ['phải', 'RIGHT'],
        ]), 'DIRECTION')
        .appendField(new Blockly.FieldNumber(90, 1, 360), 'ANGLE')
        .appendField('độ');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip('Quay robot tại chỗ');
  }
};

javascriptGenerator.forBlock['robot_turn'] = function(block) {
  const dir = block.getFieldValue('DIRECTION') === 'LEFT' ? -1 : 1;
  const angle = block.getFieldValue('ANGLE');
  return `await robot.turn(${dir * angle});\n`;
};
```

### 3. Read Sensor

```typescript
Blockly.Blocks['robot_get_sensor'] = {
  init() {
    this.appendDummyInput()
        .appendField('cảm biến')
        .appendField(new Blockly.FieldDropdown([
          ['phía trước', 'front'],
          ['bên trái', 'left'],
          ['bên phải', 'right'],
          ['trước-trái', 'front-left'],
          ['trước-phải', 'front-right'],
        ]), 'SENSOR_ID');
    this.setOutput(true, 'Number');
    this.setColour(210); // xanh dương
    this.setTooltip('Đọc khoảng cách từ cảm biến (mm), -1 nếu không phát hiện');
  }
};

javascriptGenerator.forBlock['robot_get_sensor'] = function(block) {
  const sensorId = block.getFieldValue('SENSOR_ID');
  return [`robot.getSensor('${sensorId}')`, 0];
};
```

### 4. Condition — Wall Detected

```typescript
Blockly.Blocks['robot_wall_detected'] = {
  init() {
    this.appendDummyInput()
        .appendField('có tường phía')
        .appendField(new Blockly.FieldDropdown([
          ['trước', 'front'],
          ['trái', 'left'],
          ['phải', 'right'],
        ]), 'DIRECTION')
        .appendField('trong')
        .appendField(new Blockly.FieldNumber(100, 10, 500), 'THRESHOLD')
        .appendField('mm');
    this.setOutput(true, 'Boolean');
    this.setColour(210);
    this.setTooltip('Kiểm tra có tường gần không');
  }
};

javascriptGenerator.forBlock['robot_wall_detected'] = function(block) {
  const dir = block.getFieldValue('DIRECTION');
  const threshold = block.getFieldValue('THRESHOLD');
  return [`(robot.getSensor('${dir}') > 0 && robot.getSensor('${dir}') < ${threshold})`, 0];
};
```

### 5. Set Motor Speed (Advanced)

```typescript
Blockly.Blocks['robot_set_motors'] = {
  init() {
    this.appendValueInput('LEFT_RPM').setCheck('Number').appendField('tốc độ motor trái:');
    this.appendValueInput('RIGHT_RPM').setCheck('Number').appendField('phải:');
    this.appendDummyInput().appendField('RPM');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(30); // cam
    this.setTooltip('Điều khiển tốc độ từng motor trực tiếp');
  }
};

javascriptGenerator.forBlock['robot_set_motors'] = function(block) {
  const left = javascriptGenerator.valueToCode(block, 'LEFT_RPM', 0) || '0';
  const right = javascriptGenerator.valueToCode(block, 'RIGHT_RPM', 0) || '0';
  return `robot.setMotorSpeeds(${left}, ${right});\n`;
};
```

---

## Toolbox Definition

```typescript
// modules/code-editor/toolbox.ts

export const ROBOT_TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '🤖 Di chuyển',
      colour: '120',
      contents: [
        { kind: 'block', type: 'robot_move', inputs: { DISTANCE: { block: { type: 'math_number', fields: { NUM: 180 } } } } },
        { kind: 'block', type: 'robot_turn' },
        { kind: 'block', type: 'robot_stop' },
        { kind: 'block', type: 'robot_set_motors' },
      ],
    },
    {
      kind: 'category',
      name: '📡 Cảm biến',
      colour: '210',
      contents: [
        { kind: 'block', type: 'robot_get_sensor' },
        { kind: 'block', type: 'robot_wall_detected' },
        { kind: 'block', type: 'robot_get_angle' },
        { kind: 'block', type: 'robot_get_position' },
      ],
    },
    {
      kind: 'category',
      name: '🔁 Lặp',
      colour: '120',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
        { kind: 'block', type: 'controls_forEach' },
      ],
    },
    {
      kind: 'category',
      name: '❓ Điều kiện',
      colour: '210',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: '🔢 Toán học',
      colour: '230',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_number_property' },
        { kind: 'block', type: 'math_on_list' },
      ],
    },
    {
      kind: 'category',
      name: '📦 Biến',
      colour: '330',
      custom: 'VARIABLE',
    },
    {
      kind: 'category',
      name: '⚙️ Hàm',
      colour: '290',
      custom: 'PROCEDURE',
    },
  ],
};
```

---

## Chuyển đổi Blockly XML ↔ Code

```typescript
// Lưu workspace dưới dạng XML
function saveWorkspace(workspace: Blockly.WorkspaceSvg): string {
  const xml = Blockly.Xml.workspaceToDom(workspace);
  return Blockly.Xml.domToText(xml);
}

// Load workspace từ XML đã lưu
function loadWorkspace(workspace: Blockly.WorkspaceSvg, xmlText: string): void {
  const xml = Blockly.Xml.textToDom(xmlText);
  Blockly.Xml.domToWorkspace(xml, workspace);
}
```

---

## Lưu ý

- Block `robot_get_sensor` return value (không có statement) — phải dùng trong điều kiện hoặc gán vào biến
- Blockly tự xử lý async/await bằng cách generator thêm `await` prefix khi gặp Promise-returning block
- Dynamic sensor IDs: nếu user thêm sensor custom trong RobotConfig, cần regenerate dropdown options của `robot_get_sensor` — subscribe vào RobotConfig store
- Export: ngoài Blockly XML, nên có nút "Xem code JS" để user học từ block → text code
