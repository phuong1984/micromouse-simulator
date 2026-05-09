# AI Agent Context Prompt — Micromouse Simulator

> Copy prompt này vào đầu mỗi session vibe coding với AI agent.
> Thay [PHASE] và [TASK] bằng công việc cụ thể cần làm.

---

## Prompt Template

```
Tôi đang xây dựng website giáo dục Micromouse Simulator.
Đọc tài liệu dự án trong thư mục /docs trước khi code bất kỳ thứ gì.

Tài liệu tổng quan: docs/00_PROJECT_OVERVIEW.md
Tài liệu liên quan đến task này: docs/[FILE_LIÊN_QUAN].md

Tech stack: React 18 + TypeScript + Vite + Matter.js + PixiJS + Blockly + Monaco + Zustand + Tailwind CSS

Hiện tại tôi đang ở [PHASE X — Tên phase].
Task cần làm: [MÔ TẢ TASK CỤ THỂ]

Yêu cầu:
- Tuân thủ đúng TypeScript types đã định nghĩa trong docs (đặc biệt RobotSpec, MazeGrid, SimState)
- Mọi unit đo trong code: mm và gram (không dùng pixel trong logic)
- Simulation phải chạy trong Web Worker (không block UI)
- Đặt file đúng thư mục theo cấu trúc trong 00_PROJECT_OVERVIEW.md

Bắt đầu bằng cách đọc docs rồi mới viết code.
```

---

## Ví dụ cụ thể cho từng Phase

### Phase 1
```
Task: Implement MazeGrid type và render maze 5×5 lên PixiJS canvas
Docs cần đọc: 00_PROJECT_OVERVIEW.md, 02_MAZE_SYSTEM.md, 07_RENDERER.md
```

### Phase 2
```
Task: Tích hợp Matter.js, tạo robot body từ DEFAULT_ROBOT preset, chạy physics tick loop
Docs cần đọc: 03_PHYSICS_ENGINE.md, 01_ROBOT_CONFIG.md
```

### Phase 3
```
Task: Implement SensorSimulator với raycasting, hiển thị sensor rays trong PixiJS
Docs cần đọc: 04_SENSOR_SIMULATION.md, 07_RENDERER.md
```

### Phase 4
```
Task: Setup Web Worker, implement RobotAPI (move/turn/getSensor), chạy hardcoded wall-follower
Docs cần đọc: 05_CODE_SANDBOX.md, 09_DATA_FLOW.md
```

### Phase 6
```
Task: Tạo custom Blockly blocks cho Robot API, setup toolbox
Docs cần đọc: 06_BLOCKLY_EDITOR.md, 05_CODE_SANDBOX.md
```

---

## Checklist trước mỗi session

- [ ] Xác định đang ở Phase nào trong 10_MILESTONES.md
- [ ] Xác định task nhỏ cần hoàn thành (1 task = 1 session lý tưởng)
- [ ] List ra docs cần đọc (xem bảng trong 10_MILESTONES.md)
- [ ] Chạy `npm dev` để confirm app đang chạy trước khi code
- [ ] Sau khi xong: test thủ công, commit với message rõ ràng

## Conventions cho AI

Khi AI viết code cho dự án này:

1. **Luôn dùng TypeScript** — không dùng `any`, dùng types từ docs
2. **Units là mm/gram** trong tất cả logic — renderer tự scale
3. **Async/await** cho mọi Robot API method
4. **Worker boundary**: physics và sensor code chỉ trong Worker
5. **Comment tiếng Anh** trong code (dễ đọc hơn cho AI lần sau)
6. **Export types** từ `shared/types/` — không define local types mà dùng lại
