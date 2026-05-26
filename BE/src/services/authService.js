import ms from "ms";                        // ✅ fix 4: thêm import ms
import bcryptjs from "bcryptjs";                  // giữ nguyên import
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { getPool, sql } from "../config/db.js";
import JwtProvider from "../providers/JwtProvider.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const BCRYPT_ROUNDS = 10;

// ✅ fix 2: dùng ms() thay vì hardcode
const REFRESH_TTL = ms(process.env.REFRESH_TOKEN_EXPIRES || "7d");

function formatUser(u) {
    return {
        userId: u.UserID,
        fullName: u.FullName,
        email: u.Email,
        phone: u.PhoneNumber || null,
        roleId: u.RoleID,
        roleName: u.RoleName,
        avatarUrl: u.AvatarUrl || null,
    };
}

async function generateAndSaveTokens(pool, user, ip = null) {
    const payload = {
        userId: user.UserID,
        email: user.Email,
        roleId: user.RoleID,
        roleName: user.RoleName,
    };

    const accessToken = JwtProvider.generateAccessToken(payload);
    const refreshToken = JwtProvider.generateRefreshToken({ userId: user.UserID });
    const tokenHash = JwtProvider.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL); // ✅ fix 2

    await pool.request()
        .input("UserID", sql.Int, user.UserID)
        .input("TokenHash", sql.NVarChar(200), tokenHash)
        .input("ExpiresAt", sql.DateTime, expiresAt)
        .input("CreatedByIp", sql.NVarChar(45), ip || null)
        .execute("sp_SaveRefreshToken");

    return { accessToken, refreshToken };
}

// ── REGISTER ──────────────────────────────────────────────────
export async function registerService({ fullName, email, password, phoneNumber }) {
    const pool = await getPool();
    const passwordHash = await bcryptjs.hash(password, BCRYPT_ROUNDS); // ✅ fix 1

    const result = await pool.request()
        .input("FullName", sql.NVarChar(100), fullName.trim())
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .input("PasswordHash", sql.NVarChar(256), passwordHash)
        .input("PhoneNumber", sql.NVarChar(20), phoneNumber?.trim() || null)
        .execute("sp_RegisterLocal");

    return formatUser(result.recordset[0]);
}

// ── LOGIN LOCAL ───────────────────────────────────────────────
export async function loginService({ email, password }, ip) {
    const pool = await getPool();
    const result = await pool.request()
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .execute("sp_GetUserByEmail");

    const user = result.recordset[0];

    // Chống timing attack: luôn chạy bcrypt dù user không tồn tại
    const dummyHash = await bcryptjs.hash("dummy_password", BCRYPT_ROUNDS);
    const hashToTest = user?.PasswordHash || dummyHash;
    const isMatch = await bcryptjs.compare(password, hashToTest);

    if (!user || !isMatch || !user.HasLocalAuth) {
        const err = new Error("Email hoặc mật khẩu không đúng");
        err.statusCode = 401; throw err;
    }
    if (!user.IsActive) {
        const err = new Error("Tài khoản đã bị khóa, vui lòng liên hệ quản lý");
        err.statusCode = 403; throw err;
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(pool, user, ip);
    return { accessToken, refreshToken, user: formatUser(user) };
}

// ── GOOGLE LOGIN ──────────────────────────────────────────────
export async function googleLoginService(idToken, ip) {
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch {
        const err = new Error("Google token không hợp lệ");
        err.statusCode = 401; throw err;
    }

    const { sub, email, name, picture } = payload;
    const pool = await getPool();
    const result = await pool.request()
        .input("ProviderName", sql.NVarChar(20), "google")
        .input("ProviderUserID", sql.NVarChar(200), sub)
        .input("Email", sql.NVarChar(100), email || null)
        .input("FullName", sql.NVarChar(100), name || "Google User")
        .input("AvatarUrl", sql.NVarChar(500), picture || null)
        .execute("sp_UpsertSocialUser");

    const user = result.recordset[0];
    if (!user?.IsActive) {
        const err = new Error("Tài khoản đã bị khóa, vui lòng liên hệ quản lý");
        err.statusCode = 403; throw err;
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(pool, user, ip);
    return { accessToken, refreshToken, user: formatUser(user) };
}

// ── FACEBOOK LOGIN ────────────────────────────────────────────
export async function facebookLoginService(fbAccessToken, ip) {
    let fbData;
    try {
        const { data } = await axios.get("https://graph.facebook.com/me", {
            params: { access_token: fbAccessToken, fields: "id,name,email,picture.type(large)" },
            timeout: 5000,
        });
        fbData = data;
    } catch {
        const err = new Error("Facebook token không hợp lệ");
        err.statusCode = 401; throw err;
    }

    const { id, name, email, picture } = fbData;
    const pool = await getPool();
    const result = await pool.request()
        .input("ProviderName", sql.NVarChar(20), "facebook")
        .input("ProviderUserID", sql.NVarChar(200), id)
        .input("Email", sql.NVarChar(100), email || null)
        .input("FullName", sql.NVarChar(100), name || "Facebook User")
        .input("AvatarUrl", sql.NVarChar(500), picture?.data?.url || null)
        .execute("sp_UpsertSocialUser");

    const user = result.recordset[0];
    if (!user?.IsActive) {
        const err = new Error("Tài khoản đã bị khóa, vui lòng liên hệ quản lý");
        err.statusCode = 403; throw err;
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(pool, user, ip);
    return { accessToken, refreshToken, user: formatUser(user) };
}

// ── REFRESH TOKEN ─────────────────────────────────────────────
export async function refreshTokenService(rawRefreshToken, ip) {
    try {
        JwtProvider.verifyRefreshToken(rawRefreshToken);
    } catch {
        const err = new Error("Refresh token không hợp lệ hoặc đã hết hạn");
        err.statusCode = 401;
        err.code = "REFRESH_TOKEN_EXPIRED";
        throw err;
    }

    const pool = await getPool();
    const tokenHash = JwtProvider.hashToken(rawRefreshToken);

    const result = await pool.request()
        .input("TokenHash", sql.NVarChar(200), tokenHash)
        .execute("sp_GetUserByRefreshToken");

    if (result.recordset.length === 0) {
        const err = new Error("Refresh token không hợp lệ hoặc đã hết hạn");
        err.statusCode = 401;
        err.code = "REFRESH_TOKEN_EXPIRED";
        throw err;
    }

    const user = result.recordset[0];

    await pool.request()
        .input("TokenHash", sql.NVarChar(200), tokenHash)
        .execute("sp_RevokeRefreshToken");

    const { accessToken, refreshToken: newRefreshToken } =
        await generateAndSaveTokens(pool, user, ip);

    return { accessToken, refreshToken: newRefreshToken };
}

// ── LOGOUT ────────────────────────────────────────────────────
export async function logoutService(rawRefreshToken) {
    if (!rawRefreshToken) return;
    try {
        const pool = await getPool();
        const tokenHash = JwtProvider.hashToken(rawRefreshToken);
        await pool.request()
            .input("TokenHash", sql.NVarChar(200), tokenHash)
            .execute("sp_RevokeRefreshToken");
    } catch { /* token không tồn tại → coi như đã logout */ }
}

// ── GET ME ────────────────────────────────────────────────────
export async function getMeService(userId) {
    const pool = await getPool();
    const result = await pool.request()
        .input("UserID", sql.Int, userId)
        .query(`
      SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber,
             u.RoleID, r.RoleName, u.AvatarUrl,
             u.DateOfBirth, u.HireDate, u.IsActive,
             u.CreatedAt, u.UpdatedAt
      FROM Users u
      JOIN Roles r ON u.RoleID = r.RoleID
      WHERE u.UserID = @UserID AND u.IsActive = 1
    `);

    if (result.recordset.length === 0) {
        const err = new Error("Không tìm thấy user");
        err.statusCode = 404; throw err;
    }

    return result.recordset[0];
}

// ── FORGOT PASSWORD ───────────────────────────────────────────
export async function forgotPasswordService(email) {
    const pool = await getPool();
    const result = await pool.request()
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .query("SELECT UserID FROM Users WHERE Email = @Email AND IsActive = 1");

    if (result.recordset.length === 0) return;

    const userId = result.recordset[0].UserID;
    const resetToken = JwtProvider.generateAccessToken({ userId });
    const resetExpires = new Date(Date.now() + ms("15m")); // ✅ fix 3

    await pool.request()
        .input("UserID", sql.Int, userId)
        .input("ResetToken", sql.NVarChar(500), resetToken)
        .input("ResetTokenExpires", sql.DateTime, resetExpires)
        .query(`
      UPDATE Users
      SET ResetToken = @ResetToken, ResetTokenExpires = @ResetTokenExpires,
          UpdatedAt  = GETDATE()
      WHERE UserID = @UserID
    `);

    console.log("🔑 Reset link:",
        `${process.env.FE_ORIGIN}/reset-password?token=${resetToken}`);
}

// ── RESET PASSWORD ────────────────────────────────────────────
export async function resetPasswordService({ token, newPassword }) {
    let decoded;
    try {
        decoded = JwtProvider.verifyAccessToken(token);
    } catch {
        const err = new Error("Token không hợp lệ hoặc đã hết hạn");
        err.statusCode = 400; throw err;
    }

    const pool = await getPool();
    const result = await pool.request()
        .input("UserID", sql.Int, decoded.userId)
        .input("ResetToken", sql.NVarChar(500), token)
        .query(`
      SELECT UserID FROM Users
      WHERE UserID = @UserID AND ResetToken = @ResetToken
        AND ResetTokenExpires > GETDATE() AND IsActive = 1
    `);

    if (result.recordset.length === 0) {
        const err = new Error("Token không hợp lệ hoặc đã hết hạn");
        err.statusCode = 400; throw err;
    }

    const hashedPassword = await bcryptjs.hash(newPassword, BCRYPT_ROUNDS); // ✅ fix 1
    await pool.request()
        .input("UserID", sql.Int, decoded.userId)
        .input("PasswordHash", sql.NVarChar(256), hashedPassword)
        .query(`
      UPDATE Users
      SET PasswordHash = @PasswordHash, ResetToken = NULL,
          ResetTokenExpires = NULL, UpdatedAt = GETDATE()
      WHERE UserID = @UserID
    `);
}