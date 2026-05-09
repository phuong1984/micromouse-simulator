# Micromouse Simulator - Roadmap

# Project Status

## Current Phase
Foundation & Simulation Core

## Current Goal
Xây dựng simulation engine ổn định trước khi phát triển các công cụ và thuật toán nâng cao.

---

# Phase 1 - Foundation

Mục tiêu:
- chuẩn hóa project structure
- tạo rendering foundation
- ổn định viewport
- xây coordinate system

## Tasks

### Project Setup
- [x] Initialize web application
- [x] Setup development environment
- [x] Setup fullscreen viewport

### Grid Rendering
- [x] Render centered 16x16 grid
- [x] Remove layout overflow
- [x] Stabilize rendering layout

### Documentation
- [x] vision.md
- [x] architecture.md
- [ ] roadmap.md
- [ ] TODO.md

---

# Phase 2 - Maze System

Mục tiêu:
- xây data model cho maze
- render wall system
- hỗ trợ chỉnh sửa maze

## Tasks

### Maze Data Structure
- [ ] Create cell model
- [ ] Create wall representation
- [ ] Create maze state container

### Wall Rendering
- [ ] Render north walls
- [ ] Render south walls
- [ ] Render east walls
- [ ] Render west walls

### Maze Editing
- [ ] Toggle walls with mouse
- [ ] Add edit mode
- [ ] Add clear maze button

### Maze Utilities
- [ ] Random maze generation
- [ ] Reset maze
- [ ] Resize maze

---

# Phase 3 - Robot System

Mục tiêu:
- tạo robot entity
- hỗ trợ movement
- hỗ trợ orientation

## Tasks

### Robot Entity
- [ ] Create robot state
- [ ] Render robot
- [ ] Render robot direction

### Movement System
- [ ] Move forward
- [ ] Rotate left
- [ ] Rotate right
- [ ] Collision detection

### Controls
- [ ] Keyboard input
- [ ] Reset robot position

---

# Phase 4 - Simulation Engine

Mục tiêu:
- tạo simulation loop
- đồng bộ update/render
- hỗ trợ timing

## Tasks

### Simulation Loop
- [ ] Create update loop
- [ ] Add delta timing
- [ ] Add frame synchronization

### Simulation Controls
- [ ] Start simulation
- [ ] Pause simulation
- [ ] Reset simulation
- [ ] Step simulation

### Animation
- [ ] Smooth robot movement
- [ ] Smooth rotation animation

---

# Phase 5 - Sensor System

Mục tiêu:
- mô phỏng perception của robot

## Tasks

### Wall Detection
- [ ] Front sensor
- [ ] Left sensor
- [ ] Right sensor

### Sensor Visualization
- [ ] Display sensor rays
- [ ] Display detected walls

### Internal Mapping
- [ ] Robot memory map
- [ ] Explored cell tracking

---

# Phase 6 - Pathfinding & AI

Mục tiêu:
- triển khai thuật toán micromouse

## Tasks

### Floodfill
- [ ] Floodfill distance map
- [ ] Goal propagation
- [ ] Path extraction

### Exploration
- [ ] Unknown maze exploration
- [ ] Dead-end handling
- [ ] Return-to-start logic

### Optimization
- [ ] Fastest path calculation
- [ ] Path compression
- [ ] Speed-run mode

---

# Phase 7 - UI & Tooling

Mục tiêu:
- biến engine thành application hoàn chỉnh

## Tasks

### Navigation
- [ ] App layout
- [ ] Navigation system
- [ ] Multi-page workflow

### Maze Editor UI
- [ ] Toolbar
- [ ] Brush tools
- [ ] Edit controls

### Robot Editor UI
- [ ] Robot configuration
- [ ] Sensor configuration

### Simulation Dashboard
- [ ] Control panel
- [ ] Debug overlays
- [ ] Performance metrics

---

# Phase 8 - Save / Load System

Mục tiêu:
- persistence và project management

## Tasks

### Maze Persistence
- [ ] Export maze JSON
- [ ] Import maze JSON

### Project Persistence
- [ ] Save project state
- [ ] Load project state

---

# Phase 9 - Advanced Features

Mục tiêu:
- mở rộng hệ thống

## Possible Features
- [ ] Multiple robots
- [ ] AI scripting API
- [ ] Competition mode
- [ ] Replay system
- [ ] Analytics tools
- [ ] WebGL renderer
- [ ] Mobile support

---

# Development Principles

Project development follows:

1. stable foundation first
2. incremental complexity
3. deterministic systems
4. modular architecture
5. visual debugging
6. maintainable code

---

# Immediate Next Tasks

## Current Focus
Maze System

## Next Technical Steps
1. Create maze data structure
2. Create wall representation
3. Render walls
4. Add wall editing
