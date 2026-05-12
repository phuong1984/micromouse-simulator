# Ảnh hưởng của Config lên Di chuyển Robot

> Các công thức dựa trên physics model hiện tại (Matter.js Verlet integration, PD controller).

---

## Base

| Config | Ảnh hưởng | Công thức | Forward | Turn |
|--------|-----------|-----------|:-------:|:----:|
| `mass` | inertia (cản thay đổi vận tốc) | `I ∝ mass` | ↓ nhẹ (PD bù) | ↓ |
| `width` | inertia (cản xoay) | `I ∝ width²` | — | ↓ |
| `height` | inertia (cản xoay) | `I ∝ height²` | — | ↓ |
| `shape` | chỉ visual | — | — | — |

> `I = (1/12) × mass × (width² + height²)` — Moment of inertia của rectangle body.

---

## Wheel (includes motor parameters)

> MotorSpec đã merge vào WheelSpec — mỗi wheel có maxRPM, maxTorque, gearRatio riêng.

| Config | Ảnh hưởng | Công thức | Forward | Turn |
|--------|-----------|-----------|:-------:|:----:|
| `maxRPM` | tốc độ tối đa motor trong wheel | `cmd = min(targetRPM, maxRPM)` | ↑ tỉ lệ | ↑ tỉ lệ |
| `maxTorque` | lực kéo tối đa ở bánh | `F_max = torque × gear / radius / dt²` | — (đủ thừa) | — (đủ thừa) |
| `gearRatio` | giảm speed, tăng torque | `speed_wheel = cmdRPM / gear`<br>`torque_wheel = maxTorque × gear` | ↓ | ↑ |
| `radius` | quãng đường di chuyển mỗi vòng | `v = (RPM/60) × 2π × radius` | ↑ | — |
| `radius` | lực kéo (cùng torque) | `F = torque / radius` | — | ↓ |
| `position.x` | đòn bẩy xoay (turning lever arm) | `τ = 2 × F × |x|` | — | ↑ |
| `position.y` | đòn bẩy forward lệch | `τ = F × y` | — | ảnh hưởng nhẹ |
| `width` | chỉ visual | — | — | — |
| `frictionCoeff` | **chưa implement** | — | — | — |

> Tác động kép của `radius`: radius lớn → forward nhanh hơn (cùng RPM) NHƯNG lực kéo yếu hơn (cùng torque). Hiệu ứng thuần trên forward là tăng nhẹ.

> `position.x` càng xa tâm → mô-men xoay càng lớn → turn càng nhanh. Forward không bị ảnh hưởng.

---

## Sensor

| Config | Ảnh hưởng | Ghi chú |
|--------|-----------|---------|
| `type` | **chưa dùng** | IR / Ultrasonic / Encoder đều chạy raycasting giống nhau |
| `position` | vị trí đặt sensor (Y+ = forward) | Ảnh hưởng kết quả đo |
| `angle` | hướng sensor so với forward | Ảnh hưởng hướng đo |
| `maxRange` | tầm xa tối đa | Giới hạn khoảng cách trả về |
| `fov` | góc quét (độ) | Nếu > 0, phát 5 tia trong góc quét, lấy min |
| `noiseLevel` | nhiễu (tỉ lệ với khoảng cách) | `stddev = distance × noiseLevel`, Box-Muller |

> Sensor không ảnh hưởng đến di chuyển — chỉ đọc distance.

---

## Hardcoded (không trong UI config)

| Parameter | File | Giá trị | Ảnh hưởng |
|-----------|------|---------|-----------|
| `frictionAir` | `robotBody.ts` | `0.06` | Damping vận tốc (cả linear và angular) mỗi tick: `v ×= 1 - frictionAir`. Giảm → turn nhanh hơn đáng kể, forward hơi tăng. |
| `Kp` | `motorModel.ts` | `0.3` | Hệ số PD controller: `F = Kp × velError × mass / dt²`. Càng cao → đáp ứng càng nhanh, dễ overshoot. |
| `positionIterations` | `physicsWorld.ts` | `10` | Matter.js solver iterations. |
| `velocityIterations` | `physicsWorld.ts` | `8` | Matter.js solver iterations. |

---

## Tóm tắt: muốn điều chỉnh

| Mục tiêu | Làm gì |
|----------|--------|
| ↑ forward, giữ nguyên turn | ↑ `maxRPM` |
| ↑ turn, giữ nguyên forward | ↑ `wheel[].position.x` (dời bánh ra xa) hoặc giảm `frictionAir` (nhưng cũng ảnh hưởng forward nhẹ) |
| ↑ cả hai | ↑ `maxRPM` |
| Giữ forward, thay đổi turn | ↑ `wheel[].position.x` + chỉnh `maxRPM` để giữ forward (hoặc dùng `gearRatio` bù) |
