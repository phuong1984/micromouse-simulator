# Phase 9 — Polish & Education

> **Goal**: Trải nghiệm giáo dục hoàn chỉnh, onboarding, hints, examples
> **Ước tính**: 11h
> **Input**: Tất cả phase trước hoàn thành
> **Output**: App hoàn chỉnh, sẵn sàng sử dụng

---

## Completed: ✅

- [x] 9.1 — Tutorial/onboarding flow
- [x] 9.2 — Hint system
- [x] 9.3 — Example programs
- [x] 9.4 — Flood-fill overlay
- [x] 9.5 — Responsive layout
- [x] 9.6 — Theme toggle
- [x] 9.7 — Keyboard shortcuts
- [x] 9.8 — Share URL (encode/decode base64, QR code dialog, auto-restore on load)

---

## Task Details

### 9.1 — Tutorial/Onboarding
**Deliverable**: Step-by-step stepper cho first-time users  
**Ước tính**: 2h

Steps:
1. Chào mừng + giới thiệu mục đích app
2. Giới thiệu mê cung + giải thích cell/wall
3. Cấu hình robot (giải thích từng parameter)
4. Viết code đầu tiên (Blockly drag-drop)
5. Chạy simulation
6. Giải thích sensor readings
7. Kết quả + khuyến khích thử lại

Tech: React Joyride hoặc custom stepper component

### 9.2 — Hint System
**Deliverable**: Gợi ý khi robot kẹt quá lâu  
**Ước tính**: 1.5h

Detect conditions:
- Robot không di chuyển sau N giây → "Thử dùng get_sensor() để kiểm tra tường phía trước"
- Robot quay vòng → "Thử turn() rồi move()"
- Robot đâm tường nhiều lần → "Kiểm tra sensor trước khi move"

### 9.3 — Example Programs
**Deliverable**: Bộ code mẫu có giải thích  
**Ước tính**: 1.5h

```python
# 1. Wall Follower (Left Hand Rule)
def solve(robot):
    while True:
        if robot.get_sensor('left') > 80:
            robot.turn(-90)
            robot.move(180)
        elif robot.get_sensor('front') > 80:
            robot.move(180)
        else:
            robot.turn(90)

solve(robot)

# 2. Simple Explorer
# 3. Flood-Fill (advanced)
```

Mỗi example kèm: mô tả thuật toán, giải thích từng dòng, visualization.

### 9.4 — Flood-Fill Overlay
**Deliverable**: Hiện số distance trong từng ô  
**Ước tính**: 1.5h

- Tính flood-fill distance từ goal
- Hiện số trong từng cell trên overlay
- Toggle on/off

Algorithm:
```
1. Đặt goal cell = 0
2. BFS lan tỏa: mỗi ô kề (không có wall giữa) = current + 1
3. Render số lên canvas
```

### 9.5 — Responsive Layout
**Deliverable**: Mobile/tablet support cơ bản  
**Ước tính**: 2h

- Màn hình nhỏ: layout xếp chồng (Config → Canvas → Code stack)
- Canvas scale down proportionally
- Touch support cho maze editor

### 9.6 — Theme Toggle
**Deliverable**: Dark/Light mode  
**Ước tính**: 1h

Tailwind dark mode class strategy:
```html
<html class="dark">
<!-- toggle thêm/xóa class "dark" -->
```

Define light theme colors, swap body background + panel colors.

### 9.7 — Keyboard Shortcuts
**Deliverable**: Phím tắt  
**Ước tính**: 30p

| Phím | Chức năng |
|------|----------|
| Space | Run / Pause |
| R | Reset |
| S | Stop |
| Ctrl+Z | Undo (maze) |
| Ctrl+Y | Redo (maze) |
| F11 | Fullscreen |

### 9.8 — Share URL
**Deliverable**: Encode config + maze + code vào URL  
**Ước tính**: 1.5h

```typescript
function encodeState(robotSpec, mazeGrid, pythonCode): string {
  const data = {
    r: robotSpec,
    m: { cells: mazeGrid.cells, start: mazeGrid.start, goal: mazeGrid.goal },
    c: pythonCode
  };
  return btoa(JSON.stringify(data));
}

function decodeState(hash: string) {
  return JSON.parse(atob(hash));
}
```

Use URL hash fragment: `https://app.com/#<base64data>`

---

## Acceptance Criteria

- [x] Onboarding flow chạy lần đầu (có skip option)
- [x] Hint system detect stuck robot, gợi ý hữu ích
- [x] 5 example programs hoạt động
- [x] Flood-fill overlay toggle on/off
- [x] App usable trên mobile (responsive)
- [x] Dark/light mode toggle hoạt động
- [x] Keyboard shortcuts hoạt động
- [x] Share URL encode/decode đúng, load state từ URL

---

## Polish Checklist

- [ ] Performance: 60fps, không memory leak
- [ ] Accessibility: alt text, ARIA labels, keyboard navigable
- [ ] Error boundaries: crash-safe UI
- [ ] Loading states: skeleton screens, spinners
- [ ] Tooltips trên tất cả interactive elements
- [ ] Consistent naming conventions (Vietnamese UI)
- [ ] Unit tests cho core utils (hasWall, setWall, mazeToWallSegments)