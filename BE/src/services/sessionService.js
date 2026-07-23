/**
 * FILE: sessionService.js
 * MÔ TẢ: Service xử lý nghiệp vụ cho phiên gửi xe (Parking Session).
 * Chức năng: Check-in xe, Check-out xe (với các ràng buộc về đặt chỗ và slot),
 * lấy danh sách phiên đỗ xe và lấy thông tin phiên đang hoạt động của tài xế.
 */
/*
hieu
*/

import { getPool, sql } from "../config/db.js";
import { getUserIdFromToken } from "../utils/requestUser.js";
import {
  buildSessionCode,
  getReservationIdFromBookingCode,
} from "../utils/codeUtils.js";

/**
 * Hàm helper: Tạo đối tượng lỗi HTTP tùy chỉnh kèm status code (400, 404, 409...)
 * Giúp Controller bắt được status code chuẩn để gửi về cho Client.
 */
function createHttpError(status, message) {
  // Khởi tạo đối tượng lỗi Error chuẩn của JavaScript với thông điệp message
  const error = new Error(message);
  // Gán thêm thuộc tính status để quy định mã lỗi HTTP (ví dụ: 400, 404)
  error.status = status;
  // Gán thuộc tính statusCode tương thích với các middleware xử lý lỗi khác
  error.statusCode = status;
  // Trả về đối tượng lỗi đã bổ sung mã status
  return error;
}

/**
 * HÀM HELPER: Lấy giá tiền gửi xe mặc định khi xe mới Check-in.
 * Mục đích: Tạo số tiền mồi ban đầu cho bảng Payments trạng thái Pending (vì cột Amount trong DB không cho phép NULL).
 * Quét bảng PricingPolicies lấy giá của khung giờ nhỏ nhất (MinHours nhỏ nhất).
 */
async function getDefaultFee(transaction, vehicleTypeId) {
  // Tạo câu truy vấn SQL Request tham gia vào cùng giao dịch transaction đang chạy
  const result = await new sql.Request(transaction)
    // Truyền tham số ID loại xe (VehicleTypeID) dạng số nguyên
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    // Chạy câu query SELECT lấy giá tiền đầu tiên xếp theo số giờ tăng dần
    .query(`
          SELECT TOP 1 Fee
          FROM PricingPolicies
          WHERE VehicleTypeID = @VehicleTypeID
            AND IsActive = 1
          ORDER BY MinHours ASC, MaxHours ASC
        `);

  // Trả về số tiền Fee tìm thấy, nếu không tìm thấy bảng giá thì mặc định trả về 0
  return result.recordset[0]?.Fee || 0;
}

/**
 * HÀM HELPER: Tính tổng tiền gửi xe thực tế khi Check-out.
 * Bước 1: Tính số giờ đỗ thực tế = (Giờ hiện tại now - Giờ xe vào entryTime) / 3.600.000 ms.
 * Bước 2: Bắn tham số DurationHours và VehicleTypeID xuống SQL Server để tự tra bảng giá PricingPolicies.
 * Trả về: Đối tượng { fee: số tiền chính xác, durationHours: số giờ đỗ }.
 */
async function getCheckoutFee(transaction, sessionId) {
  // Tạo câu truy vấn SQL lấy thời gian xe vào EntryTime và ID loại xe từ bảng ParkingSessions
  const result = await new sql.Request(transaction)
    // Truyền tham số ID phiên đỗ xe (SessionID)
    .input("SessionID", sql.Int, sessionId)
    // Quét tìm thông tin phiên đỗ đang đỗ trong bãi (SessionStatus = Active)
    .query(`
          SELECT 
            s.EntryTime,
            s.VehicleTypeID
          FROM ParkingSessions s
          WHERE s.SessionID = @SessionID
            AND s.SessionStatus = 'Active'
        `);

  // Lấy dòng dữ liệu phiên đỗ xe đầu tiên từ mảng kết quả
  const session = result.recordset[0];

  // Nếu không tìm thấy phiên đỗ hợp lệ -> Trả về phí bằng 0 và số giờ bằng 0
  if (!session) {
    return {
      fee: 0,
      durationHours: 0,
    };
  }

  // 1. Chuyển thời gian EntryTime từ DB thành đối tượng Date của JavaScript
  const entryTime = new Date(session.EntryTime);
  // Lấy mốc thời gian hiện tại lúc xe chuẩn bị check-out ra khỏi bãi
  const now = new Date();

  // Tính số giờ đỗ thực tế: Lấy hiệu số milisecond chia cho (1000ms * 60s * 60m), dùng Math.max để tránh số âm
  const durationHours = Math.max(
    0,
    (now.getTime() - entryTime.getTime()) / 1000 / 60 / 60
  );

  // 2. Truyền DurationHours xuống SQL Server để tự động đối chiếu khung giá trong PricingPolicies
  const feeResult = await new sql.Request(transaction)
    // Truyền loại xe xuống câu query SQL
    .input("VehicleTypeID", sql.Int, session.VehicleTypeID)
    // Truyền tổng số giờ đỗ dạng số thập phân xuống câu query SQL
    .input("DurationHours", sql.Decimal(10, 2), durationHours)
    // Query quét bảng giá để lọc ra khung giờ đỗ phù hợp
    .query(`
          SELECT TOP 1 Fee
          FROM PricingPolicies
          WHERE VehicleTypeID = @VehicleTypeID
            AND IsActive = 1
            AND (
              @DurationHours BETWEEN MinHours AND MaxHours
              OR (IsOvernight = 1 AND @DurationHours > 8)
            )
          ORDER BY IsOvernight DESC, MaxHours ASC
        `);

  // Trả về đối tượng gồm tổng số tiền fee chính xác và tổng số giờ đỗ durationHours
  return {
    fee: feeResult.recordset[0]?.Fee || 0,
    durationHours,
  };
}

// =========================================================================
// CHỨC NĂNG 1: LẤY DANH SÁCH TẤT CẢ CÁC PHIÊN ĐỖ XE TRONG BÃI (CHO STAFF/MANAGER)
// =========================================================================
export async function getSessions() {
  const pool = await getPool();

  const result = await pool.request().query(`
        SELECT s.SessionID,
              CONCAT('SS-', RIGHT('00000'+CAST(s.SessionID AS VARCHAR(10)),5)) AS SessionCode,
              s.DriverID, u.FullName AS DriverName, s.PlateNumber,
              s.VehicleTypeID, vt.VehicleCode, vt.VehicleName,
              s.SlotID, ps.SlotCode, ps.SlotStatus,
              z.ZoneName, f.FloorName, b.BuildingName, b.Address,
              s.EntryTime, s.ExitTime, s.SessionStatus,
              booking.ReservationID,
              CASE WHEN booking.ReservationID IS NOT NULL THEN CONCAT('BK-', RIGHT('0000'+CAST(booking.ReservationID AS VARCHAR(10)),4)) ELSE NULL END AS BookingCode
        FROM ParkingSessions s
        JOIN Users u ON s.DriverID = u.UserID
        JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
        JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        JOIN Zones z ON ps.ZoneID = z.ZoneID
        JOIN Floors f ON z.FloorID = f.FloorID
        JOIN Buildings b ON f.BuildingID = b.BuildingID
        LEFT JOIN Reservations booking
              ON booking.SlotID = s.SlotID
              AND booking.DriverID = s.DriverID
              AND booking.ReservationStatus IN ('Reserved','Completed')
        ORDER BY s.EntryTime DESC
      `);

  return result.recordset;
}

// =========================================================================
// CHỨC NĂNG 2: CHO XE VÀO BÃI (CHECK-IN) - DÙNG TRANSACTION BẢO VỆ DỮ LIỆU
// =========================================================================
export async function checkInVehicle(req) {
  // Lấy cổng kết nối Database từ pool
  const pool = await getPool();
  // Khởi tạo một đối tượng Transaction giao dịch an toàn đồng bộ
  const transaction = new sql.Transaction(pool);

  try {
    // 1. Rút các trường dữ liệu từ body của request gửi lên (driverId, plateNumber, slotId...)
    const {
      driverId,
      plateNumber,
      vehicleTypeId,
      slotId,
      reservationId,
      bookingCode,
    } = req.body;

    // 2. Ép kiểu driverId về dạng số nguyên
    let finalDriverId = Number(driverId);
    // Chuẩn hóa biển số xe: xóa khoảng trắng 2 đầu và đổi thành chữ in hoa
    let finalPlateNumber = String(plateNumber || "").trim().toUpperCase();
    // Ép kiểu vehicleTypeId về dạng số nguyên
    let finalVehicleTypeId = Number(vehicleTypeId);
    // Ép kiểu slotId vị trí ô đỗ về dạng số nguyên
    let finalSlotId = Number(slotId);
    // Ép kiểu ID đặt chỗ thành số (nếu không có thì gán mặc định là null)
    let finalReservationId = reservationId ? Number(reservationId) : null;

    // 3. Nếu không truyền reservationId nhưng có truyền mã chữ bookingCode ("BK-0042") -> Gọi helper đổi ra số 42
    if (!finalReservationId && bookingCode) {
      finalReservationId = getReservationIdFromBookingCode(bookingCode);
    }

    // 4. MỞ SỔ TAY GHI TẠM (Bắt đầu Transaction bảo vệ giao dịch)
    await transaction.begin();

    // 5. NẾU LÀ KHÁCH ĐẶT TRƯỚC (có reservationId):
    // 🔹 QUERY 1 / 8 TRONG TRANSACTION (SELECT): Query lấy thông tin chi tiết từ đơn đặt chỗ gốc trong Reservations
    if (finalReservationId) {
      const reservationResult = await new sql.Request(transaction)
        // Truyền ID đặt chỗ vào câu query
        .input("ReservationID", sql.Int, finalReservationId)
        // Chạy query truy vấn thông tin đơn đặt chỗ
        .query(`
              SELECT TOP 1
                r.ReservationID,
                r.DriverID,
                r.VehicleTypeID,
                r.SlotID,
                r.ReservationStatus,
                r.StartTime,
                r.EndTime,
                u.FullName AS DriverName,
                vt.VehicleName,
                ps.SlotCode,
                ps.SlotStatus
              FROM Reservations r
              JOIN Users u ON r.DriverID = u.UserID
              JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
              LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
              WHERE r.ReservationID = @ReservationID
            `);

      // Lấy dòng đơn đặt chỗ đầu tiên từ kết quả query
      const reservation = reservationResult.recordset[0];

      // Nếu không tìm thấy đơn đặt chỗ trong database -> Ném lỗi 404
      if (!reservation) {
        throw createHttpError(404, "Không tìm thấy mã đặt chỗ.");
      }

      // Nếu trạng thái đơn đặt chỗ không phải 'Reserved' -> Ném lỗi 400 (đơn đã hủy hoặc đã sử dụng)
      if (reservation.ReservationStatus !== "Reserved") {
        throw createHttpError(400, "Đặt chỗ này không còn hiệu lực.");
      }

      // Gán lại thông tin chính xác từ Đơn đặt chỗ gốc vào các biến final
      finalDriverId = reservation.DriverID;
      finalVehicleTypeId = reservation.VehicleTypeID;
      finalSlotId = reservation.SlotID;

      // Nếu biển số bị thiếu -> Gán chuỗi mặc định 'UNKNOWN'
      if (!finalPlateNumber) {
        finalPlateNumber = "UNKNOWN";
      }
    }

    // 6. BỐN LỚP CHECK RÀNG BUỘC (VALIDATION):
    // Check 0: Đảm bảo không bị thiếu 4 thông tin cốt lõi (driverId, vehicleTypeId, slotId, plateNumber)
    if (!finalDriverId || !finalVehicleTypeId || !finalSlotId || !finalPlateNumber) {
      throw createHttpError(
        400,
        "Thiếu thông tin check-in. Cần có driverId, plateNumber, vehicleTypeId, slotId hoặc bookingCode."
      );
    }

    // 🔹 QUERY 2 / 8 TRONG TRANSACTION (SELECT): Check xem Tài xế này có đang đỗ 1 xe khác trong bãi chưa ra không
    const activeDriverResult = await new sql.Request(transaction)
      // Truyền ID tài xế vào câu query
      .input("DriverID", sql.Int, finalDriverId)
      // Query tìm phiên đỗ xe đang Active của tài xế này
      .query(`
            SELECT TOP 1 SessionID
            FROM ParkingSessions
            WHERE DriverID = @DriverID
              AND SessionStatus = 'Active'
              AND ExitTime IS NULL
          `);

    // Nếu tìm thấy phiên đỗ xe đang Active -> Ném lỗi 409 Xung đột dữ liệu
    if (activeDriverResult.recordset.length > 0) {
      throw createHttpError(
        409,
        "Tài xế này đang có một phiên đỗ xe hoạt động."
      );
    }

    // 🔹 QUERY 3 / 8 TRONG TRANSACTION (SELECT): Check xem Ô đỗ này có đang bị xe khác đỗ thực tế không
    const activeSlotResult = await new sql.Request(transaction)
      // Truyền ID ô đỗ vào câu query
      .input("SlotID", sql.Int, finalSlotId)
      // Query tìm phiên đỗ xe đang chiếm ô đỗ này
      .query(`
            SELECT TOP 1 SessionID
            FROM ParkingSessions
            WHERE SlotID = @SlotID
              AND SessionStatus = 'Active'
              AND ExitTime IS NULL
          `);

    // Nếu phát hiện vị trí ô đỗ đang có xe đỗ -> Ném lỗi 409 Xung đột
    if (activeSlotResult.recordset.length > 0) {
      throw createHttpError(
        409,
        "Vị trí này đang có xe đỗ, không thể check-in."
      );
    }

    // 🔹 QUERY 4 / 8 TRONG TRANSACTION (SELECT): Check xem Ô đỗ có tồn tại và đúng loại xe không
    const slotResult = await new sql.Request(transaction)
      // Truyền ID ô đỗ vào câu query
      .input("SlotID", sql.Int, finalSlotId)
      // Query bảng ParkingSlots lấy trạng thái và loại xe cho phép
      .query(`
            SELECT 
              ps.SlotID,
              ps.SlotCode,
              ps.SlotStatus,
              ps.VehicleTypeID
            FROM ParkingSlots ps
            WHERE ps.SlotID = @SlotID
          `);

    // Lấy thông tin ô đỗ tìm thấy
    const slot = slotResult.recordset[0];

    // Nếu ô đỗ không tồn tại trong database -> Ném lỗi 404
    if (!slot) {
      throw createHttpError(404, "Không tìm thấy vị trí đỗ.");
    }

    // Nếu loại xe của xe không khớp với loại xe được quy định cho ô đỗ -> Ném lỗi 400
    if (Number(slot.VehicleTypeID) !== Number(finalVehicleTypeId)) {
      throw createHttpError(400, "Loại xe không phù hợp với vị trí đỗ.");
    }

    // Check 4: Check phân loại dạng xe (Booking thì Slot phải 'Reserved', Walk-in thì Slot phải 'Available')
    const isReservedBookingCheckIn =
      finalReservationId && slot.SlotStatus === "Reserved";

    const isWalkInCheckIn =
      !finalReservationId && slot.SlotStatus === "Available";

    // Nếu không thuộc 1 trong 2 trường hợp check-in hợp lệ ở trên -> Ném lỗi 409
    if (!isReservedBookingCheckIn && !isWalkInCheckIn) {
      throw createHttpError(409, "Vị trí đỗ hiện không khả dụng.");
    }

    // 7. GHI DỮ LIỆU ĐỒNG BỘ NỐI TIẾP VÀO DATABASE:
    // 🔹 QUERY 5 / 8 TRONG TRANSACTION (INSERT 1): Tạo phiên đỗ xe thực tế mới (ParkingSessions)
    // SQL Server tự động sinh ra SessionID mới (IDENTITY)
    const insertSessionResult = await new sql.Request(transaction)
      // Truyền ID ô đỗ
      .input("SlotID", sql.Int, finalSlotId)
      // Truyền ID tài xế
      .input("DriverID", sql.Int, finalDriverId)
      // Truyền biển số xe
      .input("PlateNumber", sql.NVarChar(20), finalPlateNumber)
      // Truyền loại xe
      .input("VehicleTypeID", sql.Int, finalVehicleTypeId)
      // Chạy INSERT và dùng OUTPUT để trả về dòng dữ liệu vừa chèn
      .query(`
            INSERT INTO ParkingSessions (
              SlotID,
              DriverID,
              PlateNumber,
              VehicleTypeID,
              EntryTime,
              SessionStatus
            )
            OUTPUT
              INSERTED.SessionID,
              INSERTED.SlotID,
              INSERTED.DriverID,
              INSERTED.PlateNumber,
              INSERTED.VehicleTypeID,
              INSERTED.EntryTime,
              INSERTED.SessionStatus
            VALUES (
              @SlotID,
              @DriverID,
              UPPER(@PlateNumber),
              @VehicleTypeID,
              GETDATE(),
              'Active'
            )
          `);

    // Gán thông tin phiên đỗ vừa chèn ra biến session
    const session = insertSessionResult.recordset[0];

    // 🔹 QUERY 6 / 8 TRONG TRANSACTION (SELECT): Gọi hàm helper getDefaultFee lấy giá tiền mặc định ban đầu
    const defaultFee = await getDefaultFee(transaction, finalVehicleTypeId);

    // 🔹 QUERY 7 / 8 TRONG TRANSACTION (INSERT 2): Tạo hóa đơn tạm ở trạng thái 'Pending' trong bảng Payments
    await new sql.Request(transaction)
      // Truyền SessionID vừa sinh ra từ câu INSERT trên
      .input("SessionID", sql.Int, session.SessionID)
      // Truyền số tiền mồi mặc định
      .input("Amount", sql.Decimal(10, 2), defaultFee)
      // Chèn bản ghi hóa đơn tạm Pending vào bảng Payments
      .query(`
            INSERT INTO Payments (
              SessionID,
              Amount,
              PaymentMethod,
              PaymentStatus
            )
            VALUES (
              @SessionID,
              @Amount,
              'Pending',
              'Pending'
            )
          `);

    // 🔹 QUERY 8 / 8 TRONG TRANSACTION (UPDATE 1 & 2):
    // 8.1. Nếu là xe đỗ theo Booking -> Đổi đơn Reservations thành 'Completed'
    if (finalReservationId) {
      await new sql.Request(transaction)
        // Truyền ID đặt chỗ
        .input("ReservationID", sql.Int, finalReservationId)
        // Cập nhật trạng thái đơn đặt chỗ thành Completed
        .query(`
              UPDATE Reservations
              SET ReservationStatus = 'Completed'
              WHERE ReservationID = @ReservationID
            `);
    }

    // 8.2. Đổi trạng thái ô đỗ trong ParkingSlots thành 'Occupied' (Đã có xe đỗ)
    await new sql.Request(transaction)
      // Truyền ID ô đỗ
      .input("SlotID", sql.Int, finalSlotId)
      // Cập nhật trạng thái ô đỗ thành Occupied
      .query(`
            UPDATE ParkingSlots
            SET SlotStatus = 'Occupied'
            WHERE SlotID = @SlotID
          `);

    // 8. CHỐT GIAO DỊCH: Lưu vĩnh viễn cả 4 thao tác thay đổi dữ liệu trên vào SQL Server
    await transaction.commit();

    // Trả về đối tượng session mới chèn kèm mã SessionCode được build dạng "SS-01001"
    return {
      session: {
        ...session,
        SessionCode: buildSessionCode(session.SessionID, session.EntryTime),
      },
    };
  } catch (err) {
    // 9. HOÀN TÁC (Rollback) nếu có bất kỳ câu lệnh SQL nào bị lỗi giữa chừng
    try {
      await transaction.rollback();
    } catch { }

    // Ném lỗi ra ngoài cho Controller xử lý tiếp
    throw err;
  }
}

// =========================================================================
// CHỨC NĂNG 3: CHO XE RA KHỎI BÃI (CHECK-OUT) - DÙNG TRANSACTION BẢO VỆ DỮ LIỆU
// =========================================================================
export async function checkOutVehicle(req) {
  // Lấy cổng kết nối Database Pool
  const pool = await getPool();
  // Khởi tạo đối tượng Transaction bảo vệ giao dịch
  const transaction = new sql.Transaction(pool);

  try {
    // 1. Rút sessionId và paymentMethod từ req.body gửi từ Client
    const { sessionId, paymentMethod } = req.body;

    // Kiểm tra nếu thiếu sessionId -> Ném lỗi 400 lập tức
    if (!sessionId) {
      throw createHttpError(400, "sessionId là bắt buộc.");
    }

    // Bắt đầu mở sổ ghi tạm Transaction
    await transaction.begin();

    // 🔹 QUERY 1 / 4 TRONG TRANSACTION (SELECT): Tìm thông tin phiên đỗ xe trong DB theo sessionId
    const sessionResult = await new sql.Request(transaction)
      // Truyền tham số SessionID
      .input("SessionID", sql.Int, sessionId)
      // Query truy vấn thông tin phiên đỗ xe
      .query(`
            SELECT TOP 1
              SessionID,
              SlotID,
              EntryTime,
              VehicleTypeID,
              SessionStatus
            FROM ParkingSessions
            WHERE SessionID = @SessionID
          `);

    // Lấy bản ghi phiên đỗ xe tìm thấy
    const session = sessionResult.recordset[0];

    // Nếu không tìm thấy phiên đỗ xe -> Ném lỗi 404
    if (!session) {
      throw createHttpError(404, "Không tìm thấy phiên đỗ xe.");
    }

    // Nếu phiên đỗ xe không ở trạng thái Active (đã check-out rồi) -> Ném lỗi 400
    if (session.SessionStatus !== "Active") {
      throw createHttpError(
        400,
        "Phiên đỗ xe này đã hoàn tất hoặc không còn hoạt động."
      );
    }

    // 🔹 QUERY 2 / 4 TRONG TRANSACTION (SELECT): Gọi hàm getCheckoutFee tính tổng số tiền đỗ xe thực tế theo giờ
    const { fee } = await getCheckoutFee(transaction, sessionId);

    // 🔹 QUERY 3 / 4 TRONG TRANSACTION (UPDATE 1): Cập nhật ParkingSessions (Chốt ExitTime = GETDATE(), Status = Completed)
    await new sql.Request(transaction)
      // Truyền ID phiên đỗ xe
      .input("SessionID", sql.Int, sessionId)
      // Cập nhật mốc giờ ra và chuyển trạng thái phiên đỗ thành Completed
      .query(`
            UPDATE ParkingSessions
            SET ExitTime = GETDATE(),
                SessionStatus = 'Completed'
            WHERE SessionID = @SessionID
          `);

    // 🔹 QUERY 4 / 4 TRONG TRANSACTION (UPDATE 2): Cập nhật Payments (Ghi đè số tiền fee thực tế, lưu phương thức trả Cash/Banking, Status = Completed)
    await new sql.Request(transaction)
      // Truyền ID phiên đỗ xe
      .input("SessionID", sql.Int, sessionId)
      // Truyền số tiền tính toán thực tế
      .input("Amount", sql.Decimal(10, 2), fee)
      // Truyền phương thức thanh toán (mặc định là Cash nếu không gửi)
      .input("PaymentMethod", sql.NVarChar(50), paymentMethod || "Cash")
      // Cập nhật bảng Payments thành Completed
      .query(`
            UPDATE Payments
            SET Amount = @Amount,
                PaymentMethod = @PaymentMethod,
                PaymentTime = GETDATE(),
                PaymentStatus = 'Completed'
            WHERE SessionID = @SessionID
          `);

    // 🔹 QUERY 5 / 4 TRONG TRANSACTION (UPDATE 3): Mở lại ô đỗ xe trong ParkingSlots ('Available' nếu trống hoàn toàn hoặc 'Reserved' nếu có người đặt trước)
    await new sql.Request(transaction)
      // Truyền ID ô đỗ xe
      .input("SlotID", sql.Int, session.SlotID)
      // Chạy UPDATE dùng CASE WHEN tự động chuyển đổi trạng thái ô đỗ
      .query(`
            UPDATE ParkingSlots
            SET SlotStatus =
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM Reservations r
                  WHERE r.SlotID = @SlotID
                    AND r.ReservationStatus = 'Reserved'
                    AND r.EndTime >= GETDATE()
                )
                THEN 'Reserved'
                ELSE 'Available'
              END
            WHERE SlotID = @SlotID
          `);

    // 6. CHỐT GIAO DỊCH: Lưu vĩnh viễn cả 3 câu UPDATE ở trên vào SQL Server
    await transaction.commit();

    // Trả về kết quả hoàn tất check-out thành công cho Controller
    return {
      sessionId,
      status: "Completed",
    };
  } catch (err) {
    // 7. HOÀN TÁC (Rollback) nếu có bất kỳ câu lệnh SQL nào bị lỗi giữa chừng
    try {
      await transaction.rollback();
    } catch { }

    // Ném lỗi ra ngoài cho Controller xử lý
    throw err;
  }
}

// =========================================================================
// CHỨC NĂNG 4: LẤY PHIÊN ĐỖ XE ĐANG HOẠT ĐỘNG CỦA TÀI XẾ (HIỂN THỊ UI APP DI ĐỘNG)
// =========================================================================
export async function getCurrentDriverSession(req) {
  // Lấy cổng kết nối Database Pool
  const pool = await getPool();

  // Lấy ID tài xế từ JWT Token của request
  const driverId = getUserIdFromToken(req);

  // Nếu không tìm thấy thông tin tài xế trong Token -> Ném lỗi 401
  if (!driverId) {
    throw createHttpError(
      401,
      "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại."
    );
  }

  // Query phiên đỗ đang đỗ thực tế trong bãi của tài xế đó (ExitTime IS NULL và SessionStatus = Active)
  const result = await pool.request()
    // Truyền ID tài xế vào câu query
    .input("DriverID", sql.Int, driverId)
    // Query lấy phiên đỗ xe đang Active mới nhất của tài xế
    .query(`
          SELECT TOP 1
            s.SessionID,
              CONCAT(
                'SS-',
                RIGHT('00000' + CAST(s.SessionID AS VARCHAR(10)), 5)
              ) AS SessionCode,

            s.DriverID,
            u.FullName AS DriverName,

            s.PlateNumber,
            s.VehicleTypeID,
            vt.VehicleCode,
            vt.VehicleName,

            s.EntryTime,
            s.ExitTime,
            s.SessionStatus,

            ps.SlotID,
            ps.SlotCode,
            ps.SlotStatus,

            z.ZoneName,
            f.FloorName,
            b.BuildingID,
            b.BuildingName,
            b.Address,

            p.PaymentID,
            p.Amount,
            p.PaymentStatus,
            p.PaymentMethod,
            p.PaymentTime,

            booking.ReservationID,
            CASE 
              WHEN booking.ReservationID IS NOT NULL
              THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
              ELSE NULL
            END AS BookingCode,
            booking.StartTime AS ReservationStartTime,
            booking.EndTime AS ReservationEndTime

          FROM ParkingSessions s
          JOIN Users u ON s.DriverID = u.UserID
          JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
          JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
          JOIN Zones z ON ps.ZoneID = z.ZoneID
          JOIN Floors f ON z.FloorID = f.FloorID
          JOIN Buildings b ON f.BuildingID = b.BuildingID
          LEFT JOIN Payments p ON p.SessionID = s.SessionID

          OUTER APPLY (
            SELECT TOP 1 r.ReservationID, r.StartTime, r.EndTime
            FROM Reservations r
            WHERE r.DriverID = s.DriverID
              AND r.SlotID = s.SlotID
              AND r.ReservationStatus IN ('Reserved', 'Completed')
            ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
          ) booking

          WHERE s.DriverID = @DriverID
            AND s.SessionStatus = 'Active'
            AND s.ExitTime IS NULL

          ORDER BY s.EntryTime DESC
        `);

  // Lấy dòng phiên đỗ xe tìm thấy
  const session = result.recordset[0];

  // Nếu tài xế không có phiên đỗ xe nào đang Active -> Trả về null (giao diện app sẽ trống)
  if (!session) {
    return null;
  }

  // 1. Chuyển mốc giờ xe vào EntryTime thành đối tượng Date
  const entryTime = new Date(session.EntryTime);
  // 2. Lấy mốc thời gian hiện tại
  const now = new Date();

  // 3. Tính khoảng số phút đã đỗ: Lấy (Now - EntryTime) chia cho 60.000 ms, dùng Math.floor làm tròn xuống
  const parkedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - entryTime.getTime()) / 60000)
  );

  // 4. Quy đổi tổng số phút ra số giờ (chia cho 60 và lấy phần nguyên)
  const parkedHours = Math.floor(parkedMinutes / 60);
  // 5. Tính số phút dư còn lại (dùng phép chia lấy dư %)
  const parkedRemainMinutes = parkedMinutes % 60;

  // 6. Khởi tạo mức % tiến độ thời gian đỗ mặc định là 20% cho xe vãng lai
  let progress = 20;

  // 7. Nếu phiên đỗ này liên quan đến đơn Đặt trước có mốc StartTime và EndTime
  if (session.ReservationStartTime && session.ReservationEndTime) {
    // Chuyển mốc thời gian bắt đầu đặt chỗ thành đối tượng Date
    const start = new Date(session.ReservationStartTime);
    // Chuyển mốc thời gian kết thúc đặt chỗ thành đối tượng Date
    const end = new Date(session.ReservationEndTime);

    // Tính tổng số phút khách đã đăng ký đặt chỗ ban đầu
    const totalMinutes = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / 60000)
    );

    // Tính tỷ lệ % tiến độ thanh ProgressBar = (Số phút đỗ thực tế / Tổng số phút đăng ký) * 100
    progress = Math.min(100, Math.round((parkedMinutes / totalMinutes) * 100));
  }

  // Trả về đối tượng phiên đỗ xe hoàn chỉnh đã bổ sung các thuộc tính hiển thị cho App Mobile
  return {
    ...session,
    statusLabel: "Đang hoạt động",
    sessionType: session.BookingCode ? "ĐẶT TRƯỚC (BOOKING)" : "VÃNG LAI",
    parkedMinutes,
    parkedDuration: `${parkedHours} giờ ${parkedRemainMinutes} phút`,
    progress,
  };
}
