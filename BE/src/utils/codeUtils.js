/**
 * FILE: codeUtils.js
 * MÔ TẢ: Các hàm tiện ích để tạo và xử lý mã code (Booking Code, Session Code).
 * 
 * Quy tắc đặt mã:
 * - Booking Code: BK-0001, BK-0002, ... (dựa trên reservationId)
 * - Session Code: SESS-20260625-0001 (dựa trên ngày vào và sessionId)
 */
/*
hieu
*/

/**
 * Tạo mã đặt chỗ (Booking Code) từ reservationId.
 * Ví dụ: reservationId = 5 → "BK-0005"
 * @param {number} reservationId - ID của lượt đặt chỗ
 * @returns {string} Booking code có format BK-XXXX
 */
export function buildBookingCode(reservationId) {
  return `BK-${String(reservationId).padStart(4, "0")}`;
}

/**
 * Tạo mã phiên đỗ xe (Session Code) từ sessionId và thời gian vào.
 * Ví dụ: sessionId = 5, entryTime = "2026-06-25T10:00:00" → "SESS-20260625-0005"
 * @param {number} sessionId - ID của phiên đỗ xe
 * @param {string|Date} entryTime - Thời điểm xe vào bãi
 * @returns {string} Session code có format SESS-YYYYMMDD-XXXX
 */
export function buildSessionCode(sessionId, entryTime) {
  return `SS-${String(sessionId).padStart(5, "0")}`;
}

/**
 * Trích xuất reservationId từ Booking Code hoặc số thuần.
 * Hỗ trợ cả format "BK-0005" và "5" hoặc "0005".
 * @param {string|number} value - Booking code hoặc reservationId
 * @returns {number|null} reservationId hoặc null nếu không hợp lệ
 */
export function getReservationIdFromBookingCode(value) {
  if (!value) return null;

  // Chuẩn hóa: chuyển hoa, loại bỏ tiền tố "BK-"
  const text = String(value).trim().toUpperCase().replace("BK-", "");
  const numberValue = Number(text);

  return Number.isNaN(numberValue) ? null : numberValue;
}
