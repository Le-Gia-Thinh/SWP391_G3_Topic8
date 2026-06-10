export function buildBookingCode(reservationId) {
  return `BK-${String(reservationId).padStart(4, "0")}`;
}

export function buildSessionCode(sessionId, entryTime) {
  const date = new Date(entryTime);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `SESS-${yyyy}${mm}${dd}-${String(sessionId).padStart(4, "0")}`;
}

export function getReservationIdFromBookingCode(value) {
  if (!value) return null;

  const text = String(value).trim().toUpperCase().replace("BK-", "");
  const numberValue = Number(text);

  return Number.isNaN(numberValue) ? null : numberValue;
}