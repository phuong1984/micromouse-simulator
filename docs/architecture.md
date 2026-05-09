# Micromouse Simulator - Architecture

# High-Level Architecture

Hệ thống được thiết kế theo hướng:

- simulation-first
- modular architecture
- separation of concerns
- deterministic state updates

Project sẽ tách rõ:
- simulation engine
- rendering
- UI tools
- robot systems
- maze systems
- algorithm systems

---

# Main Application Structure

```text
App
├── Navigation Layer
│
├── Maze Editor
├── Robot Editor
├── Code Workspace
├── Simulation Runner
├── Analytics / Debug Tools
│
└── Shared Project State
