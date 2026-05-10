# Session Brief

> Fill this before each coding session. Đây là file đầu tiên AI agent đọc để biết mục tiêu.

---

- **Date**: 2026-05-09
- **Current Phase**: Phase 2 — Blockly + Python Codegen
- **Phase Plan**: `plan/03_PHASE_2_BLOCKLY.md`
- **Current Tasks**: 2.1 → 2.8

## Last Session Recap

Phase 1 (Static Renderer) đã hoàn tất:
- SimulationRenderer với 3-layer scene graph (mazeLayer, robotLayer, overlayLayer)
- Maze 5×5 vẽ đúng: walls (WALL.NORTH/WEST constants), outer boundaries, start/goal markers
- Robot (hcn xanh #1976d2 + mũi tên trắng) ở đúng ô start
- Auto-scale theo viewport (90%), resize redraw cả maze + robot
- 3-column layout (Config | Canvas | Code)
- PixiJS v8 dùng pattern `new Application()` + `await app.init()` (tránh deprecated constructor và ResizePlugin crash)
- PixiJS tự tạo canvas, không dùng `view` option (tránh WebGL context conflict với StrictMode)
- `npm run build` + `npm run lint` pass, 0 lỗi runtime

## Today's Goal

Bắt đầu Phase 2 — Blockly + Python Codegen:
- Task 2.1: Cài đặt Blockly workspace trong `code-editor/`
- Task 2.2: Tạo custom robot blocks (move, turn, sensor)
- Task 2.3: Tạo toolbox (Tiếng Việt labels)
- Task 2.4: Python code generator cho robot blocks
- Task 2.5: Monaco Editor tab
- Task 2.6: Code editor store (Zustand)
- Task 2.7: Kết nối Blockly ↔ Monaco (2-way sync)
- Task 2.8: Verify Blockly → Python output

## Starting Point
<!-- Check: npm run dev works? Files created? -->

- `npm run build` pass
- `npm run dev` → hiển thị maze + robot
- Các file trong `src/modules/code-editor/` chưa tồn tại

## Blockers

- Blockly v12 API (2025) cần kiểm tra compatibility với React 19 StrictMode
- Blockly types cho TypeScript 6.0 cần verify

## Notes

- Blockly labels: Tiếng Việt
- Python generator output: snake_case
- Workspace lưu vào localStorage
- KHÔNG import chéo từ modules khác