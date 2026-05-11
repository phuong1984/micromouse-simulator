# Project Tracking — Master Status

> Cập nhật lần cuối: 2026-05-11

---

## Tổng Quan

| Phase | Tên | Tasks | Ước tính | Trạng thái |
|-------|-----|-------|----------|------------|
| 0 | Setup & Infrastructure | 8 | 5h | ✅ Hoàn |
| 1 | Static Renderer | 7 | 8h | ✅ Hoàn |
| 2 | Blockly + Python Codegen | 8 | 10h | ✅ Hoàn |
| 3 | MicroPython Execution Engine | 8 | 10h | ⬜ Chưa bắt đầu |
| 4 | Physics & Simulation Loop | 8 | 8h | ⬜ Chưa bắt đầu |
| 5 | Sensor Simulation | 8 | 8h | ⬜ Chưa bắt đầu |
| 5.5 | Integration | 4 | 3h | ⬜ Chưa bắt đầu |
| 6 | Robot Config UI | 8 | 8h | ⬜ Chưa bắt đầu |
| 7 | Maze Editor | 7 | 8.5h | ⬜ Chưa bắt đầu |
| 8 | Telemetry & Replay | 10 | 9h | ⬜ Chưa bắt đầu |
| 9 | Polish & Education | 8 | 11h | ⬜ Chưa bắt đầu |
| **TỔNG** | | **84** | **~98.5h** | |

---

## Sprint Tracking

| Sprint | Phase | Kết quả dự kiến | Đã xong? |
|--------|-------|-----------------|---------|
| 1 | 0 + 1 | Project setup + static maze + robot | ✅ |
| 2 | 2 | Blockly → Python code gen | ✅ |
| 3 | 3 + 4 | MicroPython + physics hoạt động | |
| 4 | 5 + 5.5 | Sensors + integration test | |
| 5 | 6 + 7 | Config + Maze editor | |
| 6 | 8 + 9 | Telemetry + Polish | |

---

## Blockers & Risks

| # | Vấn đề | Mức độ | Trạng thái |
|---|--------|--------|------------|
| 1 | MicroPython WASM hoạt động trong Worker? | 🔴 Cao | Chưa test |
| 2 | jsffi API ổn định trên v1.28? | 🟡 Trung bình | Chưa test |
| 3 | Async bridge (JS Promise ↔ Python coroutine) hoạt động? | 🔴 Cao | Chưa test |
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

### 2026-05-11 (Session 4) — Phase 2 Polish
- **Scrollbar fix**: Ẩn Blockly flyout scrollbar bằng CSS (`.blocklyFlyoutScrollbar { display: none }`)
- **Lint fix**: Xóa `debouncedSync` unused variable trong `BlocklyEditor.tsx` (gây ESLint error)
- **Cleanup**: Xóa `useCallback` import không cần thiết, convert `syncWorkspace` thành regular function
- **Docs update**: Cập nhật `00_TRACKING.md`, `SESSION_BRIEF.md`, `TODO.md`; đánh dấu `plan/02_PHASE_2_BLOCKLY_PYTHON.md` là obsolete
- **Build status**: `npm run build` + `npm run lint` pass, sẵn sàng cho Phase 3

### 2026-05-09 (Session 2) — Phase 1 Finalization
- **Task 1.2 COMPLETED**: Draw maze walls (dùng WALL constants, outer boundaries) + start/goal markers
- **Task 1.3 COMPLETED**: Robot body (hcn xanh #1976d2) + direction arrow (trắng)
- **Task 1.4 COMPLETED**: Auto-scale computeScale() based on viewport 90%
- **Task 1.7 COMPLETED**: Window resize → recalculate scale + redraw maze
- **Bug fixes**: RenderOptions export (export type), resize không redraw maze, robot initial position sai, workerMessages.ts interface→type, PixiJS v8 deprecated constructor pattern, ResizePlugin crash, StrictMode double-mount race condition, WebGL context conflict (PixiJS tự tạo canvas riêng)
- **Phase 1 HOÀN TẤT**: Maze 5×5 + robot hiển thị đúng, auto-scale, resize OK, build/lint pass, 0 lỗi runtime