// src/providers/JwtProvider.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import ms from "ms";

const JwtProvider = {

    // ── Access token: ngắn hạn (15m) ─────────────────────────────
    generateAccessToken(payload) {
        return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
        });
    },

    // ── Refresh token: dài hạn (7d) ───────────────────────────────
    generateRefreshToken(payload) {
        return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
        });
    },

    // ── Verify ────────────────────────────────────────────────────
    verifyAccessToken(token) {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    },

    verifyRefreshToken(token) {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    },

    // ── Hash token trước khi lưu DB ──────────────────────────────
    hashToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    },

    // ── Convert "7d", "15m" → milliseconds (dùng cho maxAge cookie) ──
    // ms("15m") → 900000
    // ms("7d")  → 604800000
    toMs(timeString) {
        return ms(timeString);
    },
};

export default JwtProvider;