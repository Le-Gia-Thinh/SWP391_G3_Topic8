export function padNumber(value) {
  return String(value).padStart(2, "0");
}

export function buildDateTime(date, time) {
  if (!date || !time) return null;

  if (time instanceof Date) {
    return time;
  }

  const dateText = String(date).trim();
  const timeText = String(time).trim();

  // Nếu lỡ truyền full datetime thì vẫn tách thủ công để giữ local time.
  if (timeText.includes("T")) {
    const [datePart, rawTimePart] = timeText.split("T");
    const timePart = rawTimePart.replace("Z", "").split(".")[0];

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

    return new Date(year, month - 1, day, hour, minute, second, 0);
  }

  const [year, month, day] = dateText.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timeText.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second, 0);
}

export function getDurationHours(duration) {
  if (!duration) return null;

  if (typeof duration === "number") return duration;

  const text = String(duration).trim().toLowerCase();

  if (text === "4h") return 4;
  if (text === "8h") return 8;
  if (text === "24h") return 24;
  if (text === "cả ngày") return 24;
  if (text === "ca ngay") return 24;
  if (text === "full-day") return 24;
  if (text === "full day") return 24;

  const matched = text.match(/\d+/);
  return matched ? Number(matched[0]) : null;
}

export function addHours(date, hours) {
  return new Date(date.getTime() + Number(hours) * 60 * 60 * 1000);
}

export function getMinimumReservationStartTime() {
  const minimum = new Date(Date.now() + 15 * 60 * 1000);

  // Vì input type="time" không có giây, làm tròn lên phút tiếp theo
  // để tránh lỗi 10:45:30 so với input 10:45:00.
  if (minimum.getSeconds() > 0 || minimum.getMilliseconds() > 0) {
    minimum.setMinutes(minimum.getMinutes() + 1);
  }

  minimum.setSeconds(0, 0);
  return minimum;
}

export function formatDateValue(date = new Date()) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

export function formatTimeValue(date = new Date()) {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}