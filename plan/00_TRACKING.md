# Project Tracking — Master Status

> Cập nhật lần cuối: 2026-05-13 (Session 12)

---

## Tổng Quan

| Phase | Tên | Tasks | Ước tính | Trạng thái |
|-------|-----|-------|----------|------------|
| 0 | Setup & Infrastructure | 8 | 5h | ✅ Hoàn |
| 1 | Static Renderer | 7 | 8h | ✅ Hoàn |
| 2 | Blockly + Python Codegen | 8 | 10h | ✅ Hoàn |
| 3 | MicroPython Execution Engine | 9 | 10h | ✅ Hoàn |
| 4 | Physics & Simulation Loop | 8 | 8h | ✅ Hoàn |
| 5 | Sensor Simulation | 8 | 8h | ✅ Hoàn |
| 5.5 | Integration | 4 | 3h | ⬜ Chưa bắt đầu |
| 6 | Robot Config UI | 8 | 8h | ✅ Hoàn — tasks 6.1–6.8 done |
| 7 | Maze Editor | 10 | 11.5h | ✅ Hoàn — tasks 7.1–7.10 + polish + refactoring + grid lines |
| 8 | Telemetry & Replay | 10 | 9h | 🔄 Đang làm |
| 9 | Polish & Education | 8 | 11h | ⬜ Chưa bắt đầu |
| **TỔNG** | | **84** | **~98.5h** | |

---

## Sprint Tracking

| Sprint | Phase | Kết quả dự kiến | Đã xong? |
|--------|-------|-----------------|---------|
| 1 | 0 + 1 | Project setup + static maze + robot | ✅ |
| 2 | 2 | Blockly → Python code gen | ✅ |
| 3 | 3 | MicroPython execution engine + console + Run button | ✅ |
| 4 | 4 | Physics engine + Matter.js tick loop + robot moves | ✅ |
| 5 | 5 + 5.5 | Sensors + integration test | ✅ |
| 6 | 6 + 7 | Config + Maze editor | ✅ Sprint 6 |
| 7 | 8 + 9 | Telemetry + Polish | 🔄 Sprint 7 |

---

## Blockers & Risks

| # | Vấn đề | Mức độ | Trạng thái |
|---|--------|--------|------------|
| 1 | MicroPython WASM hoạt động trong Worker? | 🟢 Thấp | ✅ Tested: worker.format='es' + top-level await OK |
| 2 | jsffi API ổn định trên v1.28? | 🟡 Trung bình | Chưa test |
| 3 | Async bridge (JS Promise ↔ Python coroutine) hoạt động? | 🟢 Thấp | Phases 3 dùng sync stubs, Promise deferred đến Phase 4 |
| 4 | Blockly Python generator đầy đủ blocks cần dùng | 🟢 Thấp | ✅ Đã implement |
| 5 | Matter.js trong Worker (không dùng DOM) | 🟢 Thấp | Đã design |

---

## Daily Notes

### 2026-05-09 (Session 1)
- Đã đọc toàn bộ 12 file tài liệu trong docs/micromouse_docs/
- Chọn MicroPython WASM thay Pyodide (nhẹ hơn 20 lần, đủ tính năng)
- Quyết định: Blockly → Python, lưu workspace vào localStorage
- Chấp thuận: Tailwind CSS setup ngay từ Phase 0
- Tất cả code thử nghiệm sẽ bị xóa khi bắt đầu Phase 0
- Đã tạo 11 file plan chi tiết trong plan/
- **Task 0.1 COMPLETED**: Tạo src/main.tsx và src/app/App.tsx, project compile được
- **Task 0.2 COMPLETED**: Fix PostCSS config (CJS format), Tailwind config ready
- **Task 0.3-0.5 AUTO-COMPLETED**: node_modules và folder structure đã tồn tại sẵn
- **Task 0.6 COMPLETED**: Tạo 5 shared types files (maze.ts, robot.ts, simulation.ts, workerMessages.ts, telemetry.ts)
- **Task 0.7 COMPLETED**: Tạo robot-presets.ts, maze-presets.ts
- **Task 0.8 COMPLETED**: Tạo maze utility functions (hasWall, setWall, removeWall, cellToWorld, mazeToWallSegments)
- **Phase 0 HOÀN TẤT**: Project infrastructure sẵn sàng cho Phase 1 (Static Renderer)
- **Task 1.1 COMPLETED**: Tạo SimulationRenderer.ts với 3-layer scene graph (mazeLayer, robotLayer, overlayLayer), API init/loadMaze/updateFrame/reset/destroy/resize, auto-scale computeScale()
- **Task 1.5 COMPLETED**: Tạo 3-column layout trong App.tsx với CSS (config-panel, canvas-panel, code-panel)
- **Task 1.6 COMPLETED**: Integrate SimulationRenderer vào React App, loadMaze với MAZE_5x5_SIMPLE, robot ở vị trí start

### 2026-05-10 (Session 3) — Phase 2 Blockly + Python Codegen
- **Task 2.1 COMPLETED**: Tạo `robotBlocks.ts` với 6 custom blocks (move, turn, stop, set_motors, get_sensor, wall_detected)
- **Task 2.2 COMPLETED**: Python generators cho 6 blocks, dùng `pythonGenerator.forBlock` từ `blockly/python`
- **Task 2.3 COMPLETED**: Toolbox JSON với 6 categories (Di chuyển, Cảm biến, Lặp, Điều kiện, Toán học, Biến), shadow blocks với giá trị mặc định
- **Task 2.4 COMPLETED**: `BlocklyEditor.tsx` — inject workspace, grid/zoom/trashcan/scrollbars, ResizeObserver, cleanup
- **Task 2.5 COMPLETED**: Code sync — changeListener → generate Python → Zustand store → wrap `def solve(robot)`
- **Task 2.6 COMPLETED**: localStorage persistence — save XML on change, load on init
- **Task 2.7 COMPLETED**: Tab toggle Blockly ↔ Monaco trong App.tsx, buttons + conditional render
- **Task 2.8 COMPLETED**: `MonacoEditor.tsx` — @monaco-editor/react, Python mode, vs-dark theme, editable
- **Verify**: `npm run build` ✅, `npm run lint` ✅, `npm run dev` ✅ (port 3001)
- **Verify**: `npm run build` ✅, `npm run lint` ✅, `npm run dev` ✅ (port 3001)
- **Phase 2 HOÀN TẤT**: Blockly workspace + Python codegen + Monaco editor, build/lint pass, 0 lỗi

### 2026-05-11 (Session 4) — Phase 3 MicroPython Execution Engine
- **Task 3.1 COMPLETED**: Worker skeleton + MicroPython WASM load (`simulation.worker.ts`)
- **Task 3.2 COMPLETED**: JS↔Python bridge via `registerJsModule('robot', ...)` — stub functions (move, turn, stop, set_motor_speeds, get_sensor, get_position, get_angle, log)
- **Task 3.3 COMPLETED**: `runPythonAsync()` execution with auto `import robot` + execute code gốc (không double-wrap)
- **Task 3.4 COMPLETED**: Robot functions là sync (không Promise) — vì Phase 3 chưa có physics loop, avoid async complexity
- **Task 3.5 COMPLETED**: Message protocol (START/STOP/RESET + FINISHED/PYTHON_ERROR/READY) + SimulationStore Zustand
- **Task 3.6 COMPLETED**: Error handling: try/catch → `PYTHON_ERROR` message → console panel hiện đỏ
- **Task 3.7 COMPLETED**: Console output: stdout → logBuffer → gửi kèm `FINISHED.logs` → TelemetryStore → ConsolePanel
- **Task 3.8 COMPLETED**: Run ▶ / Stop ⏹ / Reset ↺ buttons + status-aware UI
- **Bugs fixed during Phase 3**:
  - WASM MIME error → import `.wasm?url` + `worker.format: 'es'` trong Vite config
  - Log không hiện → forward `logs: string[]` trong `FinishedPayload`
  - Log in 2 lần → worker tự wrap code sai (`def solve` → thêm `solve(robot)` nữa)
- **Types defined**: `FinishedPayload.logs`, `WorkerToMain.READY`, `micropython.mjs` type declaration
- **New files**: `src/workers/simulation.worker.ts`, `src/workers/types.d.ts`, `src/modules/simulation/store.ts`, `src/modules/telemetry/store.ts`, `src/modules/telemetry/ConsolePanel.tsx`, `src/modules/telemetry/index.ts`
- **Modified files**: `src/app/App.tsx` (Run button + ConsolePanel), `src/app/App.css`, `vite.config.ts`, `src/shared/types/workerMessages.ts`
- **Verify**: `npm run lint` ✅, `npm run build` ✅ (micropython.wasm 446KB, worker 78KB)
- **Phase 3 HOÀN TẤT**: MicroPython WASM load trong Worker, robot API stub, console output, Run/Stop/Reset UI, build/lint pass

### 2026-05-11 (Session 5) — Phase 4 Physics Engine + Simulation Loop
- **Bug fixes**: Renderer drawWalls bottom/right boundary sai → fixed; mazeToWallSegments south/east centers sai + thiếu north boundary → fixed
- **Task 4.1 COMPLETED**: `physicsWorld.ts` — createPhysicsWorld (gravity=0), addMazeWalls (static bodies), addGoalZone (sensor), setupGoalDetection (collisionStart)
- **Task 4.2 COMPLETED**: `robotBody.ts` — createRobotBody (rectangle mass=150g→0.15kg), extractRobotState, setRobotPosition
- **Task 4.3 COMPLETED**: `motorModel.ts` — applyMotorForces (differential drive PD controller, traction limit, localToWorld)
- **Task 4.4 COMPLETED**: `sensorSimulator.ts` — stub class
- **Task 4.5 COMPLETED**: `simulation.worker.ts` — rewritten with physics lifecycle: initPhysics → startTickLoop (60fps setTimeout) → checkPendingMoves → STATE_UPDATE
- **Task 4.6 COMPLETED**: Keyboard control (Arrow key listener in App.tsx → KEYBOARD msg → worker sets motor speeds)
- **Task 4.7 COMPLETED**: Goal detection (collisionStart event → FINISHED)
- **Task 4.8 COMPLETED**: Async robot API (move/turn return Promise, pendingMoves checked each tick)
- **Types fixed**: Added frictionCoeff/position to WheelSpec, updated store to send DEFAULT_ROBOT + MAZE_5x5_SIMPLE in START payload
- **New files**: physicsWorld.ts, robotBody.ts, motorModel.ts, sensorSimulator.ts
- **Modified files**: simulation.worker.ts (rewrite), store.ts, App.tsx, workerMessages.ts, robot.ts, SimulationRenderer.ts, maze.ts
- **Verify**: `npm run build` ✅, `npm run lint` ✅

### 2026-05-12 (Session 6) — Phase 4 Finalization + Critical Fixes
- **Critical bug fix**: Robot body không được add vào Matter.js world → thêm `Matter.Composite.add(engine.world, robotPhysics.body)` trong `initPhysics()`
- **Debug cleanup**: Xóa direct-force test code, debug logging (mass/isStatic/frictionAir), reduced tick position logging
- **Fix**: Maze wall segments + renderer positions (north boundary, south/east centers)
- **Bugs discovered and squashed**:
  - Matter.js Verlet: force phải scale với dt² (277.78) vì `Δv = F/m·dt²`
  - Wheel positions đặt sai trục (Y-offset thay vì X-offset) → robot không quay
  - `setAngularVelocity(body, av·0.95)` vô hiệu — bị Body.update ghi đè + gây instability
  - `maxTorque=1.5` quá nhỏ (terminal ~90 mm/s) → tăng lên 10 (~600 mm/s)
  - RPM magic numbers → hằng số `FORWARD_RPM`, `TURN_RPM`, `DIAGONAL_INNER_RPM`
- **Toolbox**: Blockly set_motors default RPM 2400→1200
- **Phase 4 CHÍNH THỨC HOÀN TẤT**: Physics simulation (60fps) + keyboard + async robot API + goal detection + motor model data-driven
- **Verify**: `npm run build` ✅, `npm run lint` ✅

### 2026-05-12 (Session 7) — Phase 5 Sensor Simulation
- **Task 5.1-5.2 COMPLETED**: `sensorSimulator.ts` rewritten with `castRay()`, `rayLineSegmentIntersect()`, `wallCorners()`, `SensorSimulator` class
- **Task 5.3 COMPLETED**: `gaussianRandom()` Box-Muller transform, noise applied với stddev = distance × noiseLevel
- **Task 5.4 COMPLETED**: FOV multi-ray casting (5 rays trong cone, take min)
- **Task 5.5 COMPLETED**: SensorSimulator created trong `initPhysics()`, `sensorSim.update()` gọi mỗi tick sau `Engine.update`
- **Task 5.6 COMPLETED**: `sensors` field trong SimState populated với real readings, `latestSensorReadings` cache cho Python API
- **Task 5.7 COMPLETED**: `drawSensorRays()` trong PixiJS — lines từ sensor position, màu xanh (`0x44ff44`) nếu no hit, đỏ (`0xff4444`) nếu hit + dot tại hit point
- **Task 5.8 COMPLETED**: Checkbox "Show sensor rays" trong canvas toolbar, `showSensorRays` state → RenderOptions
- **Types added**: `SensorSpec.fov`, `SensorSpec.noiseLevel`
- **Cleanup**: Removed `[stop]`, `[set_motor_speeds]`, collision debug logs; `get_sensor` now computes on-the-fly (không dùng cache) để trả về real-time reading ngay từ tick đầu
- **Verify**: `npm run build` ✅, `npm run lint` ✅
- **Phase 5 CHÍNH THỨC HOÀN TẤT**: Ray casting + noise + FOV + Python API + visualization + toggle

### 2026-05-11 (Session 4) — Phase 2 Polish
- **Scrollbar fix**: Ẩn Blockly flyout scrollbar bằng CSS (`.blocklyFlyoutScrollbar { display: none }`)
- **Lint fix**: Xóa `debouncedSync` unused variable trong `BlocklyEditor.tsx` (gây ESLint error)
- **Cleanup**: Xóa `useCallback` import không cần thiết, convert `syncWorkspace` thành regular function
- **Docs update**: Cập nhật `00_TRACKING.md`, `SESSION_BRIEF.md`, `TODO.md`; đánh dấu `plan/02_PHASE_2_BLOCKLY_PYTHON.md` là obsolete
- **Build status**: `npm run build` + `npm run lint` pass, sẵn sàng cho Phase 3

### 2026-05-12 (Session 8) — Phase 6 Robot Config UI
- **Created robot-config/store.ts**: Zustand store with spec + CRUD (add/update/remove) for motors, wheels, sensors + base update + preset save/load/delete with localStorage
- **Created robot-config/validation.ts**: validateRobotSpec() — range checks, motor/wheel linkage, duplicate sensor IDs
- **Created robot-config/RobotPreview.tsx**: SVG top-down preview — cell 180×180mm, base rect/circle, motor dots, wheel rects, sensor dots + arrow + FOV cone
- **Created robot-config/RobotConfig.tsx**: Config form with sub-tabs (Base/Motors/Wheels/Sensors) + NumberField/SelectField components + preset dropdown + save/load/delete
- **Updated robot-config/index.ts**: exports store, components, validation
- **Updated App.tsx**: 2-tab navigation (Config/Simulation) — config shows RobotConfig + RobotPreview side-by-side; simulation shows code (left 30%) + canvas (right 70%)
- **Updated App.css**: New layout — app-tabs, config-layout, config-panel styling, card-based form sections, preset management
- **Updated simulation/store.ts**: Uses `useRobotConfigStore.getState().spec` instead of hardcoded DEFAULT_ROBOT — custom robot config flows into simulation
- **Phase 6 tasks completed**: 6.1 (layout), 6.2 (SVG preview), 6.3 (CRUD), 6.4 (base fields), 6.5 (validation)
- **Phase 6 remaining completed (2026-05-12)**: 6.6, 6.7, 6.8
  - **6.6**: Dynamic Blockly sensor dropdown — `robotBlocks.ts` exports `updateSensorDropdowns()`, `App.tsx` subscribes to sensor changes and syncs to `robot_get_sensor` and `robot_wall_detected` blocks via `menuGenerator`
  - **6.7**: Presets polish — "Default" button loads DEFAULT_ROBOT, Save button disabled when name empty, all preset controls disabled during simulation
  - **6.8**: Config disabled when running — `simStatus` from simulation store, `disabled={running}` passed to all NumberField/SelectField components and buttons
- **Front sensor bug fix**: Negated Y in `sensorSimulator.ts:readSensor()` coordinate conversion (`+ sY * sin` / `- sY * cos`) so spec Y+ = forward maps to physics -Y at angle=0
- **Verify**: `npm run build` ✅, `npm run lint` ✅

### 2026-05-12 (Session 9) — Phase 6 Cleanup + Validation Fixes

- **Base width/height max 200→180**: validation.ts + RobotConfig.tsx NumberField max props updated
- **Wheel pos X/Y clamping**: `min={-spec.base.width/2} max={spec.base.width/2}`, same for Y
- **Sensor pos X/Y clamping**: same bounds as wheels (within base dimensions)
- **Sensor maxRange max=180**: NumberField + validation updated
- **Sensor FOV max=90**: NumberField `max={360}→{90}`, validation added
- **Validation.ts expanded**: wheel position, sensor position, sensor maxRange, sensor fov bounds
- **Docs updated**: SESSION_BRIEF.md, plan/06_PHASE_6_ROBOT_CONFIG.md, docs/CONFIG_EFFECTS.md, 00_TRACKING.md
- **Phase 6 CHÍNH THỨC HOÀN TẤT**: tasks 6.1–6.8 + all validation cleanup
- **Verify**: `npm run build` ✅, `npm run lint` ✅

### 2026-05-12 (Session 10) — Phase 7 Maze Editor

- **generate.ts**: randomized DFS (recursive backtracker) maze generation + difficulty modifiers (easy: remove 30% walls, medium: perfect maze, hard: add 20% dead-ends). Seeded PRNG for deterministic output.
- **store.ts**: Zustand store with mazeGrid, savedPresets (localStorage), history/future stacks, editMode. CRUD: setRows/setCols (clear inner walls), toggleWall, setStart/setGoal, undo/redo, loadPreset, savePreset/deletePreset, generateMaze, exportMaze/importMaze, resetToDefault, reachable (BFS).
- **MazeRenderer.ts**: PixiJS class — 5 layers (floor, grid lines, walls, markers, hover). Draw outer walls (always present) + inner walls from cell bitmask. Mouse interaction: hover highlight nearest edge (wall mode) or cell (start/goal mode), click to toggle/set. 10px hit threshold.
- **MazeConfigPanel.tsx**: Left column form — rows/cols (3-20) inputs, start/goal number inputs, edit mode toggle buttons (Wall/Start/Goal), undo/redo buttons, presets dropdown (9 generated presets 5×5/8×8/16×16 × easy/medium/hard + saved), save preset with name, auto-generate buttons (Easy/Medium/Hard), export JSON (clipboard), import JSON (file or paste), BFS reachability indicator.
- **MazeEditor.tsx**: Container with config-layout (left panel + right canvas). Creates MazeRenderer on mount, updates on mazeGrid/editMode changes.
- **App.tsx**: Added "🧩 Maze Editor" tab between Config and Simulation tabs. 3-tab navigation.
- **App.css**: Added .config-left-panel, .config-right-panel, .config-panel-scroll, .config-section, .config-label-row, .config-mode-btn styles.
- **simulation/store.ts**: READY handler now reads mazeGrid from useMazeStore instead of hardcoded MAZE_5x5_SIMPLE.
- **maze-presets.ts**: Added MAZE_8x8_STANDARD (8×8 empty maze).
- **shared/utils/maze.ts**: Added isReachable() BFS — returns { reachable, steps }.
- **Verify**: `npm run build` ✅, `npm run lint` ✅

### 2026-05-13 (Session 11) — Phase 7 Polish + BR Corner Fix
- **Hard maze unreachable fix**: `generateMaze` hard difficulty → `findPathCells()` BFS approach — chỉ thêm walls vào cells không trên start→goal path, đảm bảo reachable 100%
- **Visual polish**: unified wall color (bỏ OUTER_WALL_COLOR), removed corner fills, minScale=2.5/12, outer wall repositioned outside cells, background color `#394359`, RobotPreview dashed cell `#767D8C`
- **Corner extensions**: NORTH extend LEFT/RIGHT khi WEST/EAST adjacent, WEST extend DOWN khi SOUTH adjacent
- **BR corner cross-cell fix**: `hasWall(r-1,c,EAST) || hasWall(r,c,EAST)` cho NORTH right extension; `hasWall(r,c-1,SOUTH) || hasWall(r,c,SOUTH)` cho WEST down extension — fix cả MazeRenderer.ts và SimulationRenderer.ts
- **SimulationRenderer**: sceneContainer centering, drawMarkers trước drawWalls
- **MazeEditor**: Ctrl+Z/Y, drag toggle, ResizeObserver→window resize revert
- **MazeConfigPanel**: download file export, file picker import, bỏ input number start/goal
- **Verify**: `npm run build` ✅, `npm run lint` ✅

### 2026-05-09 (Session 2) — Phase 1 Finalization
- **Task 1.2 COMPLETED**: Draw maze walls (dùng WALL constants, outer boundaries) + start/goal markers
- **Task 1.3 COMPLETED**: Robot body (hcn xanh #1976d2) + direction arrow (trắng)
- **Task 1.4 COMPLETED**: Auto-scale computeScale() based on viewport 90%
- **Task 1.7 COMPLETED**: Window resize → recalculate scale + redraw maze
- **Bug fixes**: RenderOptions export (export type), resize không redraw maze, robot initial position sai, workerMessages.ts interface→type, PixiJS v8 deprecated constructor pattern, ResizePlugin crash, StrictMode double-mount race condition, WebGL context conflict (PixiJS tự tạo canvas riêng)
- **Phase 1 HOÀN TẤT**: Maze 5×5 + robot hiển thị đúng, auto-scale, resize OK, build/lint pass, 0 lỗi runtime

### 2026-05-13 (Session 12) — Phase 7 Hoàn Tất + Refactoring
- **Refactoring — Batch 1 (Trivial)**:
  - `shared/constants/render-colors.ts`: WALL_COLOR, FLOOR_COLOR, START_COLOR, GOAL_COLOR, GRID_LINE_COLOR
  - `cloneCells()` moved to `shared/utils/maze.ts`
- **Refactoring — Batch 2 (Low risk)**:
  - `shared/utils/export-import.ts`: downloadJson(), readFileAsText()
  - `shared/components/NumberField.tsx`: unified với integer?, inputClassName?
- **Refactoring — Batch 3 (Moderate)**:
  - `drawMazeMarkers()` — shared function với alpha/circleSize options
  - `shared/utils/preset-storage.ts`: generic loadSavedPresets<T>(), persistPresets<T>()
  - Cả 2 stores updated (maze, robot-config)
- **Refactoring — Batch 4 (Complex)**:
  - `shared/utils/pixi-utils.ts`: createPixiApp(), destroyPixiApp(), resizePixiRenderer()
  - Cả 2 renderers (MazeRenderer, SimulationRenderer) updated
- **Wheel bounds**: Dynamic min/max — posX ±(baseWidth-wheelWidth)/2, posY ±(baseHeight/2-radius), radius max = baseHeight/2-|posY|, width max = baseWidth-2*|posX|. NumberField auto-clamp qua useEffect (removed per user request, only onBlur + red visual feedback)
- **Base width/height**: max=168mm (cell 180 - wall 12)
- **Grid lines**: `drawMazeGridLines()` — dashed lines using `addDashedLine` (batch all segments → single stroke). Visible on top of walls. Bỏ perimeter lines. Shared color (0x888888).
- **Simulation markers đè walls**: fix draw order (walls trước markers)
- **Consumers updated**: MazeConfigPanel, RobotConfig, maze/store, robot-config/store, MazeRenderer, SimulationRenderer
- **Verify**: `npm run build` ✅, `npm run lint` ✅
- **Phase 7 CHÍNH THỨC HOÀN TẤT**: tasks 7.1–7.10 + polish + refactoring + grid lines
- **Phase 8 sẵn sàng**: Telemetry & Replay