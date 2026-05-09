Tôi đề xuất structure như sau

#Tạo thư mục:

project-root/
│
├── docs/
│   ├── vision.md
│   ├── architecture.md
│   ├── roadmap.md
│   ├── maze-system.md
│   ├── robot-system.md
│   └── simulation-loop.md
│
├── src/
│
├── README.md
│
└── TODO.md

#Vai trò của từng file

##vision.md

Trả lời:

“chúng ta đang xây cái gì?”

Ví dụ:

educational micromouse platform
visual simulator
programmable robots
custom maze editor

##architecture.md

Mô tả:

module
navigation
state flow
engine design

Đây là “bộ não” của project.

##roadmap.md

Danh sách phase:

[ ] Grid rendering
[ ] Wall system
[ ] Robot entity
[ ] Movement
[ ] Sensors
[ ] Floodfill
[ ] Maze editor
[ ] Save/load

##TODO.md

Task ngắn hạn hiện tại.

Ví dụ:

- Add robot render
- Add keyboard movement
- Add wall data structure


#Tôi đề xuất workflow từ giờ
Mỗi khi hoàn thành một phần:

update:

roadmap.md
architecture.md
TODO.md
Mỗi khi mở chat mới:

bạn chỉ cần paste:

Read:
- docs/vision.md
- docs/architecture.md
- docs/roadmap.md

Current phase:
- simulation engine foundation

Current completed:
- centered 16x16 grid render

Current task:
- maze wall system

=> là đủ để tiếp tục rất chính xác.
