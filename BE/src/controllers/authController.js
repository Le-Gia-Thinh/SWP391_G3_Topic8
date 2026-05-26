import crypto from "crypto";
import { getPool, sql } from "../config/db.js";

const PASSWORD_HASH_CONFIG = {
  prefix: "pbkdf2",
  iterations: 120000,
  keyLength: 64,
  digest: "sha512"
};

function trimValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email) {
  return trimValue(email).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidVietnamPhone(phoneNumber) {
  return /^0\d{9}$/.test(phoneNumber);
}

function isValidPlateNumber(plateNumber) {
  if (!plateNumber) return true;

  return /^(\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}|\d{2}[A-Z]{1,2}-?\d{4,5})$/i.test(
    plateNumber
  );
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .pbkdf2Sync(
      password,
      salt,
      PASSWORD_HASH_CONFIG.iterations,
      PASSWORD_HASH_CONFIG.keyLength,
      PASSWORD_HASH_CONFIG.digest
    )
    .toString("hex");

  return `${PASSWORD_HASH_CONFIG.prefix}$${PASSWORD_HASH_CONFIG.iterations}$${salt}$${hash}`;
}

function buildRegisterPayload(body) {
  return {
    fullName: trimValue(body.fullName),
    phoneNumber: trimValue(body.phoneNumber),
    email: normalizeEmail(body.email),
    password: trimValue(body.password),
    confirmPassword: trimValue(body.confirmPassword),
    plateNumber: trimValue(body.plateNumber).toUpperCase(),
    vehicleType: trimValue(body.vehicleType),
    terms: Boolean(body.terms || body.acceptedTerms)
  };
}

function validateRegisterPayload(payload) {
  const errors = [];

  if (!payload.fullName) {
    errors.push("Vui lòng nhập họ và tên.");
  }

  if (!payload.phoneNumber) {
    errors.push("Vui lòng nhập số điện thoại.");
  } else if (!isValidVietnamPhone(payload.phoneNumber)) {
    errors.push("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.");
  }

  if (!payload.email) {
    errors.push("Vui lòng nhập email.");
  } else if (!isValidEmail(payload.email)) {
    errors.push("Email không đúng định dạng.");
  }

  if (!payload.password || payload.password.length < 8) {
    errors.push("Mật khẩu phải chứa ít nhất 8 ký tự.");
  }

  if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
    errors.push("Mật khẩu và xác nhận mật khẩu không khớp.");
  }

  if (payload.plateNumber && !isValidPlateNumber(payload.plateNumber)) {
    errors.push("Biển số xe không đúng định dạng. Ví dụ: 59A-123.45.");
  }

  if (!payload.terms) {
    errors.push("Vui lòng đồng ý với các điều khoản dịch vụ để tiếp tục.");
  }

  return errors;
}

async function getDriverRoleId(pool) {
  const result = await pool.request().query(`
    SELECT TOP 1 RoleID
    FROM Roles
    WHERE RoleName IN (N'Driver', N'Tài xế', N'Tai xe')
       OR LOWER(RoleName) = 'driver'
  `);

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset[0].RoleID;
}

async function findExistingUser(pool, email, phoneNumber) {
  const result = await pool
    .request()
    .input("Email", sql.NVarChar(100), email)
    .input("PhoneNumber", sql.NVarChar(20), phoneNumber)
    .query(`
      SELECT TOP 1 UserID, Email, PhoneNumber
      FROM Users
      WHERE Email = @Email OR PhoneNumber = @PhoneNumber
    `);

  return result.recordset[0] || null;
}

function buildDuplicateErrors(existingUser, email, phoneNumber) {
  const errors = [];

  if (String(existingUser.Email).toLowerCase() === email) {
    errors.push("Email đã được sử dụng.");
  }

  if (existingUser.PhoneNumber === phoneNumber) {
    errors.push("Số điện thoại đã được sử dụng.");
  }

  return errors;
}

async function createDriverUser(pool, payload, roleId) {
  const passwordHash = hashPassword(payload.password);

  const result = await pool
    .request()
    .input("FullName", sql.NVarChar(100), payload.fullName)
    .input("Email", sql.NVarChar(100), payload.email)
    .input("PasswordHash", sql.NVarChar(256), passwordHash)
    .input("PhoneNumber", sql.NVarChar(20), payload.phoneNumber)
    .input("RoleID", sql.Int, roleId)
    .query(`
      INSERT INTO Users
        (
          FullName,
          Email,
          PasswordHash,
          PhoneNumber,
          RoleID,
          DateOfBirth,
          HireDate,
          IsActive
        )
      OUTPUT
        INSERTED.UserID,
        INSERTED.FullName,
        INSERTED.Email,
        INSERTED.PhoneNumber,
        INSERTED.RoleID,
        INSERTED.IsActive
      VALUES
        (
          @FullName,
          @Email,
          @PasswordHash,
          @PhoneNumber,
          @RoleID,
          NULL,
          NULL,
          0
        )
    `);

  return result.recordset[0];
}

export async function registerDriver(req, res, next) {
  try {
    const payload = buildRegisterPayload(req.body);
    const validationErrors = validateRegisterPayload(payload);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đăng ký không hợp lệ.",
        errors: validationErrors
      });
    }

    const pool = await getPool();

    const driverRoleId = await getDriverRoleId(pool);

    if (!driverRoleId) {
      return res.status(500).json({
        success: false,
        message: "Database chưa có role Driver/Tài xế trong bảng Roles."
      });
    }

    const existingUser = await findExistingUser(
      pool,
      payload.email,
      payload.phoneNumber
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Tài khoản đã tồn tại.",
        errors: buildDuplicateErrors(
          existingUser,
          payload.email,
          payload.phoneNumber
        )
      });
    }

    const newUser = await createDriverUser(pool, payload, driverRoleId);

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Tài khoản đang chờ Ban Quản Lý phê duyệt.",
      data: {
        user: newUser,
        vehicle: {
          plateNumber: payload.plateNumber || null,
          vehicleType: payload.vehicleType || null,
          note: "Hiện tại database chưa có bảng lưu xe riêng nên thông tin xe chưa được lưu."
        }
      }
    });
  } catch (err) {
    next(err);
  }
}