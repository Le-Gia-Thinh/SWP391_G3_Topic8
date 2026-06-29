# Check-in & Booking — Tất cả trường hợp được xử lý

> **Giả sử booking mẫu:** StartTime = 14:00, EndTime = 18:00.
> Tất cả giờ theo **múi giờ Việt Nam (UTC+7)**.

---

## A. Check-in đặt trước (Booking Check-in)

Hệ thống 3 tầng theo thời gian đến so với `StartTime` của booking.

### Vùng thời gian

```
12:30       13:00          13:45     14:00          15:00
  |           |              |         |              |
  [ QUÁ SỚM  ][ SỚM CÓ PHÍ ][ ĐÚNG HẠN][ ĐÚNG GIỜ / TRỄ ][ NO-SHOW ]
  >60 phút    15–60 phút    <15 phút   0–60 phút trễ          >60 phút trễ
```

### Các trường hợp

| Case | Đến lúc | Sớm/Trễ | Label hiển thị | Kết quả | Error code |
|------|---------|---------|---------------|---------|------------|
| **A1** | 11:30 | Sớm 150 phút | Quá sớm | ❌ Blocked — 2 lựa chọn | `CHECKIN_TOO_EARLY` |
| **A2** | 13:15 | Sớm 45 phút | Đến sớm (Có phụ phí) | ✅ Vào được, cộng **+5.000đ** | — |
| **A3** | 13:50 | Sớm 10 phút | **Đúng hạn** | ✅ Vào được, miễn phí | — |
| **A4** | 14:05 | Trễ 5 phút | Đúng giờ | ✅ Bình thường | — |
| **A5** | 14:40 | Trễ 40 phút | Đến trễ | ✅ Vào được, cảnh báo vàng | — |
| **A6** | 15:10 | Trễ 70 phút | No-show | ❌ Booking → `Expired` | `CHECKIN_NO_SHOW` |

### Ranh giới chính xác

- **Đúng 15 phút sớm** → `earlyFee` (tính phí). Dùng `diffMin <= -15`.
- **Dưới 15 phút sớm** (`diffMin < 0 && diffMin > -15`) → `grace` = **Đúng hạn**, miễn phí.
- **Đúng 60 phút sớm** → cửa sổ check-in mở (đầu vùng earlyFee).
- **Đúng 60 phút trễ** → no-show (vượt giới hạn).

### Tại sao "Đúng hạn" thay vì "Ân hạn"?

Đến sớm dưới 15 phút là hoàn toàn bình thường — không phải "đặc ân". 
Label **Đúng hạn** truyền đạt rõ: khách đến trong khung giờ cho phép, check-in được, không phí thêm.

### Constants (staffService.js)

```js
const EARLY_CHECKIN_MIN = 60   // quá sớm nếu đến trước > 60 phút
const LATE_CHECKIN_MIN  = 60   // no-show nếu đến trễ > 60 phút
const GRACE_PERIOD_MIN  = 15   // đến sớm 0–14 phút: miễn phí (đúng hạn)
const EARLY_FEE_FLAT    = 5000 // phụ phí cố định nếu đến sớm 15–60 phút
```

---

## A1 Chi tiết — Trường hợp Quá Sớm (tooEarly)

Khi `diffMin < -EARLY_CHECKIN_MIN` (đến trước hơn 60 phút), staff thấy 2 lựa chọn:

### Option A — Chờ

- Hiển thị countdown **HH:MM:SS** đếm ngược đến lúc cửa sổ mở (StartTime − 60 phút).
- Khi countdown về 0, UI **tự chuyển** sang giao diện "Đến sớm (Có phụ phí)".
- Ví dụ: Đến lúc 11:30, booking 14:00 → cửa sổ mở lúc 13:00 → countdown `01:30:00`.

### Option B — Walk-in ngay

Luồng: hủy booking + tạo session vãng lai trong 1 transaction.

1. Staff chọn **Building → Floor → Zone → Slot** trên grid.
2. AI gợi ý slot tối ưu (`smartSuggestSlot`).
3. Validate slot: loại xe đúng, không bị occupied/blocked, không có booking sắp đến.
4. Booking gốc → `Cancelled`. Session walk-in mới được tạo ngay.

**Lỗi có thể xảy ra:**

| Error code | Ý nghĩa |
|------------|---------|
| `SLOT_CONFLICT` | Slot đã có xe hoặc booking sắp đến |
| `SLOT_NOT_AVAILABLE` | Slot đang bảo trì / bị khóa |
| `SLOT_VEHICLE_TYPE_MISMATCH` | Loại xe không khớp với slot |
| `NO_SLOTS_AVAILABLE` | Không còn slot trống (bãi đầy) |
| `NOT_ELIGIBLE_FOR_WALK_IN_OVERRIDE` | Booking đã trong khung check-in, không cần walk-in |

---

## B. Trường hợp đặc biệt khi Check-out

### B1 — Vào sớm nhưng ra sớm → Miễn phụ phí

**Điều kiện đủ cả 3:**
1. Có `EarlyFeeAmount > 0` (đã bị tính phụ phí lúc check-in).
2. Giờ ra < `BookingStartTime` (ra trước giờ booking bắt đầu).
3. Thời gian đỗ < 30 phút.

**Kết quả:** Phụ phí 5.000đ bị waive. Chỉ tính phí đỗ thực tế.

```
Check-in: 13:20  →  Check-out: 13:48  →  Đỗ: 28 phút  →  Phụ phí: 0đ ✓
```

### B2 — Vào sớm, ra sau giờ booking → Tính bình thường

```
Check-in: 13:20  →  Check-out: 17:30  →  Sau 14:00  →  Phụ phí: +5.000đ
```

---

## C. Check-in Vãng lai (Walk-in)

| Case | Tình huống | Kết quả | Error code |
|------|-----------|---------|------------|
| **C1** | Biển số chưa có session nào Active | ✅ Check-in thành công | — |
| **C2** | Biển số **đang có Active session** trong bãi | ❌ Blocked | `PLATE_ALREADY_PARKED` |

Kiểm tra trong `checkInWalkIn` (trước khi gọi `sp_CheckInVehicle`):

```sql
SELECT 1 FROM ParkingSessions
WHERE PlateNumber = @plate AND SessionStatus = 'Active' AND ExitTime IS NULL
```

---

## D. Đặt chỗ trước — Xung đột biển số

**Xe 51A-12345 đang có booking: 14:00 – 18:00**

| Case | Thao tác | Kết quả | Lý do |
|------|---------|---------|-------|
| **D1** | Đặt thêm 16:00–20:00 (cùng xe) | ❌ Blocked | Trùng khung 16:00–18:00 |
| **D2** | Đặt thêm 18:30–22:00 (cùng xe) | ✅ Cho phép | Liên tiếp, không chồng |
| **D3** | Đặt 14:00–18:00 cho xe 51B-67890 (cùng tài khoản) | ✅ Cho phép | Biển số khác |
| **D4** | Xe đang có Active session, muốn đặt chỗ mới | ❌ Blocked | Phải checkout trước |

### Logic kiểm tra overlap (reservationService.js)

```sql
-- Chỉ chặn nếu thực sự trùng giờ (không chặn liên tiếp)
SELECT TOP 1 1 FROM Reservations
WHERE PlateNumber = @PlateNumber
  AND ReservationStatus = 'Reserved'
  AND @StartTime < EndTime     -- booking mới bắt đầu trước khi cũ kết thúc
  AND @EndTime   > StartTime   -- booking mới kết thúc sau khi cũ bắt đầu
```

---

## E. Slot Status — Tránh slot kẹt "Reserved" mãi

Tất cả trigger, stored procedure và view đã thêm điều kiện:

```sql
AND r.StartTime <= DATEADD(HOUR, 8, GETDATE())
```

Booking cũ đã qua (hơn 8 tiếng trước) không còn làm slot bị kẹt trạng thái Reserved.

---

## F. Database — Cột mới cần migrate

Chạy PHẦN G cuối `SQLQuery1.sql` **một lần** trên DB đang chạy (idempotent):

```sql
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('ParkingSessions') AND name = 'EarlyFeeAmount')
    ALTER TABLE ParkingSessions ADD EarlyFeeAmount INT NOT NULL DEFAULT 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('ParkingSessions') AND name = 'BookingStartTime')
    ALTER TABLE ParkingSessions ADD BookingStartTime DATETIME NULL;
GO
```

| Cột | Kiểu | Mục đích |
|-----|------|---------|
| `EarlyFeeAmount` | INT DEFAULT 0 | Lưu phụ phí 5.000đ tại thời điểm check-in |
| `BookingStartTime` | DATETIME NULL | Lưu StartTime của booking để detect "vào sớm ra sớm" khi checkout |

---

## G. Error Codes — i18n

| Code | Tiếng Việt | Tiếng Anh |
|------|-----------|----------|
| `PLATE_ALREADY_BOOKED` | Xe đã có đặt chỗ trùng khung giờ | Vehicle already has an overlapping reservation |
| `PLATE_ALREADY_PARKED` | Xe đang trong bãi | Vehicle is currently in the parking lot |
| `CHECKIN_TOO_EARLY` | Quá sớm, cửa sổ mở 1 giờ trước | Too early, window opens 1 hour before |
| `CHECKIN_NO_SHOW` | Quá giờ, booking → Expired | Window closed, booking marked expired |
| `NO_SLOTS_AVAILABLE` | Không còn slot trống | No available slots |
| `SLOT_CONFLICT` | Slot bị chiếm hoặc có booking sắp đến | Slot occupied or has upcoming booking |
| `CHECK_IN_FAILED` | Không tạo được phiên gửi xe | Could not create parking session |
| `SESSION_NOT_ACTIVE` | Phiên không còn hoạt động | Session is no longer active |

---

## H. Múi giờ

SQL Server lưu UTC. FE hiển thị giờ Việt Nam bằng UTC+7 shift trick:

```js
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

// Dùng cho hiển thị giờ:
const toVN = (dt) => new Date(new Date(dt).getTime() + VN_OFFSET_MS)
const d = toVN(someDate)
const hour = d.getUTCHours()   // giờ VN
const date = d.getUTCDate()    // ngày VN

// Dùng cho toLocaleString:
new Date(dt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
```

Files đã fix: StaffVehicleCheckOut, StaffPaymentConfirm, StaffVerifyBooking, StaffPaymentHistory, StaffActionSuccess, StaffCheckIn, StaffCreateIncident, StaffDashboardScreen, StaffParkingMap, StaffSearchSession, UserProfile.
