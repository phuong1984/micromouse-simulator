# Phase 5.5 — Integration: Blockly → MicroPython → Simulation

> **Goal**: Toàn bộ pipeline kết nối — Blockly tạo Python → MicroPython execute → Physics simulation chạy
> **Ước tính**: 3h
> **Input**: Phase 2 (Blockly), Phase 3 (MicroPython), Phase 4 (Physics), Phase 5 (Sensors)
> **Output**: Kéo thả blocks → nhấn Run → robot tự chạy giải mê cung

---

## Completed: ✅

- [ ] 5.5.1 — Blockly → Python code → Worker
- [ ] 5.5.2 — Code editor store integration
- [ ] 5.5.3 — Full pipeline test
- [ ] 5.5.4 — Console/Log integration

---

## Task Details

### 5.5.1 — Blockly Output → Worker
**Deliverable**: Python code string truyền từ Blockly vào Worker  
**Ước tính**: 1h

Flow:
```
Blockly workspace change
  → pythonGenerator.workspaceToCode(workspace)
  → codeEditorStore.setState({ pythonCode })
  → SimulationController.start()
    → Worker.postMessage({ type: 'START', pythonCode })
```

### 5.5.2 — Code Editor Store Integration
**Deliverable**: Zustand store cung cấp code cho simulation  
**Ước tính**: 45p

```typescript
interface CodeEditorState {
  pythonCode: string;
  mode: 'blockly' | 'monaco';
  setPythonCode: (code: string) => void;
  setMode: (mode: 'blockly' | 'monaco') => void;
  getCompiledCode: () => string;
}
```

### 5.5.3 — Full Pipeline Test
**Deliverable**: End-to-end test  
**Ước tính**: 45p

Test script (wall-follower đơn giản):
```python
def solve(robot):
    while True:
        front = robot.get_sensor('front')
        left = robot.get_sensor('left')
        
        if left > 80:
            robot.turn(-90)
        elif front > 80:
            robot.move(180)
        else:
            robot.turn(90)

solve(robot)
```

Verify: Robot di chuyển dọc theo tường trái, không đâm tường.

### 5.5.4 — Console/Log Integration
**Deliverable**: `robot.log()` → Telemetry panel  
**Ước tính**: 30p

```python
# Trong user code
robot.log("Starting navigation...")
robot.move(180)
robot.log(f"Front sensor: {robot.get_sensor('front')}mm")
```

JS side:
```typescript
micropython.jsffi.set('robot_log', (msg) => {
  telemetryStore.appendLog(String(msg), 'info');
});
```

---

## Acceptance Criteria

- [ ] Kéo thả blocks → code Python được generate đúng
- [ ] Nhấn Run → Worker khởi tạo → MicroPython chạy code → robot di chuyển
- [ ] Robot follow wall thành công trong mê cung 5×5
- [ ] Console panel hiện log từ `robot.log()`
- [ ] Error handling: code sai cú pháp → hiện lỗi rõ ràng trong UI
- [ ] Pause/Resume hoạt động trong khi code đang chạy
- [ ] Stop dừng hoàn toàn, reset robot về vị trí start