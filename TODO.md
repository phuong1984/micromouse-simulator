# Micromouse Simulator - TODO

# Current Focus

Maze System Foundation

Mục tiêu hiện tại:
- tạo data structure cho maze
- render wall system
- chuẩn bị cho maze editor

---

# High Priority

## Maze Data Structure

- [ ] Create `Maze` object
- [ ] Create `Cell` model
- [ ] Define wall representation
- [ ] Generate empty 16x16 maze

### Notes

Mỗi cell cần chứa:
- north wall
- south wall
- east wall
- west wall

Ví dụ:

```js
{
  north: false,
  south: false,
  east: false,
  west: false
}
