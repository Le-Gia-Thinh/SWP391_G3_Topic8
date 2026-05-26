// src/utilities/authValidation.js
// Chạy TRƯỚC controller, validate input sớm nhất có thể

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, res, next) {
    const { fullName, email, password } = req.body;
    const errors = [];

    if (!fullName?.trim()) errors.push("fullName không được để trống");
    if (!email?.trim() || !emailRegex.test(email)) errors.push("email không hợp lệ");
    if (!password || password.length < 6) errors.push("password phải có ít nhất 6 ký tự");

    if (errors.length > 0)
        return res.status(400).json({ success: false, message: errors.join(", ") });
    next();
}

export function validateLogin(req, res, next) {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim())
        return res.status(400).json({ success: false, message: "email và password là bắt buộc" });
    next();
}

export function validateForgotPassword(req, res, next) {
    const { email } = req.body;
    if (!email?.trim() || !emailRegex.test(email))
        return res.status(400).json({ success: false, message: "email không hợp lệ" });
    next();
}

export function validateResetPassword(req, res, next) {
    const { token, newPassword } = req.body;
    const errors = [];
    if (!token?.trim()) errors.push("token là bắt buộc");
    if (!newPassword || newPassword.length < 6) errors.push("newPassword phải có ít nhất 6 ký tự");
    if (errors.length > 0)
        return res.status(400).json({ success: false, message: errors.join(", ") });
    next();
}

export function validateSocialLogin(req, res, next) {
    // Google gửi idToken, Facebook gửi accessToken
    const { idToken, accessToken } = req.body;
    if (!idToken && !accessToken)
        return res.status(400).json({ success: false, message: "Token mạng xã hội là bắt buộc" });
    next();
}