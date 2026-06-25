/**
 * FILE: vehicleController.js
 * MÔ TẢ: Controller xử lý quản lý phương tiện (Vehicles) của Driver.
 * 
 * Chức năng:
 * - getDriverVehicles: Lấy danh sách phương tiện của tài xế.
 * - addDriverVehicle: Thêm phương tiện mới.
 * - updateDriverVehicle: Cập nhật thông tin phương tiện.
 * - deleteDriverVehicle: Xóa phương tiện (soft delete: IsActive = 0).
 * - setDefaultVehicle: Thiết lập một phương tiện làm mặc định.
 * 
 * @access Driver only
 */

import { getPool, sql } from "../config/db.js"; // Kết nối database

/**
 * Hàm helper: Lấy UserID từ request.
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

// ─────────────────────────────────────────────────────────────
// GET /driver/vehicles
// ─────────────────────────────────────────────────────────────
export async function getDriverVehicles(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

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

    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /driver/vehicles
// ─────────────────────────────────────────────────────────────
export async function addDriverVehicle(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
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

    // Check duplicate
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

    // Check if first vehicle -> set as default
    const countResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT COUNT(*) AS Total FROM DriverVehicles
        WHERE DriverID = @DriverID AND IsActive = 1
      `);

    const isFirst = (countResult.recordset[0]?.Total || 0) === 0;

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
// PATCH /driver/vehicles/:id
// ─────────────────────────────────────────────────────────────
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

    // Verify ownership
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

    // Check duplicate plate
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

// ─────────────────────────────────────────────────────────────
// DELETE /driver/vehicles/:id
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// PATCH /driver/vehicles/:id/default
// ─────────────────────────────────────────────────────────────
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

    // Verify ownership
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

    // Unset all defaults, then set this one — wrapped in a transaction
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();

      await new sql.Request(transaction)
        .input("DriverID", sql.Int, driverId)
        .query(`
          UPDATE DriverVehicles SET IsDefault = 0
          WHERE DriverID = @DriverID AND IsActive = 1
        `);

      await new sql.Request(transaction)
        .input("VehicleID", sql.Int, vehicleId)
        .input("DriverID", sql.Int, driverId)
        .query(`
          UPDATE DriverVehicles
          SET IsDefault = 1, UpdatedAt = GETDATE()
          WHERE VehicleID = @VehicleID AND DriverID = @DriverID
        `);

      await transaction.commit();
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }

    return res.json({
      success: true,
      message: "Đã đặt làm phương tiện mặc định.",
    });
  } catch (err) {
    next(err);
  }
}
