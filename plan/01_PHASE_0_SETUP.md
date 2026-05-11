# Phase 0 — Setup & Infrastructure

> **Goal**: Project sẵn sàng để code, tất cả types, presets, utils đã định nghĩa.
> **Ước tính**: 5h
> **Input**: Project hiện tại (code thử nghiệm sẽ bị xóa)
> **Output**: Project structure hoàn chỉnh, Tailwind hoạt động, types sẵn sàng

---

## Completed: ✅

- [x] 0.1 - Initialize Vite + React + TypeScript
- [x] 0.2 - Setup Tailwind CSS
- [x] 0.3 - Install core dependencies (node_modules đã có sẵn)
- [x] 0.4 - Install MicroPython WASM (đã có trong package.json)
- [x] 0.5 - Create full directory structure (đã tạo folders)
- [x] 0.6 - Define all shared types
- [x] 0.7 - Create presets
- [x] 0.8 - Implement shared/utils/maze.ts

---

## Task Details

### 0.1 — Initialize Vite + React + TypeScript
**Deliverable**: Project compile được  
**Ước tính**: 30p  
**Status**: ✅ COMPLETED

Đã tạo:
- `src/main.tsx` — React bootstrap, mount `App`, import `index.css`
- `src/app/App.tsx` — Root component với Tailwind test classes

**Lưu ý**: Project đã có cấu trúc `src/modules/`, `src/shared/`, `src/workers/` sẵn nên chỉ bổ sung entry points, không chạy lại `npm create vite@latest` để giữ nguyên structure.

### 0.2 — Setup Tailwind CSS
**Deliverable**: Tailwind directives hoạt động, test class hiển thị đúng  
**Ước tính**: 1.5h  
**Status**: ✅ COMPLETED

Files đã có/cập nhật:
- `tailwind.config.ts` — ✅ có custom colors (maze-wall, maze-floor, accent, etc.)
- `postcss.config.cjs` — ✅ Fixed: dùng CommonJS (`module.exports`, `require()`) để tránh ESM conflict
- `src/index.css` — ✅ có @tailwind directives, global styles
- `src/app/App.tsx` — ✅ test Tailwind classes (`bg-maze-floor`, `text-accent`)

**Note**: `"type": "module"` trong package.json gây ra lỗi ESM cho PostCSS config `.js` file → Đổi thành `.cjs` (CommonJS).

**Blockly version fix**: Cập nhật `@blockly/core` và `@blockly/field-dropdown` từ `^10.0.0` → `^10.10.0`, `@blockly/python` từ `^4.0.0` → `^4.2.0` vì versions cũ không tồn tại trên npm registry.

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'maze-wall': '#2d2d2d',
        'maze-floor': '#f5f5f0',
        'robot-body': '#1976d2',
        'sensor-hit': '#ff4444',
        'sensor-miss': '#44ff44',
        'accent': '#6366f1',
        'accent-bg': 'rgba(99, 102, 241, 0.1)',
        'accent-border': 'rgba(99, 102, 241, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  margin: 0; padding: 0;
  width: 100%; height: 100%;
  overflow: hidden;
  background: #1e1e1e;
}
*, *::before, *::after { box-sizing: border-box; }
```

### 0.3 — Install Core Dependencies
**Deliverable**: `package.json` có đầy đủ deps  
**Ước tính**: 1h  
**Status**: ⚠️ BLOCKER RESOLVED

**Blockly packages đã fix**:
| Package cũ | Package mới | Lý do |
|------------|-------------|-------|
| `@blockly/core@^10.0.0` | `blockly@^12.5.1` | @blockly/* không tồn tại, dùng gói chính thức |
| `@blockly/field-dropdown@^10.0.0` | (được bỏ - đã có trong blockly) | |
| `@blockly/python@^4.0.0` | (được loại bỏ) | Không tồn tại, sẽ implement Python generator tự động |

**Package.json hiện tại**:
```json
{
  "dependencies": {
    "blockly": "^12.5.1",
    "@micropython/micropython-webassembly-pyscript": "^1.28.0-preview.233",
    "@monaco-editor/react": "^4.6.0",
    "matter-js": "^0.20.0",
    "pixi.js": "^8.18.1",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "zustand": "^5.0.0"
  }
}
```

```bash
npm install pixi.js matter-js zustand @monaco-editor/react
npm install -D @blockly/core @blockly/python @blockly/field-dropdown typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals @types/node @types/react @types/react-dom
```

Verify trong `package.json`:
```json
{
  "dependencies": {
    "pixi.js": "^8.18.1",
    "matter-js": "^0.20.0",
    "zustand": "^5.0.0",
    "@monaco-editor/react": "^4.6.0",
    "@blockly/core": "^10.0.0",
    "@blockly/python": "^4.0.0",
    "@blockly/field-dropdown": "^10.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@types/node": "^24.12.2"
  }
}
```

### 0.4 — Install MicroPython WASM
**Deliverable**: `@micropython/micropython-webassembly-pyscript` trong package.json  
**Ước tính**: 30p

```bash
npm install @micropython/micropython-webassembly-pyscript@1.28.0-preview-233
```

Verify: package.json có `@micropython/micropython-webassembly-pyscript: "^1.28.0-preview-233"`

Test đơn giản:
```typescript
// test_micropython.ts
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript/micropython.mjs';

async function test() {
  const micropython = await loadMicroPython();
  const result = micropython.runPython('print(1 + 1)');
  console.log('MicroPython test:', result);
}
```

### 0.5 — Create Full Directory Structure
**Deliverable**: Tất cả folder và placeholder files tồn tại  
**Ước tính**: 30p

```bash
mkdir -p src/app src/modules/robot-config src/modules/maze src/modules/code-editor
mkdir -p src/modules/simulation src/modules/renderer src/modules/telemetry
mkdir -p src/shared/types src/shared/constants src/shared/utils src/workers
```

Tạo placeholder `index.ts` trong mỗi module folder.

### 0.6 — Define All Shared Types
**Deliverable**: 5 type files, compile không lỗi  
**Ước tính**: 1.5h  
**Status**: ✅ COMPLETED

**Files created**:
| File | Types |
|------|-------|
| `src/shared/types/maze.ts` | `Wall`, `MazeGrid`, `CellPos`, `WALL` constant |
| `src/shared/types/robot.ts` | `RobotSpec`, `BaseSpec`, `MotorSpec`, `WheelSpec`, `SensorSpec`, `Vector2D` |
| `src/shared/types/simulation.ts` | `SimState`, `WallSegment`, `RobotState`, `SimStatus` |
| `src/shared/types/workerMessages.ts` | `MainToWorker`, `WorkerToMain` union types |
| `src/shared/types/telemetry.ts` | `PathPoint`, `LogEntry`, `TelemetryState` |

**Wall bitmask**: NORTH=8, EAST=4, SOUTH=2, WEST=1  
**Cell size**: 180mm (IEEE standard)  
**Units**: mm, gram

| File | Nội dung |
|------|----------|
| `src/shared/types/maze.ts` | `Wall`, `MazeGrid`, `CellPos`, `WALL` constant |
| `src/shared/types/robot.ts` | `RobotSpec`, `BaseSpec`, `MotorSpec`, `WheelSpec`, `SensorSpec`, `Vector2D` |
| `src/shared/types/simulation.ts` | `SimState`, `WallSegment`, `SimStatus` |
| `src/shared/types/workerMessages.ts` | `MainToWorker`, `WorkerToMain` union types |
| `src/shared/types/telemetry.ts` | `PathPoint`, `LogEntry` |

Phải thống nhất:
- `Wall.NORTH = 8`, `Wall.EAST = 4`, `Wall.SOUTH = 2`, `Wall.WEST = 1`
- `MazeGrid.cells: number[][]` — mảng 2D `[row][col]`
- `MazeGrid.start: CellPos`, `MazeGrid.goal: CellPos`
- `SimState.sensors: Record<string, number>` — sensorId → distance (mm), -1 nếu ngoài range

### 0.7 — Create Presets
**Deliverable**: 2 preset files  
**Ước tính**: 30p

`src/shared/constants/robot-presets.ts`:
- `DEFAULT_ROBOT`: 80×80mm, 150g, 2 motors, 2 wheels, 5 IR sensors

`src/shared/constants/maze-presets.ts`:
- `MAZE_5x5_SIMPLE`: 5×5 với start góc trái dưới, goal góc phải trên
- `MAZE_16x16_STANDARD`: placeholder

### 0.8 — Implement shared/utils/maze.ts
**Deliverable**: Helper functions hoạt động  
**Ước tính**: 1h

Functions:
- `hasWall(grid, row, col, direction): boolean`
- `setWall(grid, row, col, direction): void` — cập nhật cả ô kề
- `removeWall(grid, row, col, direction): void`
- `cellToWorld(grid, row, col): { x, y }` — cell center → world coords
- `mazeToWallSegments(grid): WallSegment[]` — chỉ NORTH + WEST + boundary

---

## Acceptance Criteria

- [ ] `npm run dev` khởi động thành công
- [ ] Tailwind classes hoạt động (test `bg-maze-wall`, `text-accent`...)
- [ ] TypeScript compile không lỗi
- [ ] Tất cả types import được giữa các files
- [ ] `shared/utils/maze.ts` functions export và test được
- [ ] Project structure đúng `src/modules/...`