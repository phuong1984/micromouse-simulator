# Micromouse Simulator - Vision

## Overview

Micromouse Simulator là một nền tảng mô phỏng robot micromouse chạy trên web.

Mục tiêu của dự án là tạo ra một môi trường trực quan cho phép:
- thiết kế mê cung (maze)
- thiết kế robot
- lập trình thuật toán điều hướng
- chạy mô phỏng
- quan sát và phân tích hành vi robot

Dự án ưu tiên:
- tính trực quan
- khả năng học tập
- khả năng mở rộng
- kiến trúc rõ ràng
- mô phỏng có tính xác định (deterministic simulation)

---

# Core Goals

## 1. Educational Platform

Hệ thống phải giúp người dùng hiểu:
- robot navigation
- pathfinding
- floodfill
- maze exploration
- coordinate systems
- simulation systems

Dự án không chỉ là “một game”, mà còn là một môi trường học tập về:
- robotics
- algorithms
- simulation
- software architecture

---

## 2. Interactive Maze Design

Người dùng phải có thể:
- tạo maze tùy chỉnh
- chỉnh sửa wall bằng chuột
- tạo maze ngẫu nhiên
- thay đổi kích thước maze
- lưu và tải maze

Maze editor cần:
- đơn giản
- trực quan
- phản hồi nhanh

---

## 3. Programmable Robot System

Robot cần hỗ trợ:
- cấu hình vị trí bắt đầu
- thay đổi hướng ban đầu
- mô phỏng sensor
- lập trình hành vi
- chạy thuật toán tự động

Trong tương lai có thể hỗ trợ:
- nhiều robot
- nhiều loại sensor
- scripting API
- AI experimentation

---

## 4. Real-Time Simulation

Simulation cần:
- chạy theo thời gian thực
- hiển thị trực quan
- hỗ trợ animation
- hỗ trợ pause/resume/reset
- hiển thị trạng thái robot

Người dùng cần dễ dàng:
- debug
- quan sát
- thử nghiệm thuật toán

---

## 5. Clean Architecture

Dự án sẽ được xây dựng theo hướng:
- module-based
- simulation-first
- separation of concerns
- extensible architecture

Các hệ thống như:
- rendering
- maze data
- robot state
- sensors
- pathfinding
- UI tools

sẽ được tách biệt rõ ràng.

---

# Long-Term Vision

Trong dài hạn, dự án có thể phát triển thành:

- nền tảng học robotics
- visual algorithm sandbox
- micromouse competition simulator
- AI experimentation environment
- educational web application

---

# Design Philosophy

Dự án ưu tiên:

- hiểu hệ thống thay vì chỉ “code chạy được”
- kiến trúc rõ ràng
- incremental development
- deterministic behavior
- visual debugging
- maintainable codebase

---

# Current Status

## Completed
- Project initialization
- Basic web app setup
- 16x16 centered grid rendering
- Stable viewport layout

## Current Phase
Simulation engine foundation.

## Next Goals
- Maze wall system
- Maze data structure
- Robot entity
- Robot movement system
