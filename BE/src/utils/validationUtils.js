/**
 * FILE: validationUtils.js
 * MÔ TẢ: Các middleware và hàm tiện ích để xác thực (validate) dữ liệu đầu vào từ request.
 * 
 * Được sử dụng trước controller trong routes để đảm bảo dữ liệu đúng format trước khi xử lý.
 * 
 * Các middleware validation:
 * - validateRegister: Kiểm tra dữ liệu đăng ký tài khoản
 * - validateLogin: Kiểm tra dữ liệu đăng nhập
 * - validateForgotPassword / validateResetPassword: Kiểm tra dữ liệu khôi phục mật khẩu
 * - validateSocialLogin: Kiểm tra token đăng nhập mạng xã hội
 * - validateCreateReservation: Kiểm tra dữ liệu đặt chỗ
 * - validateCheckIn / validateCheckOut: Kiểm tra dữ liệu check-in/check-out
 * - validateStaffWalkIn / validateStaffBookingCheckIn / validateStaffCheckOut: Validation cho Staff
 * - validateConfirmSurcharge: Kiểm tra xác nhận phụ thu
 */
/*
Thinh
*/

// ========================= BIỂU THỨC CHÍNH QUY (REGEX) =========================

/** Regex kiểm tra định dạng email cơ bản */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Regex kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 0) */
export const vietnamPhoneRegex = /^0\d{9}$/;

/**
 * Regex kiểm tra biển số xe Việt Nam.
 * Hỗ trợ các dạng phổ biến:
 * - 59A-12345   (2 số + 1 chữ + dấu gạch + 5 số)
 * - 59A-123.45  (2 số + 1 chữ + dấu gạch + 3 số + chấm + 2 số)
 * - 59AB-12345  (2 số + 2 chữ + dấu gạch + 5 số)
 * - 51F-99999
 */
export const plateNumberRegex = /^(\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}|\d{2}[A-Z]{1,2}-?\d{4,5})$/i;

// ========================= HÀM HELPER =========================

/**
 * Gửi response lỗi validation (400 Bad Request).
 * @param {Object} res - Express response object
 * @param {string[]} errors - Mảng các thông báo lỗi
 * @returns {Object} Response JSON với danh sách lỗi
 */
function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    message: errors.join(", "),
    errors,
  });
}

/**
 * Kiểm tra email có đúng format không.
 * @param {string} email - Email cần kiểm tra
 * @returns {boolean} true nếu email hợp lệ
 */
export function isValidEmail(email) {
  return emailRegex.test(String(email || "").trim());
}

/**
 * Trim (cắt khoảng trắng đầu cuối) một chuỗi. Nếu không phải string, trả về "".
 * @param {*} value - Giá trị cần trim
 * @returns {string} Chuỗi đã trim
 */
export function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Format biển số xe theo chuẩn Việt Nam.
 * Tự động chuyển hoa, thêm dấu "-" giữa phần chữ và phần số.
 * Ví dụ: "59a12345" → "59A-12345"
 * 
 * Luồng xử lý:
 * 1. Tách 2 ký tự số đầu (tỉnh/thành phố)
 * 2. Tách 1-2 ký tự chữ (seri)
 * 3. Tách phần số còn lại
 * 4. Ghép lại với dấu "-"
 * 
 * @param {string} value - Biển số xe thô từ input
 * @returns {string} Biển số đã được format chuẩn
 */
export function formatPlateNumber(value) {
  if (!value) return '';
  
  // Lấy giá trị gốc và chuyển thành chữ hoa
  let raw = String(value).toUpperCase();
  
  // Giữ lại dấu '-' ở cuối nếu user cố tình gõ (đang gõ dở)
  const endsWithHyphen = raw.endsWith('-');
  
  // Loại bỏ các ký tự không hợp lệ (chỉ giữ chữ cái, số, và dấu chấm)
  raw = raw.replace(/[^A-Z0-9.]/g, '');
  
  // Bước 1: 2 ký tự đầu tiên phải là số (mã tỉnh/thành phố)
  let p1 = raw.substring(0, 2).replace(/[^0-9]/g, '');
  if (p1.length < 2) return p1; // Chưa đủ 2 số → trả về ngay
  
  // Bước 2: Ký tự tiếp theo là chữ cái (seri, 1 hoặc 2 chữ)
  let restAfterP1 = raw.substring(p1.length);
  let letterMatch = restAfterP1.match(/^[A-Z]{1,2}/);
  let letters = letterMatch ? letterMatch[0] : '';
  
  if (letters.length === 0) {
    // Nếu chưa gõ chữ cái, chỉ trả về phần số
    return p1;
  }
  
  // Bước 3: Các số còn lại (phần thân biển số)
  let restAfterLetters = restAfterP1.substring(letters.length);
  let digits = restAfterLetters.replace(/[^0-9.]/g, '');
  
  if (digits.length > 0) {
    // Nếu đã có số sau phần chữ → tự động chèn dấu '-'
    return `${p1}${letters}-${digits}`;
  } else {
    // Nếu chưa gõ số, nhưng người dùng cố tình gõ '-' thì giữ lại
    return endsWithHyphen ? `${p1}${letters}-` : `${p1}${letters}`;
  }
}

// ========================= MIDDLEWARE VALIDATION =========================

/**
 * Middleware xác thực dữ liệu đăng ký tài khoản.
 * Kiểm tra: fullName, email, password, confirmPassword, phoneNumber, plateNumber.
 * Nếu hợp lệ, chuẩn hóa (trim, lowercase) và gắn lại vào req.body.
 * 
 * @route POST /api/auth/register
 */
export function validateRegister(req, res, next) {
  const errors = [];

  const fullName = trim(req.body.fullName);
  const email = trim(req.body.email).toLowerCase();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const phoneNumber = trim(req.body.phoneNumber);
  const plateNumber = trim(req.body.plateNumber).toUpperCase();

  if (!fullName) {
    errors.push("fullName không được để trống");
  } else if (fullName.length < 2 || fullName.length > 100) {
    errors.push("fullName phải từ 2 đến 100 ký tự");
  }

  if (!email) {
    errors.push("email không được để trống");
  } else if (!isValidEmail(email)) {
    errors.push("email không hợp lệ");
  }

  if (!password) {
    errors.push("password không được để trống");
  } else if (password.length < 6) {
    errors.push("password phải có ít nhất 6 ký tự");
  } else if (password.length > 100) {
    errors.push("password không được vượt quá 100 ký tự");
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push("confirmPassword không khớp với password");
  }

  if (phoneNumber && !vietnamPhoneRegex.test(phoneNumber)) {
    errors.push("phoneNumber phải gồm 10 chữ số và bắt đầu bằng số 0");
  }

  if (plateNumber && !plateNumberRegex.test(plateNumber)) {
    errors.push("plateNumber không đúng định dạng. Ví dụ: 59A-12345 hoặc 59A-123.45");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.fullName = fullName;
  req.body.email = email;
  req.body.phoneNumber = phoneNumber || null;

  if (plateNumber) {
    req.body.plateNumber = plateNumber;
  }

  next();
}

/**
 * Middleware xác thực dữ liệu đăng nhập.
 * Kiểm tra: email và password không được để trống, email đúng format.
 * 
 * @route POST /api/auth/login
 */
export function validateLogin(req, res, next) {
  const errors = [];

  const email = trim(req.body.email).toLowerCase();
  const password = req.body.password;

  if (!email) {
    errors.push("email không được để trống");
  } else if (!isValidEmail(email)) {
    errors.push("email không hợp lệ");
  }

  if (!password) {
    errors.push("password không được để trống");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.email = email;
  next();
}

/**
 * Middleware xác thực dữ liệu quên mật khẩu.
 * Kiểm tra: email hợp lệ.
 * 
 * @route POST /api/auth/forgot-password
 */
export function validateForgotPassword(req, res, next) {
  const email = trim(req.body.email).toLowerCase();

  if (!email || !isValidEmail(email)) {
    return sendValidationError(res, ["email không hợp lệ"]);
  }

  req.body.email = email;
  next();
}

/**
 * Middleware xác thực dữ liệu đặt lại mật khẩu.
 * Kiểm tra: token bắt buộc, newPassword (tối thiểu 6, tối đa 100 ký tự), confirmPassword khớp.
 * 
 * @route POST /api/auth/reset-password
 */
export function validateResetPassword(req, res, next) {
  const errors = [];

  const token = trim(req.body.token);
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  if (!token) {
    errors.push("token là bắt buộc");
  }

  if (!newPassword) {
    errors.push("newPassword là bắt buộc");
  } else if (newPassword.length < 6) {
    errors.push("newPassword phải có ít nhất 6 ký tự");
  } else if (newPassword.length > 100) {
    errors.push("newPassword không được vượt quá 100 ký tự");
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    errors.push("confirmPassword không khớp với newPassword");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.token = token;
  next();
}

/**
 * Middleware xác thực dữ liệu đăng nhập mạng xã hội (Google).
 * Yêu cầu: idToken (Google).
 * 
 * @route POST /api/auth/google
 */
export function validateSocialLogin(req, res, next) {
  const { idToken } = req.body;

  if (!idToken) {
    return sendValidationError(res, ["Token mạng xã hội (idToken) là bắt buộc"]);
  }

  next();
}

/**
 * Middleware xác thực dữ liệu tạo đặt chỗ (Reservation).
 * Kiểm tra: vehicleType, reservationDate, startTime, endTime/duration, slotId.
 * 
 * @route POST /api/reservations
 */
export function validateCreateReservation(req, res, next) {
  const errors = [];

  const vehicleType = req.body.vehicleTypeId || req.body.vehicleType;
  const reservationDate = req.body.reservationDate || req.body.bookingDate;
  const startTime = req.body.startTime;
  const endTime = req.body.endTime;
  const duration = req.body.duration;
  const slotId = Number(req.body.slotId);

  if (!vehicleType) {
    errors.push("Loại phương tiện là bắt buộc");
  }

  if (!reservationDate) {
    errors.push("Ngày đặt chỗ là bắt buộc");
  }

  if (!startTime) {
    errors.push("Thời gian bắt đầu là bắt buộc");
  }

  if (!endTime && !duration) {
    errors.push("Cần có thời gian kết thúc hoặc thời lượng đặt chỗ");
  }

  if (!Number.isInteger(slotId) || slotId <= 0) {
    errors.push("Vị trí đỗ xe là bắt buộc");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(", "),
      errors,
    });
  }

  req.body.slotId = slotId;

  next();
}

/**
 * Middleware xác thực dữ liệu check-in xe.
 * Hỗ trợ 2 luồng:
 * 1. Check-in bằng Booking Code hoặc ReservationId (chỉ cần mã đặt chỗ)
 * 2. Check-in walk-in (cần driverId, plateNumber, vehicleTypeId, slotId)
 * 
 * @route POST /api/sessions/check-in
 */
export function validateCheckIn(req, res, next) {
  const errors = [];

  const bookingCode = trim(req.body.bookingCode);
  const reservationId = Number(req.body.reservationId);

  const hasBookingCode = Boolean(bookingCode);
  const hasReservationId = Number.isInteger(reservationId) && reservationId > 0;

  if (hasBookingCode || hasReservationId) {
    const plateNumber = trim(req.body.plateNumber).toUpperCase();

    if (plateNumber && !plateNumberRegex.test(plateNumber)) {
      errors.push("plateNumber không đúng định dạng. Ví dụ: 59A-12345 hoặc 59A-123.45");
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    if (hasReservationId) {
      req.body.reservationId = reservationId;
    }

    if (hasBookingCode) {
      req.body.bookingCode = bookingCode.toUpperCase();
    }

    if (plateNumber) {
      req.body.plateNumber = plateNumber;
    }

    return next();
  }

  const driverId = Number(req.body.driverId);
  const vehicleTypeId = Number(req.body.vehicleTypeId);
  const slotId = Number(req.body.slotId);
  const plateNumber = trim(req.body.plateNumber).toUpperCase();

  if (!Number.isInteger(driverId) || driverId <= 0) {
    errors.push("driverId không hợp lệ");
  }

  if (!plateNumber) {
    errors.push("plateNumber là bắt buộc");
  } else if (!plateNumberRegex.test(plateNumber)) {
    errors.push("plateNumber không đúng định dạng. Ví dụ: 59A-12345 hoặc 59A-123.45");
  }

  if (!Number.isInteger(vehicleTypeId) || vehicleTypeId <= 0) {
    errors.push("vehicleTypeId không hợp lệ");
  }

  if (!Number.isInteger(slotId) || slotId <= 0) {
    errors.push("slotId không hợp lệ");
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.driverId = driverId;
  req.body.vehicleTypeId = vehicleTypeId;
  req.body.slotId = slotId;
  req.body.plateNumber = plateNumber;

  next();
}

/**
 * Middleware xác thực dữ liệu check-out xe.
 * Kiểm tra: sessionId (số nguyên dương), paymentMethod (trong danh sách cho phép).
 * Các phương thức thanh toán cho phép: Cash, Card, Banking, Momo, VNPay, ZaloPay.
 * 
 * @route POST /api/sessions/check-out
 */
export function validateCheckOut(req, res, next) {
  const errors = [];

  const sessionId = Number(req.body.sessionId);
  const paymentMethod = trim(req.body.paymentMethod);

  const allowedPaymentMethods = ["Cash", "Card", "Banking", "Momo", "VNPay", "ZaloPay"];

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    errors.push("sessionId không hợp lệ");
  }

  if (!paymentMethod) {
    errors.push("paymentMethod là bắt buộc");
  } else if (!allowedPaymentMethods.includes(paymentMethod)) {
    errors.push(`paymentMethod chỉ được là: ${allowedPaymentMethods.join(", ")}`);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  req.body.sessionId = sessionId;
  req.body.paymentMethod = paymentMethod;

  next();
}
/**
 * Middleware xác thực dữ liệu Staff check-in walk-in (xe vào trực tiếp, không đặt trước).
 * Kiểm tra: plateNumber, vehicleTypeId, slotId (bắt buộc), driverId (tùy chọn).
 * Nếu không có driverId, BE sẽ tự dùng guest driver.
 * 
 * @route POST /api/staff/walk-in
 */
export function validateStaffWalkIn(req, res, next) {
  const errors = []

  const vehicleTypeId = Number(req.body.vehicleTypeId)
  const slotId = Number(req.body.slotId)
  const plateNumber = trim(req.body.plateNumber).toUpperCase()

  if (!plateNumber) {
    errors.push("plateNumber là bắt buộc")
  } else if (!plateNumberRegex.test(plateNumber)) {
    errors.push("plateNumber không đúng định dạng. Ví dụ: 59A-12345 hoặc 59A-123.45")
  }

  if (!Number.isInteger(vehicleTypeId) || vehicleTypeId <= 0) {
    errors.push("vehicleTypeId không hợp lệ")
  }

  if (!Number.isInteger(slotId) || slotId <= 0) {
    errors.push("slotId không hợp lệ")
  }

  // driverId là TÙY CHỌN — nếu staff không gửi, BE tự dùng guest driver
  if (req.body.driverId !== undefined && req.body.driverId !== null) {
    const driverId = Number(req.body.driverId)
    if (!Number.isInteger(driverId) || driverId <= 0) {
      errors.push("driverId không hợp lệ")
    } else {
      req.body.driverId = driverId
    }
  }

  if (errors.length > 0) return sendValidationError(res, errors)

  req.body.vehicleTypeId = vehicleTypeId
  req.body.slotId = slotId
  req.body.plateNumber = plateNumber
  next()
}

/**
 * Middleware xác thực dữ liệu Staff check-in booking (xe có đặt chỗ trước).
 * Chỉ validate plateNumber (reservationId nằm ở URL params).
 * 
 * @route POST /api/staff/booking-checkin/:reservationId
 */
export function validateStaffBookingCheckIn(req, res, next) {
  const errors = []
  const plateNumber = trim(req.body.plateNumber).toUpperCase()

  if (plateNumber && !plateNumberRegex.test(plateNumber)) {
    errors.push("plateNumber không đúng định dạng. Ví dụ: 59A-12345 hoặc 59A-123.45")
  }

  if (errors.length > 0) return sendValidationError(res, errors)

  if (plateNumber) req.body.plateNumber = plateNumber
  next()
}

/**
 * Middleware xác thực dữ liệu Staff check-out.
 * sessionId nằm ở URL params (không phải body). Chỉ validate paymentMethod.
 * 
 * @route POST /api/staff/checkout/:sessionId
 */
export function validateStaffCheckOut(req, res, next) {
  const errors = []

  const sessionId = Number(req.params.sessionId)   // ✅ đọc từ PARAMS
  const paymentMethod = trim(req.body.paymentMethod)
  const allowedPaymentMethods = ["Cash", "Card", "Banking", "Momo", "VNPay", "ZaloPay"]

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    errors.push("sessionId không hợp lệ")
  }

  if (!paymentMethod) {
    errors.push("paymentMethod là bắt buộc")
  } else if (!allowedPaymentMethods.includes(paymentMethod)) {
    errors.push(`paymentMethod chỉ được là: ${allowedPaymentMethods.join(", ")}`)
  }

  if (errors.length > 0) return sendValidationError(res, errors)

  req.body.paymentMethod = paymentMethod
  next()
}

/**
 * Middleware xác thực dữ liệu xác nhận phụ thu (surcharge).
 * Phụ thu chỉ chấp nhận thanh toán bằng: Cash hoặc Banking.
 * sessionId lấy từ URL params.
 * 
 * @route POST /api/staff/surcharge/:sessionId
 */
export function validateConfirmSurcharge(req, res, next) {
  const sessionId = Number(req.params.sessionId)
  const paymentMethod = trim(req.body.paymentMethod)

  const errors = []
  if (!Number.isInteger(sessionId) || sessionId <= 0) errors.push("sessionId không hợp lệ")
  if (!["Cash", "Banking"].includes(paymentMethod)) {
    errors.push("paymentMethod chỉ được là: Cash hoặc Banking")
  }

  if (errors.length > 0) return sendValidationError(res, errors)
  req.body.paymentMethod = paymentMethod
  next()
}