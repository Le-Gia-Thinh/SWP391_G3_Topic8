/**
 * FILE: vehicleController.js
 * MÔ TẢ: Controller xử lý tất cả các thao tác CRUD và quản lý tính năng nâng cao liên quan đến Phương tiện (DriverVehicles) của Tài xế.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. `getDriverVehicles`: Truy vấn danh sách xe active (`IsActive = 1`), tự động sắp xếp xe mặc định (`IsDefault = 1`) lên vị trí đầu tiên.
 * 2. `addDriverVehicle`: Thêm xe mới (kiểm tra chuẩn hóa biển số Regex, trùng lặp biển số; nếu là xe đầu tiên thì tự động chọn làm mặc định).
 * 3. `updateDriverVehicle`: Cập nhật biển số, loại xe, hãng xe, màu sắc (xác minh quyền sở hữu và không trùng biển số xe khác).
 * 4. `deleteDriverVehicle`: Xóa phương tiện theo cơ chế Soft Delete (`IsActive = 0`) để bảo toàn lịch sử giao dịch và phiên gửi xe cũ.
 * 5. `setDefaultVehicle`: Thiết lập xe mặc định (Áp dụng SQL Transaction rollback nếu lỗi, giới hạn theo gói Premium=2 xe, gói khác=1 xe, không cho đổi khi xe đang đỗ).
 * 6. `toggleVIPVehicle`: Đăng ký/Hủy trạng thái Xe VIP (Giới hạn tối đa 2 xe VIP/tài xế, ngăn chặn đổi khi xe đang active trong bãi).
 */

// Import hàm `getPool` kết nối Database và đối tượng dữ liệu `sql` từ cấu hình 'BE/src/config/db.js'
import { getPool, sql } from "../config/db.js";

/**
 * HÀM HELPER NỘI BỘ: getUserIdFromToken
 * TÁC DỤNG: Lấy an toàn UserID từ đối tượng request (do Middleware JWT authMiddleware gán vào).
 * 
 * @param {Object} req - Express request object
 * @returns {number|null} ID của tài xế
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

/**
 * HÀM 1: getDriverVehicles
 * TÁC DỤNG: Lấy danh sách tất cả phương tiện đang hoạt động (`IsActive = 1`) của tài xế đang đăng nhập.
 * CÚ PHÁP SQL: `ORDER BY dv.IsDefault DESC, dv.CreatedAt DESC` -> Đưa xe mặc định lên đầu danh sách.
 * 
 * @route GET /api/driver/vehicles
 * @access Driver Only (Chỉ dành riêng cho tài xế)
 */
export async function getDriverVehicles(req, res, next) {
  try {
    // Định danh tài xế từ Token JWT
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    // Kết nối Database SQL Server
    const pool = await getPool();

    // Truy vấn danh sách xe active, JOIN với bảng VehicleTypes để lấy tên loại xe
    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT
          dv.VehicleID,
          dv.DriverID,
          dv.PlateNumber,
          dv.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,
          dv.VehicleBrand,
          dv.VehicleColor,
          dv.IsDefault,
          dv.IsActive,
          dv.CreatedAt,
          dv.UpdatedAt
        FROM DriverVehicles dv
        JOIN VehicleTypes vt ON dv.VehicleTypeID = vt.VehicleTypeID
        WHERE dv.DriverID = @DriverID AND dv.IsActive = 1
        ORDER BY dv.IsDefault DESC, dv.CreatedAt DESC
      `);

    // Trả về danh sách xe cho Frontend
    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    next(err); // Chuyển lỗi xuống Middleware xử lý lỗi tập trung
  }
}

/**
 * HÀM 2: addDriverVehicle
 * TÁC DỤNG: Thêm phương tiện mới vào tài khoản tài xế.
 * CÚ PHÁP & THUẬT NGỮ:
 * - `OUTPUT inserted.*`: Trả lại thông tin bản ghi vừa chèn vào DB ngay trong câu lệnh INSERT SQL.
 * - Regex `/^[A-Z0-9\-.\s]{4,20}$/`: Kiểm tra định dạng biển số hợp lệ (từ 4 đến 20 ký tự chữ hoa, số và dấu gạch).
 * 
 * @route POST /api/driver/vehicles
 * @access Driver Only
 */
export async function addDriverVehicle(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    // Chuẩn hóa và làm sạch dữ liệu từ req.body
    const plateNumber = String(req.body.plateNumber || "").trim().toUpperCase();
    const vehicleTypeId = Number(req.body.vehicleTypeId);
    const vehicleBrand = String(req.body.vehicleBrand || "").trim() || null;
    const vehicleColor = String(req.body.vehicleColor || "").trim() || null;

    // VALIDATION DỮ LIỆU ĐẦU VÀO:
    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        message: "Biển số xe không được để trống.",
      });
    }

    // Biểu thức chính quy (Regex) kiểm tra biển số xe
    if (!/^[A-Z0-9\-.\s]{4,20}$/.test(plateNumber)) {
      return res.status(400).json({
        success: false,
        message: "Biển số xe không hợp lệ.",
      });
    }

    if (!vehicleTypeId || Number.isNaN(vehicleTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn loại xe.",
      });
    }

    const pool = await getPool();

    // KIỂM TRA TRÙNG LẶP (Duplicate Check): Biển số xe này đã đăng ký trong tài khoản chưa?
    const dupCheck = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("PlateNumber", sql.NVarChar(20), plateNumber)
      .query(`
        SELECT VehicleID FROM DriverVehicles
        WHERE DriverID = @DriverID AND PlateNumber = @PlateNumber AND IsActive = 1
      `);

    if (dupCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Biển số xe này đã được đăng ký.",
      });
    }

    // Đếm số lượng xe hiện có. Nếu đây là xe đầu tiên ➔ tự động đặt làm xe mặc định (IsDefault = 1)
    const countResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT COUNT(*) AS Total FROM DriverVehicles
        WHERE DriverID = @DriverID AND IsActive = 1
      `);

    const isFirst = (countResult.recordset[0]?.Total || 0) === 0;

    // Thực thi lệnh INSERT vào bảng DriverVehicles
    const insertResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("PlateNumber", sql.NVarChar(20), plateNumber)
      .input("VehicleTypeID", sql.Int, vehicleTypeId)
      .input("VehicleBrand", sql.NVarChar(100), vehicleBrand)
      .input("VehicleColor", sql.NVarChar(50), vehicleColor)
      .input("IsDefault", sql.Bit, isFirst ? 1 : 0)
      .query(`
        INSERT INTO DriverVehicles (
          DriverID, PlateNumber, VehicleTypeID,
          VehicleBrand, VehicleColor, IsDefault
        )
        OUTPUT inserted.*
        VALUES (
          @DriverID, @PlateNumber, @VehicleTypeID,
          @VehicleBrand, @VehicleColor, @IsDefault
        )
      `);

    // Trả kết quả HTTP Status Code 201 (Created)
    return res.status(201).json({
      success: true,
      message: "Thêm phương tiện thành công.",
      data: insertResult.recordset[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 3: updateDriverVehicle
 * TÁC DỤNG: Chỉnh sửa thông tin phương tiện hiện có (Biển số, loại xe, màu sắc, thương hiệu).
 * 
 * @route PATCH /api/driver/vehicles/:id
 * @access Driver Only
 */
export async function updateDriverVehicle(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);
    const vehicleId = Number(req.params.id);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    if (!vehicleId || Number.isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: "ID phương tiện không hợp lệ.",
      });
    }

    const plateNumber = String(req.body.plateNumber || "").trim().toUpperCase();
    const vehicleTypeId = Number(req.body.vehicleTypeId);
    const vehicleBrand = String(req.body.vehicleBrand || "").trim() || null;
    const vehicleColor = String(req.body.vehicleColor || "").trim() || null;

    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        message: "Biển số xe không được để trống.",
      });
    }

    const pool = await getPool();

    // XÁC MINH QUYỀN SỞ HỮU (Ownership Check): Xe này có đúng là của tài xế này không?
    const ownerCheck = await pool
      .request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT VehicleID FROM DriverVehicles
        WHERE VehicleID = @VehicleID AND DriverID = @DriverID AND IsActive = 1
      `);

    if (ownerCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương tiện.",
      });
    }

    // Kiểm tra xem biển số mới sửa có bị trùng với một xe khác (`VehicleID <> @VehicleID`) của chính tài xế đó không
    const dupCheck = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("PlateNumber", sql.NVarChar(20), plateNumber)
      .input("VehicleID", sql.Int, vehicleId)
      .query(`
        SELECT VehicleID FROM DriverVehicles
        WHERE DriverID = @DriverID AND PlateNumber = @PlateNumber
          AND IsActive = 1 AND VehicleID <> @VehicleID
      `);

    if (dupCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Biển số xe này đã được đăng ký cho phương tiện khác.",
      });
    }

    // Thực thi câu lệnh SQL UPDATE
    await pool
      .request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("DriverID", sql.Int, driverId)
      .input("PlateNumber", sql.NVarChar(20), plateNumber)
      .input("VehicleTypeID", sql.Int, vehicleTypeId)
      .input("VehicleBrand", sql.NVarChar(100), vehicleBrand)
      .input("VehicleColor", sql.NVarChar(50), vehicleColor)
      .query(`
        UPDATE DriverVehicles
        SET PlateNumber = @PlateNumber,
            VehicleTypeID = @VehicleTypeID,
            VehicleBrand = @VehicleBrand,
            VehicleColor = @VehicleColor,
            UpdatedAt = GETDATE()
        WHERE VehicleID = @VehicleID AND DriverID = @DriverID
      `);

    return res.json({
      success: true,
      message: "Cập nhật phương tiện thành công.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 4: deleteDriverVehicle
 * TÁC DỤNG: Xóa phương tiện theo cơ chế Soft Delete (`IsActive = 0`).
 * LÝ DO DÙNG SOFT DELETE: Đảm bảo lịch sử gửi xe (ParkingSessions) và lịch sử thanh toán (Payments) cũ của chiếc xe đó không bị lỗi khóa ngoại (Foreign Key constraint).
 * 
 * @route DELETE /api/driver/vehicles/:id
 * @access Driver Only
 */
export async function deleteDriverVehicle(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);
    const vehicleId = Number(req.params.id);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    // Thực thi Soft Delete: Gán IsActive = 0
    const result = await pool
      .request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        UPDATE DriverVehicles
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE VehicleID = @VehicleID AND DriverID = @DriverID AND IsActive = 1
      `);

    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương tiện.",
      });
    }

    return res.json({
      success: true,
      message: "Đã xóa phương tiện.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 5: setDefaultVehicle
 * TÁC DỤNG: Đặt một phương tiện thành Xe Mặc Định (Default Vehicle).
 * NGUYÊN LÝ HOẠT ĐỘNG & RÀNG BUỘC:
 * 1. Không cho đổi trạng thái Mặc định nếu xe đang có phiên gửi active trong bãi.
 * 2. Kiểm tra gói hội viên: Gói Premium được tối đa 2 xe mặc định, gói khác tối đa 1 xe.
 * 3. Sử dụng SQL Transaction (`new sql.Transaction`): Nếu vượt quá hạn mức, tự động gỡ bỏ `IsDefault = 0` của xe cũ trước khi gán `IsDefault = 1` cho xe mới. Đảm bảo nếu gặp sự cố thì Rollback toàn bộ.
 * 
 * @route PATCH /api/driver/vehicles/:id/default
 * @access Driver Only
 */
export async function setDefaultVehicle(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);
    const vehicleId = Number(req.params.id);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    // Kiểm tra quyền sở hữu xe
    const ownerCheck = await pool
      .request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT VehicleID FROM DriverVehicles
        WHERE VehicleID = @VehicleID AND DriverID = @DriverID AND IsActive = 1
      `);

    if (ownerCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương tiện.",
      });
    }

    // RÀNG BUỘC 1: Xe có đang đỗ trong bãi hay không?
    const parkedCheck = await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .query(`
        SELECT top 1 1 FROM ParkingSessions ps
        JOIN DriverVehicles dv ON ps.PlateNumber = dv.PlateNumber
        WHERE dv.VehicleID = @VehicleID AND ps.SessionStatus = 'Active'
      `);
      
    if (parkedCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể đổi trạng thái Mặc định khi xe này đang đỗ trong bãi."
      });
    }

    // RÀNG BUỘC 2: Kiểm tra hạn mức số xe mặc định theo gói hội viên Active
    const subCheck = await pool.request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1 PlanID FROM UserSubscriptions
        WHERE UserID = @DriverID AND Status = 'Active' AND EndDate > GETDATE()
        ORDER BY EndDate DESC
      `);
    const planId = subCheck.recordset[0]?.PlanID || null;
    const maxDefaults = (planId === 'premium') ? 2 : 1; // Gói Premium được 2 xe mặc định

    // Đếm số lượng xe mặc định hiện có
    const defaultCountRes = await pool.request()
      .input("DriverID", sql.Int, driverId)
      .input("VehicleID", sql.Int, vehicleId)
      .query(`
        SELECT COUNT(*) as DefaultCount FROM DriverVehicles
        WHERE DriverID = @DriverID AND IsActive = 1 AND IsDefault = 1 AND VehicleID != @VehicleID
      `);
    const currentDefaults = defaultCountRes.recordset[0].DefaultCount;

    // SỬ DỤNG TRANSACTION SQL:
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();

      // Nếu đã vượt hạn mức, tiến hành bỏ mặc định của xe cũ
      if (currentDefaults >= maxDefaults) {
        if (maxDefaults === 1) {
          // Bỏ mặc định tất cả xe cũ
          await new sql.Request(transaction)
            .input("DriverID", sql.Int, driverId)
            .query(`
              UPDATE DriverVehicles SET IsDefault = 0
              WHERE DriverID = @DriverID AND IsActive = 1
            `);
        } else {
          // Gói Premium: Bỏ mặc định chiếc xe cũ nhất
          await new sql.Request(transaction)
            .input("DriverID", sql.Int, driverId)
            .input("VehicleID", sql.Int, vehicleId)
            .query(`
              UPDATE DriverVehicles SET IsDefault = 0
              WHERE VehicleID = (
                SELECT TOP 1 VehicleID FROM DriverVehicles
                WHERE DriverID = @DriverID AND IsActive = 1 AND IsDefault = 1 AND VehicleID != @VehicleID
                ORDER BY UpdatedAt ASC
              )
            `);
        }
      }

      // Đặt xe hiện tại làm mặc định
      await new sql.Request(transaction)
        .input("VehicleID", sql.Int, vehicleId)
        .input("DriverID", sql.Int, driverId)
        .query(`
          UPDATE DriverVehicles
          SET IsDefault = 1, UpdatedAt = GETDATE()
          WHERE VehicleID = @VehicleID AND DriverID = @DriverID
        `);

      // Commit transaction
      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback(); // Hoàn tác dữ liệu nếu xảy ra sự cố
      throw txErr;
    }

    return res.json({
      success: true,
      message: "Đã đặt làm phương tiện mặc định.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * HÀM 6: toggleVIPVehicle
 * TÁC DỤNG: Đăng ký hoặc Hủy trạng thái Xe VIP (`IsVIPVehicle = 1 / 0`).
 * RÀNG BUỘC NGHIỆP VỤ:
 * 1. Tối đa chỉ được đăng ký 2 xe VIP cho mỗi tài khoản tài xế.
 * 2. Không cho phép bật/tắt trạng thái VIP khi xe đang đỗ trong bãi (`SessionStatus = 'Active'`).
 * 
 * @route PATCH /api/driver/vehicles/:id/vip
 * @access Driver Only
 */
export async function toggleVIPVehicle(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);
    const { id: vehicleId } = req.params;

    const pool = await getPool();

    // Kiểm tra quyền sở hữu và lấy trạng thái VIP hiện tại
    const ownerCheck = await pool
      .request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT VehicleID, IsVIPVehicle FROM DriverVehicles
        WHERE VehicleID = @VehicleID AND DriverID = @DriverID AND IsActive = 1
      `);

    if (ownerCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phương tiện." });
    }

    const currentVIPStatus = ownerCheck.recordset[0].IsVIPVehicle;
    const newVIPStatus = currentVIPStatus ? 0 : 1;

    // RÀNG BUỘC 1: Không cho phép đổi trạng thái VIP khi xe đang đỗ trong bãi
    const parkedCheck = await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .query(`
        SELECT top 1 1 FROM ParkingSessions ps
        JOIN DriverVehicles dv ON ps.PlateNumber = dv.PlateNumber
        WHERE dv.VehicleID = @VehicleID AND ps.SessionStatus = 'Active'
      `);
      
    if (parkedCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Không thể đổi trạng thái VIP khi xe đang đỗ trong bãi." });
    }

    // RÀNG BUỘC 2: Nếu BẬT VIP ➔ Kiểm tra tổng số xe VIP hiện tại không quá 2 xe
    if (newVIPStatus === 1) {
      const countCheck = await pool.request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT COUNT(*) as VIPCount FROM DriverVehicles
          WHERE DriverID = @DriverID AND IsActive = 1 AND IsVIPVehicle = 1
        `);
      
      if (countCheck.recordset[0].VIPCount >= 2) {
        return res.status(400).json({ success: false, message: "Bạn chỉ được phép đăng ký tối đa 2 xe VIP." });
      }
    }

    // Cập nhật trạng thái VIP mới
    await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("IsVIP", sql.Bit, newVIPStatus)
      .query(`
        UPDATE DriverVehicles
        SET IsVIPVehicle = @IsVIP, UpdatedAt = GETDATE()
        WHERE VehicleID = @VehicleID
      `);

    return res.json({
      success: true,
      message: newVIPStatus ? "Đã đăng ký xe VIP thành công." : "Đã hủy trạng thái xe VIP.",
      isVIP: Boolean(newVIPStatus)
    });
  } catch (err) {
    next(err);
  }
};

