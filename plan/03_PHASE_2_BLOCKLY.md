# Phase 2 — Blockly Editor với Python Code Generation

> **Goal**: Blockly hoạt động, generate Python code. Monaco editor cho người dùng nâng cao.
> **Ước tính**: 10h
> **Input**: Phase 1 hoàn thành (renderer hoạt động)
> **Output**: Kéo thả blocks → code Python được generate → xem/export code

---

## Completed: ✅

- [x] 2.1 — Create 6 custom Blockly blocks → `robotBlocks.ts`
- [x] 2.2 — Python code generators for each block → `pythonGenerator.forBlock`
- [x] 2.3 — Configure Blockly toolbox → `toolbox.ts`
- [x] 2.4 — Blockly workspace (inject, dispose, resize) → `BlocklyEditor.tsx`
- [x] 2.5 — Blockly XML ↔ Python code sync → Zustand store + changeListener
- [x] 2.6 — Save/load workspace to localStorage → `STORAGE_KEY`
- [x] 2.7 — Tab toggle: Blockly ↔ Monaco → `App.tsx` tab buttons
- [x] 2.8 — Monaco Editor cho advanced Python → `MonacoEditor.tsx`
- [x] 2.9 — Ẩn Blockly flyout scrollbar bằng CSS → `App.css`

---

## Task Details

### 2.1 — Custom Blockly Blocks
**Deliverable**: `code-editor/robotBlocks.ts` — 6 custom blocks  
**Ước tính**: 2h

Danh sách blocks:

| Block ID | Label | Type | Output |
|----------|-------|------|--------|
| `robot_move` | robot_move | statement | `robot.move(distance)` |
| `robot_turn` | robot_turn | statement | `robot.turn(angle)` |
| `robot_get_sensor` | robot_get_sensor | value | `robot.get_sensor(id)` |
| `robot_wall_detected` | robot_wall_detected | value (bool) | `0 < robot.get_sensor(dir) < threshold` |
| `robot_stop` | robot_stop | statement | `robot.stop()` |
| `robot_set_motors` | robot_set_motors | statement | `robot.set_motor_speeds(left, right)` |

### 2.2 — Python Code Generators
**Deliverable**: `@blockly/python` generators output valid Python 3  
**Ước tính**: 2h

**QUAN TRỌNG**: Dùng `pythonGenerator` (không phải `javascriptGenerator`).

```typescript
import * as pythonGenerator from '@blockly/python';

// Move
pythonGenerator.forBlock['robot_move'] = function(block) {
  const distance = pythonGenerator.valueToCode(block, 'DISTANCE', 0) || '180';
  return `robot.move(${distance})\n`;
};

// Turn
pythonGenerator.forBlock['robot_turn'] = function(block) {
  const dir = block.getFieldValue('DIRECTION');
  const angle = block.getFieldValue('ANGLE');
  const signedAngle = dir === 'LEFT' ? -angle : angle;
  return `robot.turn(${signedAngle})\n`;
};

// Get Sensor (value block)
pythonGenerator.forBlock['robot_get_sensor'] = function(block) {
  const sensorId = block.getFieldValue('SENSOR_ID');
  return [`robot.get_sensor('${sensorId}')`, 0];  // [code, ORDER_NONE]
};

// Wall detected
pythonGenerator.forBlock['robot_wall_detected'] = function(block) {
  const dir = block.getFieldValue('DIRECTION');
  const threshold = block.getFieldValue('THRESHOLD');
  return [`(0 < robot.get_sensor('${dir}') < ${threshold})`, 0];
};

// Stop
pythonGenerator.forBlock['robot_stop'] = function(block) {
  return `robot.stop()\n`;
};

// Set motors
pythonGenerator.forBlock['robot_set_motors'] = function(block) {
  const left = pythonGenerator.valueToCode(block, 'LEFT_RPM', 0) || '0';
  const right = pythonGenerator.valueToCode(block, 'RIGHT_RPM', 0) || '0';
  return `robot.set_motor_speeds(${left}, ${right})\n`;
};
```

**Blockly wrap**: Auto wrap generated code into:
```python
def solve(robot):
    # ... user blocks code ...

solve(robot)
```

### 2.3 — Toolbox Configuration
**Deliverable**: `code-editor/toolbox.ts`  
**Ước tính**: 1h

Blockly toolbox XML/JSON:
```xml
<xml id="toolbox" style="display: none">
  <category name="🤖 Di chuyển" colour="120">
    <block type="robot_move">
      <value name="DISTANCE">
        <shadow type="math_number">
          <field name="NUM">180</field>
        </shadow>
      </value>
    </block>
    <block type="robot_turn"></block>
    <block type="robot_stop"></block>
    <block type="robot_set_motors">
      <value name="LEFT_RPM">
        <shadow type="math_number"><field name="NUM">2400</field></shadow>
      </value>
      <value name="RIGHT_RPM">
        <shadow type="math_number"><field name="NUM">2400</field></shadow>
      </value>
    </block>
  </category>
  <category name="📡 Cảm biến" colour="210">
    <block type="robot_get_sensor"></block>
    <block type="robot_wall_detected"></block>
  </category>
  <category name="🔁 Lặp" colour="210">
    <block type="controls_repeat_ext"></block>
    <block type="controls_whileUntil"></block>
    <block type="controls_for"></block>
  </category>
  <category name="❓ Điều kiện" colour="210">
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_negate"></block>
    <block type="logic_boolean"></block>
  </category>
  <category name="🔢 Toán học" colour="230">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
  </category>
  <category name="📦 Biến" colour="330" custom="VARIABLE"></category>
</xml>
```

### 2.4 — BlocklyEditor Component
**Deliverable**: `code-editor/BlocklyEditor.tsx`  
**Ước tính**: 1.5h

Features:
- Inject Blockly workspace into DOM div
- Grid + zoom + trashcan + scrollbars
- ResizeObserver for responsive sizing
- Cleanup on unmount

### 2.5 — Code Sync
**Deliverable**: Blockly workspace ↔ Python code string auto-sync  
**Ước tính**: 1h

- `workspace.addChangeListener` → generate Python code
- Code stored in Zustand `codeEditorStore`
- Expose `getCode()`, `setCode()` for parent components

### 2.6 — LocalStorage Persistence
**Deliverable**: Save workspace XML to localStorage, load on init  
**Ước tính**: 45p

```typescript
function saveWorkspace(workspace, name) {
  const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
  localStorage.setItem(`blockly-workspace-${name}`, xml);
}

function loadWorkspace(workspace, name) {
  const xml = localStorage.getItem(`blockly-workspace-${name}`);
  if (xml) Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);
}
```

### 2.7 — Tab Toggle: Blockly ↔ Monaco
**Deliverable**: UI tabs, code sync between editors  
**Ước tính**: 1h

- Khi switch từ Blockly → Monaco: generate Python, inject vào Monaco
- Khi switch từ Monaco → Blockly: parse Python → Blockly XML (best effort, may lose complex code)

### 2.8 — Monaco Editor
**Deliverable**: `code-editor/MonacoEditor.tsx`  
**Ước tính**: 1h

- Python language mode
- Basic theme (dark theme matching app)
- Read-only mode khi Blockly active

---

## Acceptance Criteria

- [x] Blockly workspace hiển thị đúng, có toolbox đầy đủ
- [x] Kéo thả block "move 180" → generate code `robot.move(180)`
- [x] Kéo thả block "turn left 90" → generate code `robot.turn(-90)`
- [x] Sensor block generate `robot.get_sensor('front')`
- [x] Python tab hiển thị code Python generate từ Blockly
- [x] Workspace save/load localStorage
- [x] Monaco editor hiển thị, syntax highlighting (Python, dark theme)
- [x] Tab toggle hoạt động, code sync
- [x] Blockly flyout scrollbar bị ẩn (CSS `.blocklyFlyoutScrollbar { display: none }`)