# Micromouse Simulator — Project Overview

## Mục tiêu dự án

Website giáo dục tương tác cho phép người dùng:
1. **Cấu hình** một robot micromouse (kích thước, cảm biến, động cơ, bánh xe)
2. **Lập trình** robot bằng kéo thả (Blockly) hoặc dòng lệnh (Monaco Editor)
3. **Chạy mô phỏng** — robot giải mê cung, tìm đường từ điểm xuất phát đến đích nhanh nhất

---

## Tech Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Frontend Framework | React 18 + TypeScript | Vite build tool |
| Physics Engine | Matter.js | 2D rigid body, có thể migrate sang Rapier WASM sau |
| Renderer | PixiJS v8 | WebGL-accelerated, 60fps |
| Block Editor | Google Blockly | Custom blocks cho Robot API |
| Text Editor | Monaco Editor | VS Code engine, autocomplete |
| State Management | Zustand | Lightweight, phù hợp simulation state |
| Code Sandbox | Web Worker + iframe sandbox | Cô lập user code |
| Styling | Tailwind CSS | Utility-first |

---

## Cấu trúc thư mục dự án

```
micromouse-sim/
├── src/
│   ├── app/                    # React app entry, routing, layout
│   ├── modules/
│   │   ├── robot-config/       # Module cấu hình robot
│   │   ├── maze/               # Module maze editor + data model
│   │   ├── code-editor/        # Blockly + Monaco editor
│   │   ├── simulation/         # Physics engine, sensor sim, execution loop
│   │   ├── renderer/           # PixiJS rendering layer
│   │   └── telemetry/          # Panels hiển thị dữ liệu real-time
│   ├── shared/
│   │   ├── types/              # TypeScript interfaces dùng chung
│   │   ├── constants/          # Hằng số vật lý, config mặc định
│   │   └── utils/              # Helper functions
│   └── workers/
│       └── simulation.worker.ts  # Web Worker chạy user code
├── public/
└── docs/                       # Thư mục này — tài liệu kỹ thuật
```

---

## Các tài liệu chi tiết

Đọc theo thứ tự sau khi cần implement một module:

| File | Nội dung |
|---|---|
| `01_ROBOT_CONFIG.md` | Cấu trúc data model robot, UI config panel |
| `02_MAZE_SYSTEM.md` | Maze grid, wall bitmask, editor, serialization |
| `03_PHYSICS_ENGINE.md` | Matter.js setup, motor model, collision |
| `04_SENSOR_SIMULATION.md` | Raycasting IR, encoder, gyro simulation |
| `05_CODE_SANDBOX.md` | Web Worker bridge, Robot API, execution loop |
| `06_BLOCKLY_EDITOR.md` | Custom blocks, code generation, toolbox |
| `07_RENDERER.md` | PixiJS scene graph, layers, animation |
| `08_TELEMETRY.md` | Real-time panels, replay system |
| `09_DATA_FLOW.md` | Luồng dữ liệu toàn hệ thống, event bus |
| `10_MILESTONES.md` | Thứ tự xây dựng, Phase breakdown |

---

## Luồng hoạt động tổng quan

```
[User cấu hình Robot] → RobotConfig (type: RobotSpec)
        ↓
[User vẽ/chọn Maze]  → MazeData (type: MazeGrid)
        ↓
[User viết code]      → source code (Blockly XML hoặc JS string)
        ↓
[Nhấn Run]
        ↓
  CodeTranspiler → JS string
        ↓
  Web Worker nhận RobotSpec + MazeGrid + JS code
        ↓
  Simulation Engine khởi tạo:
    - Physics world (Matter.js bodies từ RobotSpec)
    - Maze walls (static bodies từ MazeGrid)
    - Sensor instances (từ RobotSpec.sensors)
        ↓
  Execution Loop (60fps tick):
    - User code gọi Robot API (move, turn, getSensor...)
    - API commands → physics forces/torques
    - Physics step forward
    - Sensor readings cập nhật
    - State → postMessage → Main thread
        ↓
  PixiJS Renderer vẽ frame
  Telemetry Panel cập nhật
```

---

## Nguyên tắc thiết kế

- **Mỗi module độc lập**: Không import chéo giữa các module, giao tiếp qua shared types và event bus
- **Simulation chạy trong Web Worker**: Main thread chỉ render và nhận state updates
- **Robot API là async**: Mọi lệnh robot đều trả Promise, user code dùng async/await
- **Config-driven**: Mọi thứ về robot đều từ `RobotSpec` — không hardcode
- **Deterministic simulation**: Cùng code + cùng RobotSpec + cùng Maze → cùng kết quả (để replay)
