const fs = require('fs');
const path = require('path');

const enPath = path.resolve(__dirname, '../FE/src/i18n/locales/en.json');
const viPath = path.resolve(__dirname, '../FE/src/i18n/locales/vi.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));

const enStaffAdditions = {
  "searchSession": {
    "title": "Search",
    "status": {
      "active": "Parked",
      "completed": "Completed",
      "reserved": "Reserved",
      "incident": "Incident"
    },
    "type": {
      "booking": "Booking",
      "walkin": "Walk-in"
    },
    "searchPlaceholder": "Plate, session code, booking code, driver...",
    "filters": {
      "allStatus": "All statuses",
      "allType": "All types",
      "allVehicle": "All vehicles",
      "allGate": "All slots",
      "clear": "Clear filters"
    },
    "loading": "Loading data...",
    "noSession": "No session found",
    "noSessionHint": "Try changing keyword or filter",
    "card": {
      "slot": "Slot",
      "driver": "Driver",
      "entryTime": "Entry time",
      "exitTime": "Exit time",
      "notEntered": "Not entered"
    },
    "detail": {
      "placeholderTitle": "View session details",
      "placeholderDesc": "Click a session on the left to view details.",
      "header": "Session details",
      "sessionCode": "Session code",
      "bookingCode": "Booking code",
      "type": "Type",
      "slot": "Parking slot",
      "in": "In",
      "out": "Out",
      "phone": "Phone"
    }
  }
};

const viStaffAdditions = {
  "searchSession": {
    "title": "Tra cứu",
    "status": {
      "active": "Đang đỗ",
      "completed": "Đã hoàn thành",
      "reserved": "Đã đặt",
      "incident": "Sự cố"
    },
    "type": {
      "booking": "Booking",
      "walkin": "Vãng lai"
    },
    "searchPlaceholder": "Biển số, mã phiên, mã booking, tài xế...",
    "filters": {
      "allStatus": "Tất cả trạng thái",
      "allType": "Tất cả loại",
      "allVehicle": "Tất cả xe",
      "allGate": "Tất cả slot",
      "clear": "Xóa bộ lọc"
    },
    "loading": "Đang tải dữ liệu...",
    "noSession": "Không tìm thấy phiên nào",
    "noSessionHint": "Thử thay đổi từ khóa hoặc bộ lọc",
    "card": {
      "slot": "Vị trí (Slot)",
      "driver": "Tài xế",
      "entryTime": "Thời gian vào",
      "exitTime": "Thời gian ra",
      "notEntered": "Chưa vào"
    },
    "detail": {
      "placeholderTitle": "Xem chi tiết phiên",
      "placeholderDesc": "Hãy click chọn một phiên gửi xe ở danh sách bên trái để xem thông tin chi tiết.",
      "header": "Chi tiết phiên gửi xe",
      "sessionCode": "Mã phiên",
      "bookingCode": "Mã booking",
      "type": "Loại",
      "slot": "Vị trí đỗ",
      "in": "Vào",
      "out": "Ra",
      "phone": "SĐT"
    }
  }
};

enData.staff = { ...enData.staff, searchSession: enStaffAdditions.searchSession };
viData.staff = { ...viData.staff, searchSession: viStaffAdditions.searchSession };

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
console.log('Translations updated for staff search session.');
