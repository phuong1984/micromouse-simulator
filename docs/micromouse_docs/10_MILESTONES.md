# 10 — Milestones & Build Order

## Nguyên tắc vibe coding

- Mỗi phase phải **chạy được và demo được** trước khi qua phase tiếp
- Không build feature mà chưa cần — YAGNI
- Test bằng mắt trước khi viết unit test
- Mỗi PR / commit tương ứng một task nhỏ trong phase

---

## Phase 1 — Foundation & Static Render
**Mục tiêu**: Hiển thị maze + robot tĩnh trên canvas. Không có physics, không có code.

### Tasks

- [ ] Setup Vite + React + TypeScript + Tailwind
- [ ] Cài đặt PixiJS, khởi tạo canvas cơ bản
- [ ] Implement `MazeGrid` type + `MAZE_5x5_SIMPLE` preset
- [ ] Implement `mazeToWallSegments()`
- [ ] Render maze lên PixiJS (walls + start/goal markers)
- [ ] Implement `RobotSpec` type + `DEFAULT_ROBOT` preset
- [ ] Render robot hình chữ nhật ở vị trí start, đúng tỉ lệ
- [ ] Auto-scale maze vừa viewport
- [ ] Layout 3 cột: [Config Panel] [Canvas] [Code Panel]

**Done khi**: Chạy `npm dev`, thấy maze 5×5 với robot xanh ở góc trái dưới.

---

## Phase 2 — Physics & Manual Control
**Mục tiêu**: Robot có vật lý thực, điều khiển được bằng keyboard.

### Tasks

- [ ] Cài đặt Matter.js
- [ ] `createPhysicsWorld()` — engine, no gravity
- [ ] `createRobotBody()` từ RobotSpec
- [ ] `addMazeWalls()` từ WallSegments
- [ ] Implement motor force application (`applyMotorForces`)
- [ ] Tick loop: Matter.Engine.update() → post state → render
- [ ] Keyboard control tạm: Arrow keys → set motorSpeeds
- [ ] Renderer update từ SimState (position + rotation)
- [ ] Collision với tường hoạt động

**Done khi**: Dùng arrow keys điều khiển robot, robot va chạm với tường và không đi xuyên.

---

## Phase 3 — Sensor Simulation
**Mục tiêu**: Cảm biến hoạt động, hiển thị sensor rays.

### Tasks

- [ ] Implement `castRay()` và `raySegmentIntersect()`
- [ ] `SensorSimulator` class
- [ ] Tích hợp sensor update vào tick loop
- [ ] Thêm `sensors` vào `SimState`
- [ ] Render sensor rays (màu xanh/đỏ) trong PixiJS
- [ ] Sensor Panel UI (hiển thị readings với progress bar)
- [ ] Toggle hiện/ẩn sensor rays

**Done khi**: Robot di chuyển, sensor rays hiện đúng, đọc đúng khoảng cách tường.

---

## Phase 4 — Web Worker & Robot API
**Mục tiêu**: Chạy JavaScript code trong Worker, Robot API hoạt động.

### Tasks

- [ ] Setup Web Worker (`simulation.worker.ts`)
- [ ] Message protocol `MainToWorker` / `WorkerToMain`
- [ ] Move physics + sensor logic vào Worker
- [ ] `RobotAPI` class với `move()`, `turn()`, `getSensor()`, `setMotorSpeeds()`
- [ ] `runUserCode()` — Function constructor sandbox
- [ ] `SimulationStore` (Zustand) — start/stop/pause
- [ ] Nút [▶ Run] [⏸ Pause] [⏹ Stop]
- [ ] Test với hardcoded user code (wall-follower đơn giản)
- [ ] Error handling: user code crash → hiện lỗi, không crash app

**Done khi**: Paste wall-follower code, nhấn Run, robot tự chạy giải mê cung.

---

## Phase 5 — Monaco Code Editor
**Mục tiêu**: Editor đẹp với syntax highlighting, autocomplete Robot API.

### Tasks

- [ ] Cài đặt Monaco Editor
- [ ] Configure với JavaScript mode
- [ ] Thêm TypeScript definitions cho `robot` object (để có autocomplete)
- [ ] "Run" button lấy code từ editor
- [ ] Console log panel (robot.log + user errors)
- [ ] Syntax error highlight inline
- [ ] Default code template khi mở lần đầu

**Done khi**: Viết code trong editor đẹp, có gợi ý `robot.move(`, nhấn Run chạy được.

---

## Phase 6 — Blockly Editor
**Mục tiêu**: Kéo thả blocks, generate JS, chạy được.

### Tasks

- [ ] Cài đặt Blockly
- [ ] Custom blocks: `robot_move`, `robot_turn`, `robot_get_sensor`, `robot_wall_detected`, `robot_set_motors`, `robot_stop`, `robot_get_angle`
- [ ] Toolbox config (đầy đủ categories)
- [ ] Tab toggle giữa Blockly ↔ Monaco
- [ ] "Xem code JS" từ Blockly
- [ ] Lưu/load workspace XML vào localStorage

**Done khi**: Kéo thả blocks tạo wall-follower, nhấn Run, chạy được.

---

## Phase 7 — Robot Config UI
**Mục tiêu**: User tùy chỉnh robot, config ảnh hưởng simulation.

### Tasks

- [ ] Config panel với tabs: Base / Motors / Wheels / Sensors
- [ ] SVG preview top-down real-time
- [ ] Add/remove motors, wheels, sensors
- [ ] Validate config trước khi run
- [ ] Sensor ID sync với Blockly dropdown
- [ ] Save/load presets (localStorage)
- [ ] Preset selector (Basic / Fast / Custom)

**Done khi**: Thêm sensor mới vào config, dùng trong Blockly, chạy đúng.

---

## Phase 8 — Maze Editor
**Mục tiêu**: User tạo maze tùy ý.

### Tasks

- [ ] Maze editor Canvas (click toggle wall)
- [ ] Drag để vẽ tường liên tục
- [ ] Right-click set Start / Goal
- [ ] Undo/redo (immer + stack)
- [ ] Preset selector (5×5, 8×8, 16×16)
- [ ] Validate maze (goal reachable từ start — BFS)
- [ ] Serialize/deserialize maze (URL params để share)

**Done khi**: Vẽ maze mới, chạy simulation trong maze đó.

---

## Phase 9 — Telemetry & Replay
**Mục tiêu**: Dashboard đầy đủ, replay runs.

### Tasks

- [ ] Motor panel (target vs actual RPM)
- [ ] Position/heading mini chart
- [ ] Replay recorder trong Worker (sample mỗi 3 ticks)
- [ ] Replay player (slider + play/pause)
- [ ] Export replay JSON
- [ ] Thời gian hoàn thành + best time lưu localStorage
- [ ] Speed multiplier (0.5×, 1×, 2×, 4×)

**Done khi**: Chạy xong, xem lại replay, thấy đường đi.

---

## Phase 10 — Polish & Education
**Mục tiêu**: Trải nghiệm giáo dục hoàn chỉnh.

### Tasks

- [ ] Tutorial/onboarding flow (stepper)
- [ ] Hint system (gợi ý khi robot bị kẹt lâu)
- [ ] Example programs (wall-follower, flood-fill intro)
- [ ] Flood-fill number overlay (hiện số trong từng ô)
- [ ] Responsive layout (mobile-friendly cơ bản)
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Share URL (encode robot + maze + code vào URL)

---

## Thứ tự đọc docs khi implement

| Phase | Đọc trước |
|---|---|
| 1 | 00_PROJECT_OVERVIEW, 02_MAZE_SYSTEM, 07_RENDERER |
| 2 | 03_PHYSICS_ENGINE, 01_ROBOT_CONFIG |
| 3 | 04_SENSOR_SIMULATION |
| 4 | 05_CODE_SANDBOX, 09_DATA_FLOW |
| 5 | 05_CODE_SANDBOX |
| 6 | 06_BLOCKLY_EDITOR |
| 7 | 01_ROBOT_CONFIG |
| 8 | 02_MAZE_SYSTEM |
| 9 | 08_TELEMETRY |
| 10 | Tất cả |
