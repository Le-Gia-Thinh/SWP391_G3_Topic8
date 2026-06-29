/**
 * FILE: dateTimeUtils.js
 * MÔ TẢ: Các hàm tiện ích xử lý ngày giờ (Date/Time) dùng chung trong Backend.
 * 
 * Chức năng chính:
 * - Ghép ngày + giờ thành đối tượng Date
 * - Chuyển đổi chuỗi thời lượng ("4h", "8h", "cả ngày") sang số giờ
 * - Tính thời gian tối thiểu cho đặt chỗ (phải trước ít nhất 15 phút)
 * - Format ngày/giờ thành chuỗi chuẩn
 * 
 * Lưu ý: Tất cả đều dùng local time (giờ Việt Nam), không dùng UTC.
 */

/**
 * Thêm số 0 phía trước nếu giá trị chỉ có 1 chữ số.
 * Ví dụ: padNumber(5) → "05", padNumber(12) → "12"
 * @param {number} value - Số cần pad
 * @returns {string} Chuỗi có 2 chữ số
 */
export function padNumber(value) {
  return String(value).padStart(2, "0");
}

/**
 * Ghép ngày và giờ thành một đối tượng Date hoàn chỉnh.
 * Hỗ trợ nhiều format đầu vào: chuỗi "HH:MM", ISO datetime, hoặc đối tượng Date.
 * 
 * @param {string} date - Ngày dạng "YYYY-MM-DD"
 * @param {string|Date} time - Giờ dạng "HH:MM" hoặc ISO string hoặc Date object
 * @returns {Date|null} Đối tượng Date hoặc null nếu thiếu tham số
 */
export function buildDateTime(date, time) {
  if (!date || !time) return null;

  // Nếu time đã là Date object, trả về trực tiếp
  if (time instanceof Date) {
    return time;
  }

  const dateText = String(date).trim();
  const timeText = String(time).trim();

  // Trường hợp time là full ISO datetime (VD: "2026-06-25T10:30:00Z")
  // → Tách thủ công để giữ local time, tránh JS tự chuyển sang UTC
  if (timeText.includes("T")) {
    const [datePart, rawTimePart] = timeText.split("T");
    const timePart = rawTimePart.replace("Z", "").split(".")[0]; // Bỏ "Z" và milliseconds

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

    // Dùng new Date(year, month-1, day, ...) để tạo local time (không bị lệch timezone)
    return new Date(year, month - 1, day, hour, minute, second, 0);
  }

  // Trường hợp thông thường: date = "2026-06-25", time = "10:30"
  const [year, month, day] = dateText.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timeText.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second, 0);
}

/**
 * Chuyển đổi chuỗi thời lượng thành số giờ.
 * Hỗ trợ: "4h", "8h", "24h", "cả ngày", "full-day", hoặc số thuần.
 * 
 * @param {string|number} duration - Chuỗi hoặc số biểu thị thời lượng
 * @returns {number|null} Số giờ hoặc null nếu không parse được
 */
export function getDurationHours(duration) {
  if (!duration) return null;

  // Nếu đã là số, trả về trực tiếp
  if (typeof duration === "number") return duration;

  const text = String(duration).trim().toLowerCase();

  // Ánh xạ các giá trị chuỗi phổ biến sang số giờ
  if (text === "4h") return 4;
  if (text === "8h") return 8;
  if (text === "24h") return 24;
  if (text === "cả ngày") return 24;   // Tiếng Việt có dấu
  if (text === "ca ngay") return 24;    // Tiếng Việt không dấu
  if (text === "full-day") return 24;
  if (text === "full day") return 24;

  // Fallback: tìm số đầu tiên trong chuỗi
  const matched = text.match(/\d+/);
  return matched ? Number(matched[0]) : null;
}

/**
 * Cộng thêm số giờ vào một Date.
 * @param {Date} date - Mốc thời gian ban đầu
 * @param {number} hours - Số giờ cần cộng thêm
 * @returns {Date} Thời gian sau khi cộng
 */
export function addHours(date, hours) {
  return new Date(date.getTime() + Number(hours) * 60 * 60 * 1000);
}

/**
 * Tính thời gian bắt đầu tối thiểu cho việc đặt chỗ.
 * Quy tắc: Phải đặt trước ít nhất 15 phút so với hiện tại.
 * Kết quả được làm tròn lên phút tiếp theo (bỏ giây) để tương thích với input type="time".
 * 
 * @returns {Date} Thời gian tối thiểu có thể đặt chỗ
 */
export function getMinimumReservationStartTime() {
  const minimum = new Date(Date.now() + 15 * 60 * 1000); // Hiện tại + 15 phút

  // Làm tròn lên phút tiếp theo nếu có giây/milli dư
  // (vì input type="time" không hiển thị giây → tránh lỗi 10:45:30 vs 10:45:00)
  if (minimum.getSeconds() > 0 || minimum.getMilliseconds() > 0) {
    minimum.setMinutes(minimum.getMinutes() + 1);
  }

  minimum.setSeconds(0, 0); // Reset giây và millisecond về 0
  return minimum;
}

/**
 * Format Date thành chuỗi ngày "YYYY-MM-DD".
 * Dùng cho input type="date" hoặc query string.
 * @param {Date} date - Ngày cần format (mặc định: ngày hiện tại)
 * @returns {string} Chuỗi ngày dạng "2026-06-25"
 */
export function formatDateValue(date = new Date()) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

/**
 * Format Date thành chuỗi giờ "HH:MM".
 * Dùng cho input type="time".
 * @param {Date} date - Thời gian cần format (mặc định: giờ hiện tại)
 * @returns {string} Chuỗi giờ dạng "10:30"
 */
export function formatTimeValue(date = new Date()) {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}