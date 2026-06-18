export function formatPlateNumber(value) {
  if (!value) return '';
  
  // Lấy giá trị gốc và chuyển thành chữ hoa
  let raw = String(value).toUpperCase();
  
  // Giữ lại dấu '-' ở cuối nếu user cố tình gõ
  const endsWithHyphen = raw.endsWith('-');
  
  // Loại bỏ các ký tự không hợp lệ (chỉ giữ chữ cái, số, và dấu chấm)
  raw = raw.replace(/[^A-Z0-9.]/g, '');
  
  // 1. 2 ký tự đầu tiên phải là số
  let p1 = raw.substring(0, 2).replace(/[^0-9]/g, '');
  if (p1.length < 2) return p1;
  
  // 2. Ký tự tiếp theo là chữ cái (1 hoặc 2 chữ)
  let restAfterP1 = raw.substring(p1.length);
  let letterMatch = restAfterP1.match(/^[A-Z]{1,2}/);
  let letters = letterMatch ? letterMatch[0] : '';
  
  if (letters.length === 0) {
    return p1;
  }
  
  // 3. Các số còn lại
  let restAfterLetters = restAfterP1.substring(letters.length);
  let digits = restAfterLetters.replace(/[^0-9.]/g, '');
  
  if (digits.length > 0) {
    return `${p1}${letters}-${digits}`;
  } else {
    return endsWithHyphen ? `${p1}${letters}-` : `${p1}${letters}`;
  }
}
