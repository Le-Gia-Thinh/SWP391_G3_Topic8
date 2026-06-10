import ms from "ms";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import axios from "axios";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { getPool, sql } from "../config/db.js";
import JwtProvider from "../providers/JwtProvider.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const BCRYPT_ROUNDS = 10;
const REFRESH_TTL = ms(process.env.REFRESH_TOKEN_EXPIRES || "7d");
const SESSION_ABSOLUTE_TTL = ms(process.env.SESSION_ABSOLUTE_EXPIRES);
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendVerifyEmail(email, fullName, token) {
    const url = `http://localhost:5000/api/auth/verify-email?token=${token}`;
    await transporter.sendMail({
        from: `"Parking System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Xác minh địa chỉ email của bạn",
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2>Xin chào, ${fullName}!</h2>
                <p>Vui lòng click nút bên dưới để xác minh email:</p>
                <a href="${url}"
                   style="display:inline-block;padding:12px 24px;background:#1976d2;
                          color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
                    Xác minh email
                </a>
                <p style="color:#888;font-size:13px;margin-top:16px">
                    Link có hiệu lực trong 24 giờ.
                </p>
            </div>
        `,
    });
}

// ✅ Bug 2 fix — thêm isEmailVerified
function formatUser(u) {
    return {
        userId: u.UserID,
        fullName: u.FullName,
        email: u.Email,
        phone: u.PhoneNumber || null,
        roleId: u.RoleID,
        roleName: u.RoleName,
        avatarUrl: u.AvatarUrl || null,
        isEmailVerified: !!u.IsEmailVerified,
    };
}

async function generateAndSaveTokens(pool, user, ip = null, existingSessionExpiresAt = null) {
    const payload = {
        userId: user.UserID,
        email: user.Email,
        roleId: user.RoleID,
        roleName: user.RoleName,
    };

    const accessToken = JwtProvider.generateAccessToken(payload);
    const refreshToken = JwtProvider.generateRefreshToken({ userId: user.UserID });

    const tokenHash = JwtProvider.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL);

    const sessionExpiresAt =
        existingSessionExpiresAt
            ? new Date(existingSessionExpiresAt)
            : new Date(Date.now() + SESSION_ABSOLUTE_TTL);

    await pool.request()
        .input("UserID", sql.Int, user.UserID)
        .input("TokenHash", sql.NVarChar(200), tokenHash)
        .input("ExpiresAt", sql.DateTime, expiresAt)
        .input("SessionExpiresAt", sql.DateTime, sessionExpiresAt)
        .input("CreatedByIp", sql.NVarChar(45), ip || null)
        .execute("sp_SaveRefreshToken");

    console.log("====================================");
    console.log("🆕 Tokens created");
    console.log("UserID:", user.UserID);
    console.log("Refresh expires at:", expiresAt.toISOString());
    console.log("Session absolute expires at:", sessionExpiresAt.toISOString());
    console.log("Refresh TTL seconds:", Math.floor(REFRESH_TTL / 1000));
    console.log("Absolute session TTL seconds:", Math.floor((sessionExpiresAt - Date.now()) / 1000));
    console.log("====================================");

    return { accessToken, refreshToken };
}

// ✅ Bug 1 fix — dùng crypto.randomUUID() thay JWT
export async function registerService({ fullName, email, password, phoneNumber }) {
    const pool = await getPool();
    const passwordHash = await bcryptjs.hash(password, BCRYPT_ROUNDS);

    const verifyToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ms("24h"));

    const result = await pool.request()
        .input("FullName", sql.NVarChar(100), fullName.trim())
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .input("PasswordHash", sql.NVarChar(256), passwordHash)
        .input("PhoneNumber", sql.NVarChar(20), phoneNumber?.trim() || null)
        .input("EmailVerifyToken", sql.NVarChar(500), verifyToken)
        .input("EmailVerifyExpires", sql.DateTime, expiresAt)
        .execute("sp_RegisterLocal");

    const user = result.recordset[0];

    sendVerifyEmail(user.Email, user.FullName, verifyToken).catch((err) => {
        console.error("❌ Gửi verify email thất bại:", err.message);
    });

    return formatUser(user);
}

export async function loginService({ email, password }, ip) {
    const pool = await getPool();
    const result = await pool.request()
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .execute("sp_GetUserByEmail");

    const user = result.recordset[0];

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
    if (!user.IsEmailVerified) {
        const err = new Error("Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư của bạn.");
        err.statusCode = 403;
        err.code = "EMAIL_NOT_VERIFIED";
        throw err;
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(pool, user, ip);
    return { accessToken, refreshToken, user: formatUser(user) };
}

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
    if (!user) throw new Error("Không thể xử lý đăng nhập Google");

    if (!user.IsActive) {
        const err = new Error("Tài khoản đã bị khóa, vui lòng liên hệ quản lý");
        err.statusCode = 403; throw err;
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(pool, user, ip);

    const message = user.IsNewLink
        ? "Đã liên kết Google vào tài khoản hiện có của bạn"
        : "Đăng nhập Google thành công";

    return { accessToken, refreshToken, user: formatUser(user), message };
}

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
    if (!user) throw new Error("Không thể xử lý đăng nhập Facebook");

    if (!user.IsActive) {
        const err = new Error("Tài khoản đã bị khóa, vui lòng liên hệ quản lý");
        err.statusCode = 403; throw err;
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(pool, user, ip);

    const message = user.IsNewLink
        ? "Đã liên kết Facebook vào tài khoản hiện có của bạn"
        : "Đăng nhập Facebook thành công";

    return { accessToken, refreshToken, user: formatUser(user), message };
}

export async function verifyEmailService(token) {
    if (!token) {
        const err = new Error("Token không hợp lệ");
        err.statusCode = 400; throw err;
    }

    const pool = await getPool();
    await pool.request()
        .input("Token", sql.NVarChar(500), token)
        .execute("sp_VerifyEmail");
}

// ✅ Bug 1 fix — dùng UUID
export async function resendVerifyEmailService(email) {
    if (!email) return;

    const pool = await getPool();
    const verifyToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ms("24h"));

    let result;
    try {
        result = await pool.request()
            .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
            .input("EmailVerifyToken", sql.NVarChar(500), verifyToken)
            .input("EmailVerifyExpires", sql.DateTime, expiresAt)
            .execute("sp_ResendVerifyEmail");
    } catch {
        return;
    }

    const userId = result.recordset[0]?.UserID;
    if (!userId) return;

    const userRes = await pool.request()
        .input("UserID", sql.Int, userId)
        .query("SELECT FullName, Email FROM Users WHERE UserID = @UserID");

    const user = userRes.recordset[0];
    if (!user) return;

    sendVerifyEmail(user.Email, user.FullName, verifyToken).catch((err) => {
        console.error("❌ Gửi lại verify email thất bại:", err.message);
    });
}

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
        const err = new Error("Refresh token không hợp lệ hoặc session đã hết hạn");
        err.statusCode = 401;
        err.code = "REFRESH_TOKEN_EXPIRED";
        throw err;
    }

    const user = result.recordset[0];

    if (new Date(user.SessionExpiresAt) <= new Date()) {
        const err = new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        err.statusCode = 401;
        err.code = "SESSION_EXPIRED";
        throw err;
    }

    await pool.request()
        .input("TokenHash", sql.NVarChar(200), tokenHash)
        .execute("sp_RevokeRefreshToken");

    const { accessToken, refreshToken: newRefreshToken } =
        await generateAndSaveTokens(pool, user, ip, user.SessionExpiresAt);

    return { accessToken, refreshToken: newRefreshToken };
}

export async function logoutService(rawRefreshToken) {
    if (!rawRefreshToken) return;
    try {
        const pool = await getPool();
        const tokenHash = JwtProvider.hashToken(rawRefreshToken);
        await pool.request()
            .input("TokenHash", sql.NVarChar(200), tokenHash)
            .execute("sp_RevokeRefreshToken");
    } catch { }
}

// ✅ Bug 2 fix — thêm IsEmailVerified vào SELECT
export async function getMeService(userId) {
    const pool = await getPool();
    const result = await pool.request()
        .input("UserID", sql.Int, userId)
        .query(`
            SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber,
                   u.RoleID, r.RoleName, u.AvatarUrl,
                   u.IsEmailVerified,
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

    return formatUser(result.recordset[0]);
}

export async function forgotPasswordService(email) {
    const pool = await getPool();
    const result = await pool.request()
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .query("SELECT UserID FROM Users WHERE Email = @Email AND IsActive = 1");

    if (result.recordset.length === 0) return;

    const userId = result.recordset[0].UserID;
    const resetToken = JwtProvider.generateAccessToken({ userId });
    const resetExpires = new Date(Date.now() + ms("15m"));

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

    console.log("🔑 Reset link:", `${process.env.FE_ORIGIN}/reset-password?token=${resetToken}`);
}

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

    const hashedPassword = await bcryptjs.hash(newPassword, BCRYPT_ROUNDS);
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
export async function checkEmailVerifyStatusService(email) {
    if (!email) {
        const err = new Error("Email là bắt buộc");
        err.statusCode = 400;
        throw err;
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .query(`
            SELECT IsEmailVerified
            FROM Users
            WHERE Email = @Email AND IsActive = 1
        `);

    if (result.recordset.length === 0) {
        return { isEmailVerified: false };
    }

    return {
        isEmailVerified: !!result.recordset[0].IsEmailVerified
    };
}