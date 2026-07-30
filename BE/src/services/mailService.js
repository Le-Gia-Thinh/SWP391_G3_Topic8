/**
 * FILE: mailService.js
 * MÔ TẢ: Service gửi Email tự động qua giao thức SMTP (dùng thư viện `nodemailer`).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Khởi tạo kết nối SMTP Transporter với các thông số từ file môi trường `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
 * 2. CƠ CHẾ ĐIỀU HƯỚNG EMAIL THỬ NGHIỆM (Test Email Redirecting): Tự động phát hiện các email hệ thống giả lập (`@email.com`, `@parking.com`, `@example.com`) để chuyển hướng người nhận thực tế về địa chỉ email test (`SMTP_TEST_RECEIVER`), tránh gửi thư rác ra bên ngoài trong quá trình phát triển dự án.
 * 3. Sinh mẫu Email HTML responsive đẹp mắt gửi thông báo xác nhận Đặt chỗ thành công (`sendBookingConfirmation`).
 * 
 * @module mailService
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// KHỞI TẠO SMTP TRANSPORTER (Kết nối đến máy chủ Mail như Gmail SMTP Server):
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com", // Địa chỉ SMTP Server
    port: parseInt(process.env.SMTP_PORT || "587"),   // Cổng kết nối SMTP (587 cho STARTTLS)
    secure: false,                                    // false nếu dùng cổng 587 (TLS/STARTTLS)
    auth: {
        user: process.env.SMTP_USER,                  // Tài khoản email gửi đi
        pass: process.env.SMTP_PASS,                  // Mật khẩu ứng dụng (App Password)
    },
});

/**
 * HÀM 1: sendMail
 * TÁC DỤNG: Hàm gửi email tổng quát (Core Email Sender).
 * 
 * @param {Object} options - Đối tượng tùy chọn gửi email
 * @param {string} options.to - Địa chỉ email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.html - Nội dung định dạng HTML của email
 * @returns {Promise<Object>} Kết quả phản hồi từ máy chủ SMTP
 */
export async function sendMail({ to, subject, html }) {
    let recipient = to;
    const emailLower = String(to || "").toLowerCase().trim();
    
    // Kiểm tra xem email người nhận có phải email ảo dùng trong môi trường Test không
    const isFakeSystemEmail = 
        emailLower.endsWith("@email.com") || 
        emailLower.endsWith("@parking.com") || 
        emailLower.endsWith("@example.com");

    // Nếu là email test ➔ Chuyển hướng đến SMTP_TEST_RECEIVER cài sẵn
    if (isFakeSystemEmail && process.env.SMTP_TEST_RECEIVER) {
        console.log(`[Mail Redirect] Redirecting email from ${to} to test receiver: ${process.env.SMTP_TEST_RECEIVER}`);
        recipient = process.env.SMTP_TEST_RECEIVER;
    } else {
        console.log(`[Mail Direct] Sending email directly to: ${to}`);
    }

    // Tiến hành gửi email thông qua Nodemailer Transporter
    return transporter.sendMail({
        from: `"Smart Parking System" <${process.env.SMTP_USER}>`, // Tên hiển thị người gửi
        to: recipient,
        subject,
        html
    });
}

/**
 * HÀM 2: sendBookingConfirmation
 * TÁC DỤNG: Gửi Email HTML đẹp mắt xác nhận Đặt chỗ xe thành công đến Hòm thư của Tài xế.
 * 
 * @param {string} email - Địa chỉ email tài xế
 * @param {string} fullName - Họ và tên tài xế
 * @param {Object} booking - Đối tượng chi tiết đơn Đặt chỗ
 */
export async function sendBookingConfirmation(email, fullName, booking) {
    // Nếu không có địa chỉ email ➔ Bỏ qua không gửi
    if (!email) return;

    try {
        await sendMail({
            to: email,
            subject: `Xác nhận đặt chỗ thành công - Mã đặt chỗ: ${booking.BookingCode}`,
            // MẪU EMAIL ĐỊNH DẠNG HTML VỚI INLINE STYLES (Dành cho hiển thị mượt mà trên Mobile & Desktop Mail Client):
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
                        <h2 style="color: #1e3a8a; margin: 0;">XÁC NHẬN ĐẶT CHỖ THÀNH CÔNG</h2>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #374151;">Xin chào <strong>${fullName}</strong>,</p>
                    <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Chúng tôi xin xác nhận yêu cầu đặt chỗ của bạn đã được hệ thống phê duyệt thành công. Chi tiết đặt chỗ như sau:</p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 8px 0; font-weight: bold; width: 40%;">Mã đặt chỗ:</td>
                                <td style="padding: 8px 0; color: #2563eb; font-weight: bold;">${booking.BookingCode}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 8px 0; font-weight: bold;">Biển số xe:</td>
                                <td style="padding: 8px 0;">${booking.PlateNumber || 'Không xác định'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 8px 0; font-weight: bold;">Tòa nhà:</td>
                                <td style="padding: 8px 0;">${booking.BuildingName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 8px 0; font-weight: bold;">Vị trí đỗ:</td>
                                <td style="padding: 8px 0; font-weight: bold; color: #10b981;">Tầng ${booking.FloorName} / Khu ${booking.ZoneName} / Ô ${booking.SlotCode}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 8px 0; font-weight: bold;">Ngày đặt:</td>
                                <td style="padding: 8px 0;">${booking.StartDateText}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 8px 0; font-weight: bold;">Giờ bắt đầu:</td>
                                <td style="padding: 8px 0;">${booking.StartClockText}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold;">Giờ kết thúc:</td>
                                <td style="padding: 8px 0;">${booking.EndClockText}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="border-left: 4px solid #f59e0b; background-color: #fffbeb; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.4;">
                            * <strong>Lưu ý quan trọng:</strong> Quý khách vui lòng đến check-in trong khoảng thời gian từ trước 60 phút hoặc trễ không quá 60 phút so với giờ bắt đầu. Nếu đến muộn hơn 60 phút, đặt chỗ sẽ tự động bị hủy (No-show).
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 15px;">Đây là email tự động từ hệ thống Smart Parking. Vui lòng không phản hồi email này.</p>
                </div>
            `
        });
        console.log(`[Mail] Sent booking confirmation email to ${email} for Booking ${booking.BookingCode}`);
    } catch (error) {
        // Bắt lỗi nếu gửi Mail không thành công (VD: Sai tài khoản, mất mạng) ➔ Ghi log để không làm crash luồng đăng ký của hệ thống
        console.error(`[Mail] Failed to send booking confirmation email to ${email}:`, error.message);
    }
}

