# Session Brief

> Fill this before each coding session. Đây là file đầu tiên AI agent đọc để biết mục tiêu.

---

- **Date**: 2026-05-11
- **Current Phase**: Phase 3 — MicroPython Execution Engine
- **Phase Plan**: `plan/03_PHASE_3_MICROPYTHON.md`
- **Current Tasks**: 3.1 → 3.8

## Last Session Recap

Phase 2 (Blockly + Python Codegen) đã hoàn tất:
- 6 custom blocks: move, turn, stop, set_motors, get_sensor, wall_detected
- Python generators cho cả 6 blocks (dùng `blockly/python`)
- Toolbox JSON với 6 categories (Movement, Sensors, Loops, Logic, Math, Variables)
- Blockly workspace: inject, grid/zoom/trashcan/scrollbars, ResizeObserver
- Code sync: changeListener → Zustand store → wrap `def solve(robot)`
- localStorage persistence
- Monaco Editor: Python mode, vs-dark theme
- Tab toggle Blockly ↔ Monaco
- Flyout scrollbar ẩn bằng CSS (`.blocklyFlyoutScrollbar`)
- Build/lint pass, 0 lỗi

## Today's Goal

Bắt đầu Phase 3 — MicroPython Execution Engine:
- Task 3.1: MicroPython WASM worker setup
- Task 3.2: JS ↔ Python bridge via postMessage
- Task 3.3: Robot API implementation (Python side)
- Task 3.4: Code execution with timeout
- Task 3.5: Error handling (Python exceptions → UI)
- Task 3.6: Blockly Run button
- Task 3.7: Integrate with Zustand store
- Task 3.8: Verify: code run → robot moves

## Starting Point
<!-- Check: npm run dev works? Files created? -->

- `npm run build` pass
- `npm run lint` pass (0 errors)
- Phase 2 hoàn tất, Phase 3 sẵn sàng

## Blockers

- MicroPython WASM (~500KB) hoạt động trong Worker?
- jsffi API ổn định trên v1.28?
- Async bridge (JS Promise ↔ Python coroutine)?

## Notes

- MicroPython WASM file cần copied vào public/ hoặc load từ CDN
- Robot API functions cần exposed cho Python runtime
- Timeout 30s cho user code
- Python exception → hiện lỗi, không crash Worker