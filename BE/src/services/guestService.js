/**
 * FILE: guestService.js
 * MÔ TẢ: Service xử lý nghiệp vụ tra cứu công khai dành cho Khách vãng lai (Guest User).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Không yêu cầu Đăng nhập hay Token Xác thực (`Public Endpoints`).
 * 2. Tra cứu vị trí ô đỗ & Phí đỗ xe tạm tính real-time qua Mã phiên (`SS-XXXX`, `SESS-YYYYMMDD-XXXX`) hoặc Biển số xe.
 * 3. Gọi Stored Procedure `sp_CalcParkingFeeV2` để tính phí gửi xe theo thuật toán tính giờ lũy tiến & khung giờ đêm thực tế.
 * 4. Cung cấp chỉ số thống kê tổng quan bãi đỗ (Tổng ô đỗ, Số ô đỗ trống, Tỷ lệ lấp đầy theo loại xe) hiển thị trên Trang chủ.
 * 
 * @module guestService
 */

import { getPool, sql } from '../config/db.js';

/**
 * HÀM 1: trackSession
 * TÁC DỤNG: Tra cứu thông tin phiên gửi xe chi tiết cho khách vãng lai bằng Biển số xe hoặc Mã phiên đỗ.
 * 
 * @param {string} searchTerm - Chuỗi tìm kiếm (vd: '51H-123.45' hoặc 'SS-00042' / 'SESS-20260728-0042')
 * @returns {Promise<Object|null>} Đối tượng thông tin phiên đỗ xe hoặc null nếu không tìm thấy
 */
export async function trackSession(searchTerm) {
  const pool = await getPool();

  // CÂU TRUY VẤN SQL KẾT HỢP NHIỀU BẢNG (JOIN 6 BẢNG)
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
  const term = searchTerm.trim().toUpperCase(); // Chuẩn hóa chuỗi tìm kiếm về viết hoa

  // REGULAR EXPRESSION (Regex): Phân tích cú pháp xem người dùng nhập Mã Phiên hay Biển số xe
  const matchNew = term.match(/^SESS-\d{8}-(\d+)$/i); // Khớp định dạng mã mới: SESS-20260728-0042
  const matchOld = term.match(/^SS-(\d+)$/i);          // Khớp định dạng mã cũ: SS-00042
  const matchID = matchNew ? matchNew[1] : (matchOld ? matchOld[1] : null);

  if (matchID) {
    // Nếu nhập Mã phiên ➔ Tìm chính xác theo SessionID
    request.input('SessionID', sql.Int, parseInt(matchID, 10));
    query += ` AND ps.SessionID = @SessionID`;
  } else {
    // Nếu nhập Biển số xe ➔ Tìm theo PlateNumber
    request.input('PlateNumber', sql.NVarChar(20), term);
    query += ` AND UPPER(ps.PlateNumber) = @PlateNumber`;
    // Sắp xếp ưu tiên: Phiên đang gửi ('Active') lên trước, nếu đã về hết thì lấy phiên mới nhất theo EntryTime DESC
    query += ` ORDER BY CASE WHEN ps.SessionStatus = 'Active' THEN 0 ELSE 1 END, ps.EntryTime DESC`;
  }

  const result = await request.query(query);

  // Không tìm thấy dữ liệu phiên đỗ nào ➔ Trả về null
  if (result.recordset.length === 0) {
    return null;
  }

  const session = result.recordset[0];

  // TÍNH TOÁN THỜI GIAN ĐÃ GỬI (Duration Calculation):
  const entryTime = new Date(session.EntryTime);
  const endTime = session.ExitTime ? new Date(session.ExitTime) : new Date(); // Nếu chưa xe ra ➔ Tính đến thời điểm hiện tại
  const durationMs = endTime - entryTime; // Số milisecond đỗ
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60)); // Tính số giờ
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)); // Tính số phút lẻ

  // BƯỚC TÍNH PHÍ TẠM TÍNH KHI XE ĐANG ĐỖ (Real-time Fee Calculation via Stored Procedure):
  let estimatedFee = session.FinalAmount || session.InitialFee || 0;
  if (session.SessionStatus === 'Active') {
    try {
      // Lấy VehicleTypeID thực tế của phiên đỗ
      const vtResult = await pool.request()
        .input('SID', sql.Int, session.SessionID)
        .query('SELECT VehicleTypeID FROM ParkingSessions WHERE SessionID = @SID');
      
      if (vtResult.recordset.length > 0) {
        // Gọi Stored Procedure sp_CalcParkingFeeV2 để tính phí lũy tiến chính xác theo thuật toán CSDL
        const feeCalc = pool.request();
        feeCalc.input('VehicleTypeID', sql.Int, vtResult.recordset[0].VehicleTypeID);
        feeCalc.input('EntryTime', sql.DateTime, entryTime);
        feeCalc.input('ExitTime', sql.DateTime, endTime);
        feeCalc.output('Fee', sql.Decimal(10, 2));         // Tham số đầu ra chứa số tiền phí
        feeCalc.output('Breakdown', sql.NVarChar(sql.MAX)); // Phân tích chi tiết các khung giờ
        const feeResult = await feeCalc.execute('sp_CalcParkingFeeV2');
        estimatedFee = Number(feeResult.output.Fee || 0);
      }
    } catch (err) {
      console.error('Error calculating fee for guest tracking:', err);
      // Giữ nguyên phí tạm tính ban đầu nếu lỗi
    }
  }

  // TRẢ VỀ DỮ LIỆU ĐÃ ĐƯỢC ĐỊNH DẠNG HOÀN CHỈNH CHO FRONTEND
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
      // Định dạng hiển thị tiền tệ Việt Nam (vd: "35.000 VNĐ") bằng Intl.NumberFormat API của JavaScript
      formatted: `${new Intl.NumberFormat('vi-VN').format(estimatedFee)} VNĐ`,
      paymentStatus: session.PaymentStatus || 'Pending',
      isEstimated: session.SessionStatus === 'Active'
    }
  };
}

/**
 * HÀM 2: getHomeStats
 * TÁC DỤNG: Lấy dữ liệu thống kê công khai hiển thị trên Banner Trang chủ.
 * 
 * @returns {Promise<Object>} Đối tượng tổng quan gồm Tổng công suất, số ô trống và tỷ lệ lấp đầy từng loại xe
 */
export async function getHomeStats() {
  const pool = await getPool();
  
  // 1. Truy vấn thống kê tổng quan cơ sở hạ tầng bãi đỗ xe
  const statsQuery = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM ParkingSlots) AS TotalSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Occupied') AS OccupiedSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Available') AS AvailableSlots,
      (SELECT COUNT(*) FROM ParkingSessions WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)) AS TodaySessions
  `);
  const s = statsQuery.recordset[0];
  
  // 2. Truy vấn thống kê chi tiết theo từng Loại xe (Ô tô, Xe máy, Xe điện)
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
  
  // Ghép và trả về đối tượng cấu trúc thống kê hoàn chỉnh
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
      // Tính tỷ lệ % lấp đầy theo công thức: ((Tổng - Trống) / Tổng) * 100
      occupancyRate: v.TotalSlots > 0 ? Math.round(((v.TotalSlots - v.AvailableSlots) / v.TotalSlots) * 100) : 0
    }))
  };
}

