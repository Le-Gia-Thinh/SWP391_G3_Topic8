/**
 * FILE: JwtProvider.js
 * MÔ TẢ: Provider (module cung cấp dịch vụ) quản lý JSON Web Token (JWT).
 * 
 * Cung cấp các chức năng:
 * - Tạo Access Token (ngắn hạn, 15 phút) và Refresh Token (dài hạn, 7 ngày)
 * - Xác minh (verify) tính hợp lệ của token
 * - Hash token trước khi lưu vào DB (bảo mật)
 * - Chuyển đổi chuỗi thời gian ("7d", "15m") sang milliseconds
 * 
 * Thuật toán mã hóa: HS256 (HMAC-SHA256)
 * Secret key: lấy từ biến môi trường (.env)
 */

import jwt from "jsonwebtoken";   // Thư viện tạo và xác minh JWT
import crypto from "crypto";     // Module crypto của Node.js để hash token
import ms from "ms";             // Thư viện chuyển đổi chuỗi thời gian sang milliseconds

const JwtProvider = {

    /**
     * Tạo Access Token (token truy cập ngắn hạn).
     * Dùng để xác thực request từ client. Hết hạn nhanh (mặc định 15 phút).
     * @param {Object} payload - Dữ liệu cần đính kèm trong token (userId, email, roleId, roleName)
     * @returns {string} JWT access token
     */
    generateAccessToken(payload) {
        return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
        });
    },

    /**
     * Tạo Refresh Token (token làm mới dài hạn).
     * Dùng để cấp lại Access Token khi nó hết hạn, không cần đăng nhập lại.
     * Hết hạn sau thời gian dài hơn (mặc định 7 ngày).
     * @param {Object} payload - Dữ liệu đính kèm (thường chỉ chứa userId)
     * @returns {string} JWT refresh token
     */
    generateRefreshToken(payload) {
        return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
        });
    },

    /**
     * Xác minh và giải mã Access Token.
     * Nếu token hợp lệ, trả về payload (dữ liệu bên trong token).
     * Nếu không hợp lệ hoặc hết hạn, ném lỗi (TokenExpiredError hoặc JsonWebTokenError).
     * @param {string} token - JWT access token cần xác minh
     * @returns {Object} Payload đã giải mã
     */
    verifyAccessToken(token) {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    },

    /**
     * Xác minh và giải mã Refresh Token.
     * @param {string} token - JWT refresh token cần xác minh
     * @returns {Object} Payload đã giải mã
     */
    verifyRefreshToken(token) {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    },

    /**
     * Hash token bằng SHA-256 trước khi lưu vào database.
     * Mục đích: Không lưu token thô trong DB để tránh rò rỉ nếu DB bị tấn công.
     * @param {string} token - Token gốc cần hash
     * @returns {string} Chuỗi hash hex của token
     */
    hashToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    },

    /**
     * Chuyển đổi chuỗi thời gian sang milliseconds.
     * Dùng để tính maxAge cho cookie.
     * @param {string} timeString - Chuỗi thời gian (VD: "15m" → 900000, "7d" → 604800000)
     * @returns {number} Số milliseconds tương ứng
     * @throws {Error} Nếu chuỗi thời gian không hợp lệ
     */
    toMs(timeString) {
        const value = ms(timeString);

        if (!value) {
            throw new Error(`Invalid time format: ${timeString}`);
        }

        return value;
    }
};

export default JwtProvider;