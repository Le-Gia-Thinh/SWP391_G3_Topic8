/**
 * FILE: vehicleController.js
 * MÔ TẢ: Controller xử lý tất cả các thao tác liên quan đến Phương tiện (Vehicles) của Tài xế (Driver).
 * 
 * Các chức năng chính trong file:
 * 1. getDriverVehicles: Lấy danh sách các xe đang hoạt động của tài xế.
 * 2. addDriverVehicle: Thêm một phương tiện mới (tự đặt làm mặc định nếu là xe đầu tiên).
 * 3. updateDriverVehicle: Cập nhật biển số, loại xe, hãng xe, màu xe.
 * 4. deleteDriverVehicle: Xóa phương tiện (Xóa mềm - Soft Delete: IsActive = 0).
 * 5. setDefaultVehicle: Đặt một xe làm phương tiện mặc định (xử lý giới hạn theo gói hội viên & SQL Transaction).
 * 6. toggleVIPVehicle: Bật/Tắt trạng thái xe VIP (Tối đa 2 xe VIP, không cho đổi khi xe đang đỗ).
 * 
 * @access Driver only (Dành riêng cho quyền Tài xế)
 */
/*
hieu
*/

import { getPool, sql } from "../config/db.js"; // Kết nối tới Database SQL Server

/**
 * Hàm helper nội bộ: Lấy UserID (ID tài xế) từ đối tượng request (được gán từ middleware isAuthorized).
 * @param {Object} req - Express request
 * @returns {number|null} ID của tài xế
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

// ─────────────────────────────────────────────────────────────
// 1. CHỨC NĂNG: LẤY DANH SÁCH XE CỦA TÀI XẾ
// Method: GET /api/driver/vehicles
// ─────────────────────────────────────────────────────────────
export async function getDriverVehicles(req, res, next) {
  try {
    // Bước 1: Định danh tài xế từ Token
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    // Bước 2: Kết nối Database SQL
    const pool = await getPool();

    // Bước 3: Truy vấn SQL lấy danh sách xe active (IsActive = 1), ưu tiên xe mặc định lên đầu
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

    // Bước 4: Trả danh sách xe về cho Frontend
    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    next(err); // Ném lỗi xuống middleware xử lý lỗi chung
  }
}

// ─────────────────────────────────────────────────────────────
// 2. CHỨC NĂNG: THÊM PHƯƠNG TIỆN MỚI
// Method: POST /api/driver/vehicles
// ─────────────────────────────────────────────────────────────
export async function addDriverVehicle(req, res, next) {
  try {
    // Bước 1: Định danh tài xế
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    // Bước 2: Bóc tách và làm sạch dữ liệu từ req.body (Payload gửi lên từ FE)
    const plateNumber = String(req.body.plateNumber || "").trim().toUpperCase();
    const vehicleTypeId = Number(req.body.vehicleTypeId);
    const vehicleBrand = String(req.body.vehicleBrand || "").trim() || null;
    const vehicleColor = String(req.body.vehicleColor || "").trim() || null;

    // Bước 3: Kiểm tra tính hợp lệ dữ liệu (Validation)
    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        message: "Biển số xe không được để trống.",
      });
    }

    // Kiểm tra định dạng biển số bằng Regex (Từ 4 đến 20 ký tự gồm chữ, số, gạch ngang, dấu chấm)
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

    // Bước 4: Kiểm tra trùng lặp biển số xe (Duplicate Check)
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

    // Bước 5: Kiểm tra xem đây có phải chiếc xe đầu tiên không (nếu đầu tiên ➔ tự set làm xe mặc định IsDefault = 1)
    const countResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT COUNT(*) AS Total FROM DriverVehicles
        WHERE DriverID = @DriverID AND IsActive = 1
      `);

    const isFirst = (countResult.recordset[0]?.Total || 0) === 0;

    // Bước 6: Chèn dữ liệu xe mới vào bảng DriverVehicles trong SQL Database
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

    // Bước 7: Trả về kết quả HTTP 201 Created thành công cho Frontend
    return res.status(201).json({
      success: true,
      message: "Thêm phương tiện thành công.",
      data: insertResult.recordset[0],
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. CHỨC NĂNG: CẬP NHẬT THÔNG TIN PHƯƠNG TIỆN
// Method: PATCH /api/driver/vehicles/:id
// ─────────────────────────────────────────────────────────────
export async function updateDriverVehicle(req, res, next) {
  try {
    // Bước 1: Định danh tài xế & lấy ID phương tiện từ URL params (:id)
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

    // Bước 2: Bóc tách dữ liệu từ req.body
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

    // Bước 3: Kiểm tra quyền sở hữu xe (Verify Ownership - Xe này có đúng là của tài xế này không?)
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

    // Bước 4: Kiểm tra xem biển số mới có bị trùng với chiếc xe KHÁC cũng thuộc tài xế này không
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

    // Bước 5: Thực thi câu lệnh SQL UPDATE cập nhật thông tin xe
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

    // Bước 6: Trả kết quả thành công về cho Frontend
    return res.json({
      success: true,
      message: "Cập nhật phương tiện thành công.",
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// 4. CHỨC NĂNG: XÓA PHƯƠNG TIỆN (Xóa mềm - Soft Delete)
// Method: DELETE /api/driver/vehicles/:id
// ─────────────────────────────────────────────────────────────
export async function deleteDriverVehicle(req, res, next) {
  try {
    // Bước 1: Định danh tài xế & lấy ID phương tiện từ URL params (:id)
    const driverId = getUserIdFromToken(req);
    const vehicleId = Number(req.params.id);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    // Bước 2: Thực thi Xóa Mềm bằng cách gán IsActive = 0 (Giúp giữ lại lịch sử giao dịch/đỗ xe cũ)
    const result = await pool
      .request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        UPDATE DriverVehicles
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE VehicleID = @VehicleID AND DriverID = @DriverID AND IsActive = 1
      `);

    // Kiểm tra xem có dòng nào trong DB được cập nhật không
    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương tiện.",
      });
    }

    // Bước 3: Trả kết quả thông báo đã xóa thành công
    return res.json({
      success: true,
      message: "Đã xóa phương tiện.",
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// 5. CHỨC NĂNG: THIẾT LẬP XE MẶC ĐỊNH (Xử lý Transaction & Hạn mức Hội viên)
// Method: PATCH /api/driver/vehicles/:id/default
// ─────────────────────────────────────────────────────────────
export async function setDefaultVehicle(req, res, next) {
  try {
    // Bước 1: Định danh tài xế & lấy ID phương tiện
    const driverId = getUserIdFromToken(req);
    const vehicleId = Number(req.params.id);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    // Bước 2: Kiểm tra quyền sở hữu xe
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

    // Bước 3: RÀNG BUỘC NGHIỆP VỤ - Kiểm tra xem xe này có đang đỗ trong bãi đỗ xe hay không?
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

    // Bước 4: Kiểm tra gói hội viên của tài xế để xác định số lượng xe mặc định tối đa (Gói Premium = 2 xe, Gói khác = 1 xe)
    const subCheck = await pool.request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1 PlanID FROM UserSubscriptions
        WHERE UserID = @DriverID AND Status = 'Active' AND EndDate > GETDATE()
        ORDER BY EndDate DESC
      `);
    const planId = subCheck.recordset[0]?.PlanID || null;
    const maxDefaults = (planId === 'premium') ? 2 : 1;

    // Đếm số lượng xe đang làm mặc định hiện tại
    const defaultCountRes = await pool.request()
      .input("DriverID", sql.Int, driverId)
      .input("VehicleID", sql.Int, vehicleId)
      .query(`
        SELECT COUNT(*) as DefaultCount FROM DriverVehicles
        WHERE DriverID = @DriverID AND IsActive = 1 AND IsDefault = 1 AND VehicleID != @VehicleID
      `);
    const currentDefaults = defaultCountRes.recordset[0].DefaultCount;

    // Bước 5: Sử dụng SQL Transaction để đảm bảo tính toàn vẹn dữ liệu khi bỏ xe mặc định cũ và đặt xe mặc định mới
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();

      // Nếu đã đạt giới hạn xe mặc định, hủy trạng thái IsDefault của xe cũ
      if (currentDefaults >= maxDefaults) {
        if (maxDefaults === 1) {
          // Gói Thường/Pro: Bỏ mặc định tất cả các xe cũ
          await new sql.Request(transaction)
            .input("DriverID", sql.Int, driverId)
            .query(`
              UPDATE DriverVehicles SET IsDefault = 0
              WHERE DriverID = @DriverID AND IsActive = 1
            `);
        } else {
          // Gói Premium (Được 2 xe mặc định): Chỉ bỏ mặc định chiếc xe cũ nhất
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

      // Gán chiếc xe hiện tại thành Xe Mặc Định (IsDefault = 1)
      await new sql.Request(transaction)
        .input("VehicleID", sql.Int, vehicleId)
        .input("DriverID", sql.Int, driverId)
        .query(`
          UPDATE DriverVehicles
          SET IsDefault = 1, UpdatedAt = GETDATE()
          WHERE VehicleID = @VehicleID AND DriverID = @DriverID
        `);

      // Khớp Transaction thành công
      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback(); // Hoàn tác nếu có lỗi xảy ra
      throw txErr;
    }

    // Bước 6: Trả thông báo thành công về cho Frontend
    return res.json({
      success: true,
      message: "Đã đặt làm phương tiện mặc định.",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 6. CHỨC NĂNG: BẬT / TẮT TRẠNG THÁI XE VIP
// Method: PATCH /api/driver/vehicles/:id/vip
// ─────────────────────────────────────────────────────────────
export async function toggleVIPVehicle(req, res, next) {
  try {
    // Bước 1: Định danh tài xế & lấy ID phương tiện
    const driverId = getUserIdFromToken(req);
    const { id: vehicleId } = req.params;

    const pool = await getPool();

    // Bước 2: Kiểm tra quyền sở hữu xe và lấy trạng thái VIP hiện tại
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

    // Đảo ngược trạng thái VIP (Nếu đang là VIP (1) -> chuyển thành 0, và ngược lại)
    const currentVIPStatus = ownerCheck.recordset[0].IsVIPVehicle;
    const newVIPStatus = currentVIPStatus ? 0 : 1;

    // Bước 3: RÀNG BUỘC NGHIỆP VỤ - Không cho đổi trạng thái VIP khi xe đang đỗ trong bãi
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

    // Bước 4: RÀNG BUỘC NGHIỆP VỤ - Nếu muốn BẬT VIP, kiểm tra xem tài xế đã đạt giới hạn 2 xe VIP chưa
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

    // Bước 5: Cập nhật trạng thái VIP mới vào bảng DriverVehicles trong SQL Database
    await pool.request()
      .input("VehicleID", sql.Int, vehicleId)
      .input("IsVIP", sql.Bit, newVIPStatus)
      .query(`
        UPDATE DriverVehicles
        SET IsVIPVehicle = @IsVIP, UpdatedAt = GETDATE()
        WHERE VehicleID = @VehicleID
      `);

    // Bước 6: Trả về kết quả thông báo trạng thái VIP mới cho Frontend
    return res.json({
      success: true,
      message: newVIPStatus ? "Đã đăng ký xe VIP thành công." : "Đã hủy trạng thái xe VIP.",
      isVIP: Boolean(newVIPStatus)
    });
  } catch (err) {
    next(err);
  }
};
