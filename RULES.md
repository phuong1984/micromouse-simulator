# RULES.md — Nguyên tắc cho AI Agent khi code

> **Đọc file này trước mỗi session code.**
> Tích hợp từ Karpathy Guidelines + quy ước riêng của Micromouse Simulator.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Trước khi code:
- Phát biểu giả định rõ ràng. Nếu không chắc chắn → hỏi.
- Nếu có nhiều cách hiểu → trình bày tất cả, đừng chọn im.
- Nếu có cách đơn giản hơn → đề xuất. Đẩy lại khi cần thiết.
- Nếu điều gì đó không rõ → dừng lại. Đặt tên cho điều gây nhầm lẫn. Hỏi.

**Ví dụ cho project này:**
- Không chắc `Wall.NORTH = 8` hay `NORTH = 1`? → Check `plan/00_PROJECT_OVERVIEW.md` → type đã định nghĩa trong `shared/types/maze.ts`.
- Không chắc MicroPython có hỗ feature X không? → Check docs hoặc hỏi trước khi implement.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- Không code feature ngoài yêu cầu.
- Không tạo abstraction cho code dùng 1 lần.
- Không thêm "flexibility" hoặc "configurability" không được yêu cầu.
- Không xử lý error cho scenario không thể xảy ra.
- Nếu viết 200 lines mà có thể 50 lines → viết lại.

**Tự hỏi**: "Một senior engineer có nói đây là overcomplicated không?" Nếu có → đơn giản hóa.

**Ví dụ cho project này:**
- Viết `shared/utils/maze.ts` chỉ chứa functions thật sự cần dùng.
- Nếu `WallSegment` struct đủ dùng → không tạo class phức tạp.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

Khi edit code đã có:
- Không "improve" code lân cận, comments, hoặc formatting.
- Không refactor thứ không bị lỗi.
- Match existing style, dù bạn thích style khác.
- Nếu thấy dead code không liên quan → nhắc đến, đừng xóa.

Khi changes tạo ra orphan code:
- Remove imports/variables/functions mà **changes của bạn** tạo ra.
- Không remove dead code đã tồn tại trước đó (trừ khi được yêu cầu).

**Kiểm tra**: Mỗi dòng thay đổi phải truy ngược trực tiếp đến yêu cầu.

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Biến task thành mục tiêu có thể verify:
- "Thêm validation" → "Viết test cho input invalid, sau đó pass"
- "Fix bug" → "Viết test reproduce bug, sau đó pass"
- "Refactor X" → "Đảm bảo test pass trước và sau"

Cho multi-step task, liệt kê plan ngắn:
```
1. [Bước] → verify: [kiểm tra gì]
2. [Bước] → verify: [kiểm tra gì]
3. [Bước] → verify: [kiểm tra gì]
```

Mục tiêu mạnh cho phép AI agent tự loop. Mục tiêu yếu ("make it work") → cần liên tục hỏi lại.

---

## 5. Project-Specific Rules

### 5.1 TypeScript Strict
- Không dùng `any`. Dùng types từ `shared/types/`.
- TypeScript compile không lỗi trước khi commit.

### 5.2 No Cross-Module Imports
- Modules giao tiếp qua: shared types, Zustand stores, postMessage.
- `simulation/` KHÔNG import từ `renderer/` và ngược lại.

### 5.3 Simulation Runs in Worker
- Mọi logic vật lý, sensor, Python execution → `workers/simulation.worker.ts`
- Main thread: React UI + PixiJS rendering + Zustand stores
- Worker KHÔNG có quyền truy cập DOM, window, localStorage

### 5.4 Units: mm and Gram
- Tất cả logic dùng mm và gram.
- Renderer tự convert sang pixel qua scale factor.
- Không hardcode pixel values trong simulation code.

### 5.5 Deterministic Simulation
- Cùng input → cùng output (replay requirement).
- KHÔNG dùng `Date.now()` hoặc `Math.random()` trong simulation logic.
- Noise được xử lý explicit trong `SensorSimulator` (seed cố định hoặc không dùng random).

### 5.6 Async Robot API
- Mọi Robot API method trả về Promise: `robot.move()`, `robot.turn()`, `robot.stop()`.
- Trong MicroPython: dùng `await robot.move(180)`.
- JS side: pending move resolve khi target đạt.

### 5.7 Code Organization
- Một file = một concern.
- Types trong `shared/types/`, không define local.
- Comment tiếng Anh trong code.
- Blockly block labels bằng Tiếng Việt (UX giáo dục).

### 5.8 Error Handling
- Validate input trước khi chạy simulation.
- Catch Python exceptions → gửi error message về main thread.
- Timeout 30s cho user code.
- Matter.js errors → catch và forward.

---

## Quick Checklist Before Committing Code

- [ ] Đã đọc task tương ứng trong `plan/` ?
- [ ] TypeScript compile không lỗi?
- [ ] Không có `any` types?
- [ ] Không import chéo giữa modules?
- [ ] Units đúng (mm / gram)?
- [ ] Deterministic (không dùng Date.now / Math.random)?
- [ ] Mục tiêu (goal) đã đạt theo acceptance criteria?
- [ ] Code comment bằng tiếng Anh?
- [ ] Test thủ công trước khi commit?