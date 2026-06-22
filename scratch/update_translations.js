const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../FE/src/i18n/locales/en.json');
const viPath = path.join(__dirname, '../FE/src/i18n/locales/vi.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));

// New driver home translations
const newEn = {
    "title": "Home",
    "greeting": "Hello, {{name}}! 👋",
    "welcomeBack": "Welcome back. Here is the parking overview.",
    "refresh": "Refresh",
    "loading": "Loading...",
    "syncing": "Syncing data...",
    "errorTitle": "An error occurred",
    "retry": "Try again",
    "stats": {
        "totalBookings": "Total Bookings",
        "active": "Active",
        "completed": "Completed",
        "cancelled": "Cancelled / Expired"
    },
    "capacity": {
        "title": "Capacity Status (Live)",
        "updatedAt": "Updated at {{time}}",
        "empty": "No slot capacity data available.",
        "fillRate": "Fill rate",
        "available": "/ {{total}} empty"
    },
    "quickActions": {
        "title": "Quick Actions",
        "booking": { "title": "Reserve slot", "desc": "Pre-book for your trip" },
        "session": { "title": "Parking sessions", "desc": "Time, location, fees" },
        "history": { "title": "Booking history", "desc": "View past bookings" },
        "report": { "title": "Report issue", "desc": "Send problem reports" },
        "support": { "title": "Technical support", "desc": "Chat with staff" }
    },
    "workflows": {
        "currentBooking": "Current Booking",
        "viewHistory": "View history",
        "currentSession": "Active Parking Session",
        "sessionDetail": "Session detail",
        "noBooking": "No active booking",
        "noBookingDesc": "Reserve a great spot for your next trip today.",
        "createBooking": "Create booking",
        "noSession": "No active session",
        "noSessionDesc": "A parking session will automatically appear when you check-in.",
        "bookingCode": "Booking Code",
        "start": "Start",
        "end": "End",
        "vehicleType": "Vehicle Type",
        "location": "Location",
        "viewQr": "View QR Code",
        "plate": "Active Plate",
        "sessionType": "Type",
        "prebooked": "Pre-booked",
        "walkIn": "Walk-in",
        "sessionCode": "Session Code",
        "bookingLink": "Booking Link",
        "none": "None",
        "entryTime": "Entry Time",
        "currentLocation": "Current Location",
        "estimatedFee": "Estimated Fee",
        "unpaid": "Unpaid",
        "issue": "Issue?",
        "payNow": "Pay Now"
    }
};

const newVi = {
    "title": "Trang chủ",
    "greeting": "Xin chào, {{name}}! 👋",
    "welcomeBack": "Chào mừng bạn quay trở lại. Dưới đây là tổng quan tình trạng bãi xe.",
    "refresh": "Làm mới",
    "loading": "Đang tải...",
    "syncing": "Đang đồng bộ dữ liệu...",
    "errorTitle": "Đã có lỗi xảy ra",
    "retry": "Thử lại",
    "stats": {
        "totalBookings": "Tổng booking",
        "active": "Đang hoạt động",
        "completed": "Đã hoàn thành",
        "cancelled": "Đã hủy / hết hạn"
    },
    "capacity": {
        "title": "Trạng thái Sức chứa (Live)",
        "updatedAt": "Cập nhật lúc {{time}}",
        "empty": "Chưa có dữ liệu vị trí đỗ được cập nhật.",
        "fillRate": "Tỷ lệ lấp đầy",
        "available": "/ {{total}} trống"
    },
    "quickActions": {
        "title": "Tiện ích nhanh",
        "booking": { "title": "Đặt chỗ đỗ xe", "desc": "Giữ chỗ trước cho chuyến đi" },
        "session": { "title": "Phiên gửi xe", "desc": "Thời gian, vị trí, phí gửi" },
        "history": { "title": "Lịch sử đặt chỗ", "desc": "Xem các booking đã tạo" },
        "report": { "title": "Báo sự cố", "desc": "Gửi báo cáo vấn đề" },
        "support": { "title": "Hỗ trợ kỹ thuật", "desc": "Chat với nhân viên" }
    },
    "workflows": {
        "currentBooking": "Phiếu Đặt chỗ hiện tại",
        "viewHistory": "Xem lịch sử",
        "currentSession": "Phiếu Gửi xe đang hoạt động",
        "sessionDetail": "Chi tiết phiên",
        "noBooking": "Chưa có đặt chỗ",
        "noBookingDesc": "Giữ vị trí đẹp cho chuyến đi sắp tới của bạn ngay hôm nay.",
        "createBooking": "Tạo đặt chỗ",
        "noSession": "Chưa có phiên gửi xe",
        "noSessionDesc": "Phiên gửi xe sẽ tự động xuất hiện khi bạn check-in vào bãi đỗ.",
        "bookingCode": "Mã đặt chỗ",
        "start": "Bắt đầu",
        "end": "Kết thúc",
        "vehicleType": "Loại xe",
        "location": "Vị trí chỉ định",
        "viewQr": "Xem mã QR",
        "plate": "Biển số đang gửi",
        "sessionType": "Loại phiên",
        "prebooked": "Đặt trước",
        "walkIn": "Vãng lai",
        "sessionCode": "Mã phiên",
        "bookingLink": "Liên kết đặt chỗ",
        "none": "Không",
        "entryTime": "Giờ vào",
        "currentLocation": "Vị trí hiện tại",
        "estimatedFee": "Tạm tính",
        "unpaid": "Chưa thanh toán",
        "issue": "Sự cố?",
        "payNow": "Thanh toán ngay"
    }
};

enData.driverHome = newEn;
viData.driverHome = newVi;

// also add sidebar translations
enData.sidebar = {
    "home": "Home",
    "sessions": "Parking Sessions",
    "history": "History",
    "payment": "Payments",
    "vehicles": "My Vehicles",
    "notifications": "Notifications",
    "report": "Report Issue",
    "support": "Help & Support",
    "logout": "Logout"
};
viData.sidebar = {
    "home": "Trang chủ",
    "sessions": "Phiên đỗ xe",
    "history": "Lịch sử",
    "payment": "Thanh toán",
    "vehicles": "Phương tiện",
    "notifications": "Thông báo",
    "report": "Báo cáo sự cố",
    "support": "Hỗ trợ",
    "logout": "Đăng xuất"
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));
fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));

console.log("Translation files updated successfully.");
