// src/utilities/authValidation.js
// Validate input trước khi vào controller

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vietnamPhoneRegex = /^0\d{9}$/;

// Cho phép dạng biển số phổ biến:
// 59A-12345
// 59A-123.45
// 59AB-12345
// 51F-99999
const plateNumberRegex = /^(\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}|\d{2}[A-Z]{1,2}-?\d{4,5})$/i;

function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    message: errors.join(", "),
    errors,
  });
}

function isValidEmail(email) {
  return emailRegex.test(String(email || "").trim());
}

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

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

export function validateForgotPassword(req, res, next) {
  const email = trim(req.body.email).toLowerCase();

  if (!email || !isValidEmail(email)) {
    return sendValidationError(res, ["email không hợp lệ"]);
  }

  req.body.email = email;
  next();
}

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

export function validateSocialLogin(req, res, next) {
  const { idToken, accessToken } = req.body;

  if (!idToken && !accessToken) {
    return sendValidationError(res, ["Token mạng xã hội là bắt buộc"]);
  }

  next();
}

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