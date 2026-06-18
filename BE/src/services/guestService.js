import { getPool, sql } from '../config/db.js';

/**
 * Tra cứu phiên gửi xe cho khách vãng lai
 * @param {string} plateNumber - Biển số xe
 * @param {string} sessionCode - Mã phiên (VD: SS-00042)
 */
export async function trackSession(plateNumber, sessionCode) {
  const pool = await getPool();

  // Parse sessionCode (SS-00042) → sessionId (42)
  const match = sessionCode.match(/^SS-(\d+)$/i);
  if (!match) {
    return null;
  }
  const sessionId = parseInt(match[1], 10);

  // Truy vấn thông tin phiên (chỉ trả dữ liệu an toàn, không lộ thông tin cá nhân)
  const result = await pool.request()
    .input('SessionID', sql.Int, sessionId)
    .input('PlateNumber', sql.NVarChar(20), plateNumber.toUpperCase().trim())
    .query(`
      SELECT
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
      WHERE ps.SessionID = @SessionID
        AND UPPER(ps.PlateNumber) = @PlateNumber
    `);

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
        .input('SID', sql.Int, sessionId)
        .query('SELECT VehicleTypeID FROM ParkingSessions WHERE SessionID = @SID');
      
      if (vtResult.recordset.length > 0) {
        const feeCalc = pool.request();
        feeCalc.input('VehicleTypeID', sql.Int, vtResult.recordset[0].VehicleTypeID);
        feeCalc.input('DurationH', sql.Decimal(10, 2), durationMs / (1000 * 60 * 60));
        feeCalc.output('Fee', sql.Decimal(10, 2));
        const feeResult = await feeCalc.execute('sp_CalcParkingFee');
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
