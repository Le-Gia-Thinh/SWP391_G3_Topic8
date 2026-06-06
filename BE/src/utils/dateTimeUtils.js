export function buildDateTime(date, time) {
  if (!date || !time) return null;

  if (String(time).includes("T")) {
    return new Date(time);
  }

  return new Date(`${date}T${time}:00`);
}

export function getDurationHours(duration) {
  if (!duration) return null;

  if (typeof duration === "number") return duration;

  const text = String(duration).trim().toLowerCase();

  if (text === "4h") return 4;
  if (text === "8h") return 8;
  if (text === "24h") return 24;
  if (text === "cả ngày" || text === "ca ngay" || text === "full-day") return 24;

  const matched = text.match(/\d+/);

  return matched ? Number(matched[0]) : null;
}

export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}