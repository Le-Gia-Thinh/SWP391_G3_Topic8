/**
 * FILE: guestService.js
 * MÔ TẢ: Service xử lý các nghiệp vụ dành cho khách vãng lai (Guest).
 * Bao gồm: Tra cứu phiên gửi xe hiện tại, xem số liệu thống kê chung của bãi đỗ.
 */

import { getPool, sql } from '../config/db.js';
/**
 * Tra cứu phiên gửi xe cho khách vãng lai
 * @param {string} searchTerm - Biển số xe hoặc Mã phiên (VD: SS-00042)
 */
export async function trackSession(searchTerm) {
  const pool = await getPool();

  let query = `
      SELECT TOP 1
        ps.SessionID,
        CONCAT('SS-', RIGHT('00000' + CAST(ps.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
        ps.PlateNumber,
        ps.EntryTime,
        ps.ExitTime,
        ps.SessionStatus,
        vt.VehicleName,
        vt.VehicleCode,
        sl.SlotCode,
        z.ZoneName,
        f.FloorName,
        b.BuildingName,
        pay.Amount AS InitialFee,
        pay.FinalAmount,
        pay.PaymentStatus
      FROM ParkingSessions ps
      JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
      JOIN Zones z ON sl.ZoneID = z.ZoneID
      JOIN Floors f ON z.FloorID = f.FloorID
      JOIN Buildings b ON f.BuildingID = b.BuildingID
      LEFT JOIN Payments pay ON pay.SessionID = ps.SessionID
      WHERE 1=1
  `;

  const request = pool.request();
  const term = searchTerm.trim().toUpperCase();

  // Kiểm tra xem có phải mã phiên không (Hỗ trợ cả SESS-YYYYMMDD-XXXX và SS-XXXX)
  const matchNew = term.match(/^SESS-\d{8}-(\d+)$/i);
  const matchOld = term.match(/^SS-(\d+)$/i);
  const matchID = matchNew ? matchNew[1] : (matchOld ? matchOld[1] : null);

  if (matchID) {
    request.input('SessionID', sql.Int, parseInt(matchID, 10));
    query += ` AND ps.SessionID = @SessionID`;
  } else {
    request.input('PlateNumber', sql.NVarChar(20), term);
    query += ` AND UPPER(ps.PlateNumber) = @PlateNumber`;
    // Ưu tiên phiên đang Active, nếu không có thì lấy phiên mới nhất
    query += ` ORDER BY CASE WHEN ps.SessionStatus = 'Active' THEN 0 ELSE 1 END, ps.EntryTime DESC`;
  }

  const result = await request.query(query);

  if (result.recordset.length === 0) {
    return null;
  }

  const session = result.recordset[0];

  // Tính thời gian đã gửi
  const entryTime = new Date(session.EntryTime);
  const endTime = session.ExitTime ? new Date(session.ExitTime) : new Date();
  const durationMs = endTime - entryTime;
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  // Nếu phiên đang Active, tính phí tạm tính qua stored procedure
  let estimatedFee = session.FinalAmount || session.InitialFee || 0;
  if (session.SessionStatus === 'Active') {
    try {
      const feeReq = pool.request();
      feeReq.input('VehicleTypeID', sql.Int, null);
      feeReq.input('DurationH', sql.Decimal(10, 2), durationMs / (1000 * 60 * 60));
      feeReq.output('Fee', sql.Decimal(10, 2));

      // Lấy VehicleTypeID từ session
      const vtResult = await pool.request()
        .input('SID', sql.Int, session.SessionID)
        .query('SELECT VehicleTypeID FROM ParkingSessions WHERE SessionID = @SID');
      
      if (vtResult.recordset.length > 0) {
        const feeCalc = pool.request();
        feeCalc.input('VehicleTypeID', sql.Int, vtResult.recordset[0].VehicleTypeID);
        feeCalc.input('EntryTime', sql.DateTime, entryTime);
        feeCalc.input('ExitTime', sql.DateTime, endTime);
        feeCalc.output('Fee', sql.Decimal(10, 2));
        feeCalc.output('Breakdown', sql.NVarChar(sql.MAX));
        const feeResult = await feeCalc.execute('sp_CalcParkingFeeV2');
        estimatedFee = Number(feeResult.output.Fee || 0);
      }
    } catch (err) {
      console.error('Error calculating fee for guest tracking:', err);
      // Fallback: giữ nguyên phí ban đầu
    }
  }

  return {
    sessionCode: session.SessionCode,
    plateNumber: session.PlateNumber,
    vehicleName: session.VehicleName,
    vehicleCode: session.VehicleCode,
    location: {
      building: session.BuildingName,
      floor: session.FloorName,
      zone: session.ZoneName,
      slot: session.SlotCode
    },
    entryTime: session.EntryTime,
    exitTime: session.ExitTime,
    status: session.SessionStatus,
    duration: {
      hours: durationHours,
      minutes: durationMinutes,
      text: `${durationHours} giờ ${durationMinutes} phút`
    },
    fee: {
      amount: estimatedFee,
      formatted: `${new Intl.NumberFormat('vi-VN').format(estimatedFee)} VNĐ`,
      paymentStatus: session.PaymentStatus || 'Pending',
      isEstimated: session.SessionStatus === 'Active'
    }
  };
}

/**
 * Lấy dữ liệu thống kê cho trang chủ (Public)
 */
export async function getHomeStats() {
  const pool = await getPool();
  
  // 1. Thống kê chung
  const statsQuery = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM ParkingSlots) AS TotalSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Occupied') AS OccupiedSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Available') AS AvailableSlots,
      (SELECT COUNT(*) FROM ParkingSessions WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)) AS TodaySessions
  `);
  const s = statsQuery.recordset[0];
  
  // 2. Thống kê theo loại xe
  const vehiclesQuery = await pool.request().query(`
    SELECT 
      vt.VehicleCode, 
      vt.VehicleName,
      COUNT(sl.SlotID) AS TotalSlots,
      SUM(CASE WHEN sl.SlotStatus = 'Available' THEN 1 ELSE 0 END) AS AvailableSlots
    FROM VehicleTypes vt
    LEFT JOIN ParkingSlots sl ON vt.VehicleTypeID = sl.VehicleTypeID
    GROUP BY vt.VehicleCode, vt.VehicleName
  `);
  
  return {
    overview: {
      totalCapacity: s.TotalSlots || 0,
      occupied: s.OccupiedSlots || 0,
      available: s.AvailableSlots || 0,
      todayCheckIns: s.TodaySessions || 0
    },
    vehicles: vehiclesQuery.recordset.map(v => ({
      code: v.VehicleCode,
      name: v.VehicleName,
      total: v.TotalSlots || 0,
      available: v.AvailableSlots || 0,
      occupancyRate: v.TotalSlots > 0 ? Math.round(((v.TotalSlots - v.AvailableSlots) / v.TotalSlots) * 100) : 0
    }))
  };
}
