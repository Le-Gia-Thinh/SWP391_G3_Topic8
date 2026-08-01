/**
 * FILE: authService.js
 * MÔ TẢ: Service cung cấp toàn bộ logic xác thực người dùng và bảo mật hệ thống (Authentication & Authorization Core Service).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. ĐĂNG KÝ XÁC MINH EMAIL (`registerService`, `sendVerifyEmail`): Mã hóa mật khẩu qua `bcryptjs` (salt rounds = 10), sinh ngẫu nhiên Token UUID 24h và gửi mail xác nhận qua SMTP Mailer.
 * 2. ĐĂNG NHẬP THƯỜNG (`loginService`): Truy vấn DB qua Stored Procedure `sp_GetUserByEmail`, đối chiếu hash mật khẩu với `bcryptjs.compare`, cấp cặp Access Token (ngắn hạn: 1h) & Refresh Token (dài hạn: 7d/30d).
 * 3. ĐĂNG NHẬP GOOGLE OAUTH2 (`googleLoginService`): Dùng thư viện chính thức `google-auth-library` (`OAuth2Client`) để xác thực `idToken` từ Google cấp cho Frontend ➔ Gọi Stored Proc `sp_UpsertSocialUser` để tạo mới hoặc liên kết tài khoản tự động.
 * 4. CƠ CHẾ BẢO MỆT HASH REFRESH TOKEN: Mã Refresh Token không lưu trực tiếp ở dạng thô dưới DB mà được băm SHA-256 (`JwtProvider.hashToken`) giúp ngăn ngừa rò rỉ dữ liệu khi CSDL bị lộ.
 * 5. CẤP LẠI TOKEN (`refreshTokenService`): Thu hồi Refresh Token cũ (Token Rotation) và cấp phát cặp Token mới.
 * 
 * @module authService
 */

import ms from "ms";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import axios from "axios";
import { sendMail } from "./mailService.js";
import { OAuth2Client } from "google-auth-library";
import { getPool, sql } from "../config/db.js";
import JwtProvider from "../providers/JwtProvider.js";

// Khởi tạo Google OAuth Client với Client ID từ biến môi trường
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const BCRYPT_ROUNDS = 10; // Trọng số Salt Rounds mã hóa mật khẩu Bcrypt
const REFRESH_TTL = ms(process.env.REFRESH_TOKEN_EXPIRES || "7d"); // Thời gian sống Refresh Token (7 ngày)
const SESSION_ABSOLUTE_TTL = ms(process.env.SESSION_ABSOLUTE_EXPIRES || "30d"); // Thời gian sống tối đa của 1 Session (30 ngày)

/**
 * HÀM 1: sendVerifyEmail
 * TÁC DỤNG: Sinh mẫu email HTML đẹp mắt và gửi đường dẫn Kích hoạt tài khoản tới Email người dùng vừa đăng ký.
 */
export async function sendVerifyEmail(email, fullName, token) {
    const url = `http://localhost:5000/api/auth/verify-email?token=${token}`;
    await sendMail({
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

/**
 * HÀM PHỤ: formatUser
 * TÁC DỤNG: Chuẩn hóa đối tượng User trả về cho Frontend (Loại bỏ các thông tin nhạy cảm như Mật khẩu Hash).
 */
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
        accountBalance: u.AccountBalance || 0,
        dateOfBirth: u.DateOfBirth ? new Date(u.DateOfBirth).toISOString().split('T')[0] : null,
        hasPassword: u.HasPassword !== undefined ? !!u.HasPassword : (u.PasswordHash != null || !!u.HasLocalAuth),
    };
}

/**
 * HÀM PHỤ: generateAndSaveTokens
 * TÁC DỤNG: Sinh cặp Access Token + Refresh Token và băm lưu TokenHash vào CSDL thông qua Stored Procedure `sp_SaveRefreshToken`.
 */
async function generateAndSaveTokens(pool, user, ip = null, existingSessionExpiresAt = null) {
    const payload = {
        userId: user.UserID,
        email: user.Email,
        roleId: user.RoleID,
        roleName: user.RoleName,
    };

    // 1. Tạo JWT Tokens
    const accessToken = JwtProvider.generateAccessToken(payload);
    const refreshToken = JwtProvider.generateRefreshToken({ userId: user.UserID });

    // 2. Băm mã Refresh Token bằng SHA-256 trước khi lưu vào DB
    const tokenHash = JwtProvider.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL);

    const sessionExpiresAt =
        existingSessionExpiresAt
            ? new Date(existingSessionExpiresAt)
            : new Date(Date.now() + SESSION_ABSOLUTE_TTL);

    // 3. Gọi Stored Procedure lưu Hash vào bảng RefreshTokens
    await pool.request()
        .input("UserID", sql.Int, user.UserID)
        .input("TokenHash", sql.NVarChar(200), tokenHash)
        .input("ExpiresAt", sql.DateTime, expiresAt)
        .input("SessionExpiresAt", sql.DateTime, sessionExpiresAt)
        .input("CreatedByIp", sql.NVarChar(45), ip || null)
        .execute("sp_SaveRefreshToken");

    return { accessToken, refreshToken };
}

/**
 * HÀM 2: registerService
 * TÁC DỤNG: Xử lý Đăng ký tài khoản địa phương (Local Registration) bằng Email/Mật khẩu.
 */
export async function registerService({ fullName, email, password, phoneNumber }) {
    const pool = await getPool();
    // Băm mật khẩu bằng Bcrypt
    const passwordHash = await bcryptjs.hash(password, BCRYPT_ROUNDS);

    // Sinh Token ngẫu nhiên bằng UUID v4
    const verifyToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ms("24h"));

    // Thực thi Stored Procedure tạo tài khoản trong CSDL
    const result = await pool.request()
        .input("FullName", sql.NVarChar(100), fullName.trim())
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .input("PasswordHash", sql.NVarChar(256), passwordHash)
        .input("PhoneNumber", sql.NVarChar(20), phoneNumber?.trim() || null)
        .input("EmailVerifyToken", sql.NVarChar(500), verifyToken)
        .input("EmailVerifyExpires", sql.DateTime, expiresAt)
        .execute("sp_RegisterLocal");

    const user = result.recordset[0];

    // Gửi email xác minh bất đồng bộ (không await để trả về response cho user nhanh)
    sendVerifyEmail(user.Email, user.FullName, verifyToken).catch((err) => {
        console.error("❌ Gửi verify email thất bại:", err.message);
    });

    return formatUser(user);
}

/**
 * HÀM 3: loginService
 * TÁC DỤNG: Xử lý Đăng nhập tài khoản Local (Email & Mật khẩu).
 */
export async function loginService({ email, password }, ip) {
    const pool = await getPool();
    // Gọi Stored Procedure lấy thông tin người dùng theo Email
    const result = await pool.request()
        .input("Email", sql.NVarChar(100), email.trim().toLowerCase())
        .execute("sp_GetUserByEmail");

    const user = result.recordset[0];

    // Tránh Timing Attack: Băm một chuỗi dummy nếu không tìm thấy User
    const dummyHash = await bcryptjs.hash("dummy_password", BCRYPT_ROUNDS);
    const hashToTest = user?.PasswordHash || dummyHash;
    // So sánh mật khẩu bằng bcrypt.compare
    const isMatch = await bcryptjs.compare(password, hashToTest);

    if (!user || !isMatch || !user.HasLocalAuth) {
        const err = new Error("Email hoặc mật khẩu không đúng");
        err.statusCode = 401;
        err.code = "INVALID_CREDENTIALS";
        throw err;
    }
    if (!user.IsActive) {
        const err = new Error("Tài khoản đã bị khóa, vui lòng liên hệ quản lý");
        err.statusCode = 403; throw err;
    }

    // Bỏ qua yêu cầu xác minh email nếu là các Email giả lập dùng để Test
    const emailLower = String(user.Email || "").toLowerCase().trim();
    const isFakeSystemEmail = 
        emailLower.endsWith("@email.com") || 
        emailLower.endsWith("@parking.com") || 
        emailLower.endsWith("@example.com");

    if (!user.IsEmailVerified && !isFakeSystemEmail) {
        const err = new Error("Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư của bạn.");
        err.statusCode = 403;
        err.code = "EMAIL_NOT_VERIFIED";
        throw err;
    }

    // Sinh cặp Token và trả về thành công
    const { accessToken, refreshToken } = await generateAndSaveTokens(pool, user, ip);
    const formattedUser = formatUser(user);
    formattedUser.permissions = await getUserEffectivePermissions(pool, user.UserID, user.RoleName, user.RoleID);

    return { accessToken, refreshToken, user: formattedUser };
}

/**
 * HÀM 4: googleLoginService
 * TÁC DỤNG: Xử lý Đăng nhập / Đăng ký bằng Tài khoản Google (Google OAuth2 Single Sign-On).
 */
export async function googleLoginService(idToken, ip) {
    let payload;
    try {
        // Xác thực ID Token gửi từ Google SDK bằng OAuth2Client
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
    // Gọi Stored Proc sp_UpsertSocialUser (Nếu chưa có ➔ Tạo mới; Nếu đã có Email ➔ Liên kết GoogleID)
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

/**
 * HÀM 5: verifyEmailService
 * TÁC DỤNG: Thực thi kích hoạt tài khoản khi người dùng nhấp vào Link trong Email.
 */
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

/**
 * HÀM 6: resendVerifyEmailService
 * TÁC DỤNG: Gửi lại Email xác minh tài khoản nếu mail trước bị thất lạc hoặc hết hạn.
 */
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

/**
 * HÀM 7: refreshTokenService
 * TÁC DỤNG: Cấp lại Access Token mới bằng Refresh Token hợp lệ (Cơ chế Token Rotation).
 */
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

    // Kiểm tra thời gian hết hạn tuyệt đối của Session
    if (new Date(user.SessionExpiresAt) <= new Date()) {
        const err = new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        err.statusCode = 401;
        err.code = "SESSION_EXPIRED";
        throw err;
    }

    // Thu hồi Refresh Token cũ (Revoke Old Token)
    await pool.request()
        .input("TokenHash", sql.NVarChar(200), tokenHash)
        .execute("sp_RevokeRefreshToken");

    // Sinh và lưu cặp Token mới
    const { accessToken, refreshToken: newRefreshToken } =
        await generateAndSaveTokens(pool, user, ip, user.SessionExpiresAt);

    return { accessToken, refreshToken: newRefreshToken };
}

/**
 * HÀM 8: logoutService
 * TÁC DỤNG: Thu hồi Refresh Token khi người dùng bấm Đăng xuất.
 */
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

async function getUserEffectivePermissions(pool, userId, roleName, roleId) {
    if (roleName === 'Admin') {
        return [
            'VIEW_SLOTS', 'MANAGE_SESSIONS', 'MANAGE_USERS', 'VIEW_REPORTS',
            'MANAGE_PAYMENTS', 'MANAGE_PRICING', 'MANAGE_BUILDINGS', 'MANAGE_INCIDENTS', 'MANAGE_SUPPORT'
        ];
    }

    try {
        const hasUserPerms = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`SELECT COUNT(*) AS total FROM UserPermissions WHERE UserID = @UserID`);

        if (hasUserPerms.recordset[0]?.total > 0) {
            const custom = await pool.request()
                .input('UserID', sql.Int, userId)
                .query(`
                    SELECT p.PermissionName
                    FROM UserPermissions up
                    JOIN Permissions p ON p.PermissionID = up.PermissionID
                    WHERE up.UserID = @UserID AND up.IsGranted = 1
                `);
            return custom.recordset.map(r => r.PermissionName);
        }

        const rolePerms = await pool.request()
            .input('RoleID', sql.Int, roleId)
            .query(`
                SELECT p.PermissionName
                FROM RolePermissions rp
                JOIN Permissions p ON p.PermissionID = rp.PermissionID
                WHERE rp.RoleID = @RoleID
            `);

        return rolePerms.recordset.map(r => r.PermissionName);
    } catch (err) {
        console.warn('⚠️ Lỗi truy vấn bảng RBAC (CSDL có thể chưa cập nhật script tạo bảng UserPermissions):', err.message);
        if (roleName === 'Staff') return ['VIEW_SLOTS', 'MANAGE_SESSIONS', 'MANAGE_PAYMENTS'];
        if (roleName === 'Manager') return ['VIEW_SLOTS', 'MANAGE_SESSIONS', 'MANAGE_USERS', 'VIEW_REPORTS', 'MANAGE_PAYMENTS'];
        if (roleName === 'Driver') return ['VIEW_SLOTS'];
        return [];
    }
}

/**
 * HÀM 9: getMeService
 * TÁC DỤNG: Lấy toàn bộ hồ sơ thông tin của chính tài khoản đang đăng nhập.
 */
export async function getMeService(userId) {
    const pool = await getPool();
    const result = await pool.request()
        .input("UserID", sql.Int, userId)
        .query(`
            SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber,
                   u.RoleID, r.RoleName, u.AvatarUrl,
                   u.IsEmailVerified, u.AccountBalance,
                   u.DateOfBirth, u.HireDate, u.IsActive,
                   u.CreatedAt, u.UpdatedAt,
                   CAST(CASE WHEN u.PasswordHash IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS HasPassword
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.UserID = @UserID AND u.IsActive = 1
        `);

    if (result.recordset.length === 0) {
        const err = new Error("Không tìm thấy user");
        err.statusCode = 404; throw err;
    }

    const rawUser = result.recordset[0];
    const formatted = formatUser(rawUser);
    formatted.permissions = await getUserEffectivePermissions(pool, rawUser.UserID, rawUser.RoleName, rawUser.RoleID);
    return formatted;
}

/**
 * HÀM 10: forgotPasswordService
 * TÁC DỤNG: Xử lý yêu cầu Quên mật khẩu, sinh Reset Token hạn 15 phút.
 */
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

/**
 * HÀM 11: resetPasswordService
 * TÁC DỤNG: Cập nhật mật khẩu mới khi có Reset Token hợp lệ từ Email.
 */
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

/**
 * HÀM 12: checkEmailVerifyStatusService
 * TÁC DỤNG: Kiểm tra xem email của người dùng đã được xác minh chưa.
 */
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

/**
 * HÀM 13: changePasswordService
 * TÁC DỤNG: Đổi mật khẩu chủ động từ trang Hồ sơ người dùng.
 */
export async function changePasswordService(userId, oldPassword, newPassword) {
    const pool = await getPool();

    // 1. Kiểm tra mật khẩu cũ
    const result = await pool.request()
        .input("UserID", sql.Int, userId)
        .query("SELECT PasswordHash FROM Users WHERE UserID = @UserID AND IsActive = 1");

    if (result.recordset.length === 0) {
        const err = new Error("Không tìm thấy user");
        err.statusCode = 404; throw err;
    }

    const { PasswordHash } = result.recordset[0];

    // Nếu tài khoản có mật khẩu local ➔ So sánh mật khẩu cũ
    if (PasswordHash) {
        if (!oldPassword) {
            const err = new Error("Vui lòng cung cấp mật khẩu cũ");
            err.statusCode = 400; throw err;
        }
        const isMatch = await bcryptjs.compare(oldPassword, PasswordHash);
        if (!isMatch) {
            const err = new Error("Mật khẩu hiện tại không đúng");
            err.statusCode = 400; throw err;
        }
    }

    // 2. Cập nhật mật khẩu mới băm bằng Bcrypt và thêm provider 'local' nếu là tài khoản Social tạo mật khẩu lần đầu
    const hashedPassword = await bcryptjs.hash(newPassword, BCRYPT_ROUNDS);
    await pool.request()
        .input("UserID", sql.Int, userId)
        .input("PasswordHash", sql.NVarChar(256), hashedPassword)
        .query(`
            UPDATE Users
            SET PasswordHash = @PasswordHash,
                UpdatedAt = GETDATE()
            WHERE UserID = @UserID;
            
            IF NOT EXISTS (SELECT 1 FROM UserAuthProviders WHERE UserID = @UserID AND ProviderName = 'local')
            BEGIN
                INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID)
                VALUES (@UserID, 'local', CAST(@UserID AS NVARCHAR(200)));
            END
        `);
}