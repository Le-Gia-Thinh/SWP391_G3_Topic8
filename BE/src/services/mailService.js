import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendMail({ to, subject, html }) {
    let recipient = to;
    const emailLower = String(to || "").toLowerCase().trim();
    const isFakeSystemEmail = 
        emailLower.endsWith("@email.com") || 
        emailLower.endsWith("@parking.com") || 
        emailLower.endsWith("@example.com");

    if (isFakeSystemEmail && process.env.SMTP_TEST_RECEIVER) {
        console.log(`[Mail Redirect] Redirecting email from ${to} to test receiver: ${process.env.SMTP_TEST_RECEIVER}`);
        recipient = process.env.SMTP_TEST_RECEIVER;
    } else {
        console.log(`[Mail Direct] Sending email directly to: ${to}`);
    }

    return transporter.sendMail({
        from: `"Smart Parking" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject,
        html
    });
}

export async function sendBookingConfirmation(email, fullName, booking) {
    if (!email) return;

    try {
        await sendMail({
            to: email,
            subject: `Xác nhận đặt chỗ thành công - Mã đặt chỗ: ${booking.BookingCode}`,
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
        console.error(`[Mail] Failed to send booking confirmation email to ${email}:`, error.message);
    }
}
