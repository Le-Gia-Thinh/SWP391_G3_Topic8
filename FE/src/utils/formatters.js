/**
 * FILE: formatters.js
 * MÔ TẢ: Các hàm hỗ trợ định dạng dữ liệu phía giao diện (Frontend).
 * Bao gồm hàm chuẩn hóa định dạng biển số xe.
 */

// Định dạng chuẩn: 51A-123.45 (xe máy) hoặc 51A-12345 (ô tô 5 số liền)
// Logic: 2 số tỉnh + 1-2 chữ cái dòng xe + '-' + tối đa 5 chữ số
// Nếu có 4-5 số → tự chèn '.' trước 2 số cuối (chuẩn xe máy VN)
export function formatPlateNumber(value) {
  if (!value) return ''

  const clean = String(value).toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!clean) return ''

  // 2 chữ số mã tỉnh
  const prov = clean.slice(0, 2).replace(/[^0-9]/g, '')
  if (prov.length < 2) return prov

  // 1-2 chữ cái series
  let i = 2, series = ''
  while (i < clean.length && /[A-Z]/.test(clean[i]) && series.length < 2) {
    series += clean[i]; i++
  }
  if (!series) return prov

  // Phần số (tối đa 5 chữ số)
  const nums = clean.slice(i).replace(/[^0-9]/g, '').slice(0, 5)
  if (!nums.length) return `${prov}${series}`

  // ≤3 số → giữ nguyên; 4-5 số → chèn '.' trước 2 số cuối
  const formatted = nums.length <= 3
    ? nums
    : nums.slice(0, nums.length - 2) + '.' + nums.slice(nums.length - 2)

  return `${prov}${series}-${formatted}`
}
