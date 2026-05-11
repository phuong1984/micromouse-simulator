# Phase 3 — MicroPython Execution Engine

> **Goal**: MicroPython WASM chạy trong Web Worker, Robot API hoạt động, user code execute được
> **Ước tính**: 10h
> **Input**: Phase 2 (Blockly generate Python), Phase 0 (types, utils)
> **Output**: Paste Python code → nhấn Run → robot thực thi lệnh

---

## Completed: ✅

- [ ] 3.1 — Load MicroPython WASM trong Worker
- [ ] 3.2 — Test MicroPython chạy code đơn giản
- [ ] 3.3 — Tạo JS ↔ Python bridge
- [ ] 3.4 — Implement Robot API (JS side)
- [ ] 3.5 — Test async: await robot.move()
- [ ] 3.6 — Execute user Python code
- [ ] 3.7 — Error handling
- [ ] 3.8 — Message protocol implementation

---

## Task Details

### 3.1 — Load MicroPython WASM trong Worker
**Deliverable**: `micropython.mjs` loaded in Worker, WASM ready  
**Ước tính**: 1.5h

```typescript
// workers/simulation.worker.ts

let micropython = null;

async function initMicroPython() {
  const { loadMicroPython } = await import(
    '@micropython/micropython-webassembly-pyscript/micropython.mjs'
  );
  
  micropython = await loadMicroPython({});
}

self.onmessage = async (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'START':
      await handleStart(payload);
      break;
    // ...
  }
};
```

**Kiểm tra**: `micropython.runPython('print("Hello from MicroPython")')` → "Hello from MicroPython"

### 3.2 — Test MicroPython Code
**Deliverable**: Chạy code Python cơ bản  
**Ước tính**: 30p

Test cases:
```python
print("Hello")
print(1 + 1)
import math
print(math.sqrt(4))
x = 10
print(x * 2)
```

### 3.3 — JS ↔ Python Bridge
**Deliverable**: `jsffi.set()` cho mỗi Robot API function  
**Ước tính**: 2h

Inject JS functions vào MicroPython global scope:

```typescript
function setupRobotAPI(micropython, state) {
  micropython.jsffi.set('robot_move', (distance) => {
    return new Promise((resolve) => {
      state.pendingMoves.push({
        type: 'distance',
        targetDistance: Math.abs(distance),
        direction: Math.sign(distance),
        resolve,
      });
      state.motorSpeeds.left = Math.sign(distance) * 2400;
      state.motorSpeeds.right = Math.sign(distance) * 2400;
    });
  });

  micropython.jsffi.set('robot_turn', (angle) => {
    return new Promise((resolve) => {
      state.pendingMoves.push({
        type: 'angle',
        targetAngle: state.angle + (angle * Math.PI / 180),
        resolve,
      });
      state.motorSpeeds.left = angle > 0 ? 1200 : -1200;
      state.motorSpeeds.right = angle > 0 ? -1200 : 1200;
    });
  });

  micropython.jsffi.set('robot_get_sensor', (sensorId) => {
    return state.currentSensorReadings[sensorId] ?? -1;
  });

  micropython.jsffi.set('robot_stop', () => {
    state.motorSpeeds.left = 0;
    state.motorSpeeds.right = 0;
  });

  micropython.jsffi.set('robot_set_motor_speeds', (left, right) => {
    state.motorSpeeds.left = left;
    state.motorSpeeds.right = right;
  });

  micropython.jsffi.set('robot_get_position', () => {
    return micropython.jsffi.toJs({ x: state.x, y: state.y });
  });

  micropython.jsffi.set('robot_get_angle', () => {
    return state.angle * 180 / Math.PI;
  });

  micropython.jsffi.set('robot_log', (msg) => {
    state.logs.push(String(msg));
  });

  micropython.jsffi.set('sleep_ms', (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  });
}
```

### 3.4 — Robot API Execution Model
**Deliverable**: Hiểu rõ cách blocking API hoạt động  
**Ước tính**: 1.5h

Design:
```
MicroPython code:
  robot.move(180)    ← Gọi JS function → trả về Promise
  
  MicroPython engine:
    .runPythonAsync() → gặp await → pause coroutine
    Tick loop chạy độc lập → cập nhật position
    Khi pending move resolve → coroutine resume
```

MicroPython WASM hỗ trợ `asyncio` native. Khi JS trả về Promise, MicroPython tự động await.

### 3.5 — Async Test
**Deliverable**: Code Python async hoạt động  
**Ước tính**: 1.5h

```python
# Test code
robot.move(180)
robot.turn(90)
robot.move(180)
print("Done!")
```

Verify: Robot đi 1 ô, quay phải, đi tiếp 1 ô, in "Done!" ra console.

### 3.6 — Execute User Python Code
**Deliverable**: Nhận code string → execute  
**Ước tính**: 1h

```typescript
async function runUserCode(micropython, codeString) {
  try {
    const wrappedCode = codeString.includes('def solve')
      ? codeString + '\nsolve(robot)\n'
      : codeString;
    
    await micropython.runPythonAsync(wrappedCode);
    
    postMessage({ type: 'FINISHED', payload: { elapsedMs: state.elapsedMs } });
  } catch (err) {
    const traceback = micropython.runPython(
      'import sys; sys.print_exception(sys.last_value)'
    );
    postMessage({
      type: 'PYTHON_ERROR',
      payload: { message: err.message, traceback }
    });
  }
}
```

### 3.7 — Error Handling
**Deliverable**: Python exception → error message → main thread  
**Ước tính**: 1h

Error types:
- SyntaxError → highlight in Monaco editor
- RuntimeError → show in console panel
- Timeout → auto-stop after 30s

### 3.8 — Message Protocol Implementation
**Deliverable**: Handle START, PAUSE, RESUME, STOP messages  
**Ước tính**: 45p

```typescript
self.onmessage = async (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'START':
      await handleStart(payload);
      break;
    case 'PAUSE':
      isPaused = true;
      break;
    case 'RESUME':
      isPaused = false;
      scheduleTick();
      break;
    case 'STOP':
      isRunning = false;
      isPaused = false;
      cleanup();
      break;
  }
};
```

---

## Acceptance Criteria

- [ ] MicroPython WASM load thành công trong Worker
- [ ] `print("Hello")` chạy đúng trong Worker console
- [ ] `robot.move(180)` gọi từ Python → robot di chuyển
- [ ] `robot.get_sensor('front')` trả về giá trị chính xác
- [ ] `robot.turn(90)` quay robot tại chỗ
- [ ] Python error → message gửi về main thread
- [ ] PAUSE/RESUME dừng và tiếp tục simulation
- [ ] STOP dừng hoàn toàn, cleanup resources