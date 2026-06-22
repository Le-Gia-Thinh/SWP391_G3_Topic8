const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../FE/src/i18n/locales/en.json');
const viPath = path.join(__dirname, '../FE/src/i18n/locales/vi.json');
const dashboardPath = path.join(__dirname, '../FE/src/pages/staff/StaffDashboardScreen.jsx');

// Update en.json
let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!enData.staff) enData.staff = {};
enData.staff.dashboard = {
  summary: {
    title: "Operations Summary",
    refresh: "Refresh"
  },
  stats: {
    occupied: "Occupied Slots",
    available: "Available Slots",
    todayCheckin: "Today's Check-ins",
    todayCheckout: "Today's Check-outs",
    openIncidents: "Open Incidents",
    pendingBookings: "Pending Bookings"
  },
  quickActions: {
    title: "Quick Actions",
    walkinDesc: "Enter plate for walk-in vehicles",
    bookingDesc: "Scan or enter booking code",
    checkoutDesc: "Calculate fee and confirm exit",
    searchDesc: "Search entry/exit history by plate",
    incidentDesc: "Report lost card, damage, etc.",
    mapDesc: "Check detailed parking slot status"
  },
  recentCheckins: {
    title: "Recent Entries",
    desc: "Latest 8 check-in sessions",
    viewAll: "View All",
    empty: "No sessions today",
    headers: {
      sessionId: "Session ID",
      plate: "Plate",
      vehicle: "Vehicle",
      time: "Entry Time",
      slot: "Slot",
      zone: "Zone",
      status: "Status"
    }
  },
  alerts: {
    title: "Alerts & Notifications",
    new: "New",
    empty: "No alerts",
    viewAll: "VIEW ALL"
  },
  quickSearch: {
    title: "Quick Plate Search",
    placeholder: "Enter plate, press Enter...",
    hint: "Press Enter to search"
  },
  revenue: {
    title: "Today's Revenue",
    desc: "Completed payments"
  },
  loading: "Loading...",
  error: "Failed to load dashboard data"
};
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

// Update vi.json
let viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
if (!viData.staff) viData.staff = {};
viData.staff.dashboard = {
  summary: {
    title: "Tóm tắt vận hành",
    refresh: "Làm mới"
  },
  stats: {
    occupied: "Xe trong bãi",
    available: "Chỗ trống",
    todayCheckin: "Check-in hôm nay",
    todayCheckout: "Check-out hôm nay",
    openIncidents: "Sự cố đang mở",
    pendingBookings: "Lượt đặt trước"
  },
  quickActions: {
    title: "Thao tác nhanh",
    walkinDesc: "Nhập biển số cho xe không có đặt trước",
    bookingDesc: "Quét mã hoặc nhập mã đặt chỗ",
    checkoutDesc: "Tính tiền và xác nhận xe ra",
    searchDesc: "Tìm kiếm lịch sử vào/ra theo biển số",
    incidentDesc: "Báo cáo mất thẻ, hỏng thiết bị, va chạm",
    mapDesc: "Kiểm tra chi tiết vị trí các ô đỗ"
  },
  recentCheckins: {
    title: "Lượt vào gần đây",
    desc: "8 phiên nhận xe mới nhất",
    viewAll: "Xem tất cả",
    empty: "Chưa có phiên nào hôm nay",
    headers: {
      sessionId: "ID Phiên",
      plate: "Biển số",
      vehicle: "Loại xe",
      time: "Thời gian vào",
      slot: "Ô đỗ",
      zone: "Khu vực",
      status: "Trạng thái"
    }
  },
  alerts: {
    title: "Thông báo & Cảnh báo",
    new: "Mới",
    empty: "Không có cảnh báo nào",
    viewAll: "XEM TẤT CẢ"
  },
  quickSearch: {
    title: "Tra cứu nhanh biển số",
    placeholder: "Nhập biển số xe, Enter để tìm...",
    hint: "Nhấn Enter để tìm kiếm"
  },
  revenue: {
    title: "Doanh thu hôm nay",
    desc: "Đã thanh toán hoàn tất"
  },
  loading: "Đang tải...",
  error: "Không thể tải dữ liệu dashboard"
};
fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));

// Update StaffDashboardScreen.jsx
let content = fs.readFileSync(dashboardPath, 'utf8');

// Inject useTranslation
if (!content.includes("import { useTranslation }")) {
  content = content.replace(
    "import { useState, useEffect } from 'react'",
    "import { useState, useEffect } from 'react'\nimport { useTranslation } from 'react-i18next'"
  );
}

if (!content.includes("const { t } = useTranslation()")) {
  content = content.replace(
    "export default function StaffDashboardScreen() {",
    "export default function StaffDashboardScreen() {\n  const { t } = useTranslation()"
  );
}

// Replace exact strings safely using split & join to preserve spacing

content = content.replace(
  "toast.error('Không thể tải dữ liệu dashboard')",
  "toast.error(t('staff.dashboard.error') /* TRANSLATED: Không thể tải dữ liệu dashboard */)"
);

content = content.replace(
  "> Tóm tắt vận hành",
  "> {t('staff.dashboard.summary.title')} {/* TRANSLATED: Tóm tắt vận hành */}"
);

content = content.replace(
  "> Làm mới",
  "> {t('staff.dashboard.summary.refresh')} {/* TRANSLATED: Làm mới */}"
);

// Stats section
content = content.replace(
  /title="Xe trong bãi"/g,
  "title={t('staff.dashboard.stats.occupied') /* TRANSLATED: Xe trong bãi */}"
);
content = content.replace(
  /title="Chỗ trống"/g,
  "title={t('staff.dashboard.stats.available') /* TRANSLATED: Chỗ trống */}"
);
content = content.replace(
  /title="Check-in hôm nay"/g,
  "title={t('staff.dashboard.stats.todayCheckin') /* TRANSLATED: Check-in hôm nay */}"
);
content = content.replace(
  /title="Check-out hôm nay"/g,
  "title={t('staff.dashboard.stats.todayCheckout') /* TRANSLATED: Check-out hôm nay */}"
);
content = content.replace(
  /title="Sự cố đang mở"/g,
  "title={t('staff.dashboard.stats.openIncidents') /* TRANSLATED: Sự cố đang mở */}"
);
content = content.replace(
  /title="Lượt đặt trước"/g,
  "title={t('staff.dashboard.stats.pendingBookings') /* TRANSLATED: Lượt đặt trước */}"
);

// Quick Actions Header
content = content.replace(
  "> Thao tác nhanh",
  "> {t('staff.dashboard.quickActions.title')} {/* TRANSLATED: Thao tác nhanh */}"
);

// Quick Actions Cards
content = content.replace(
  /title="Nhận xe vãng lai" desc="Nhập biển số cho xe không có đặt trước"/g,
  "title={t('staff.layout.mainMenu.checkinWalkin')} desc={t('staff.dashboard.quickActions.walkinDesc')} /* TRANSLATED: Nhận xe vãng lai */"
);
content = content.replace(
  /title="Nhận xe đặt trước" desc="Quét mã hoặc nhập mã đặt chỗ"/g,
  "title={t('staff.layout.mainMenu.checkinBooking')} desc={t('staff.dashboard.quickActions.bookingDesc')} /* TRANSLATED: Nhận xe đặt trước */"
);
content = content.replace(
  /title="Thanh toán & Trả xe" desc="Tính tiền và xác nhận xe ra"/g,
  "title={t('staff.layout.mainMenu.checkout')} desc={t('staff.dashboard.quickActions.checkoutDesc')} /* TRANSLATED: Thanh toán & Trả xe */"
);
content = content.replace(
  /title="Tra cứu phiên" desc="Tìm kiếm lịch sử vào\/ra theo biển số"/g,
  "title={t('staff.layout.manageMenu.searchSession')} desc={t('staff.dashboard.quickActions.searchDesc')} /* TRANSLATED: Tra cứu phiên */"
);
content = content.replace(
  /title="Tạo sự cố" desc="Báo cáo mất thẻ, hỏng thiết bị, va chạm"/g,
  "title={t('staff.layout.manageMenu.reportIncident')} desc={t('staff.dashboard.quickActions.incidentDesc')} /* TRANSLATED: Tạo sự cố */"
);
content = content.replace(
  /title="Xem sơ đồ chỗ" desc="Kiểm tra chi tiết vị trí các ô đỗ"/g,
  "title={t('staff.layout.manageMenu.parkingMap')} desc={t('staff.dashboard.quickActions.mapDesc')} /* TRANSLATED: Xem sơ đồ chỗ */"
);

// Recent Check-ins
content = content.replace(
  "Lượt vào gần đây</h3>",
  "{t('staff.dashboard.recentCheckins.title')} {/* TRANSLATED: Lượt vào gần đây */}</h3>"
);
content = content.replace(
  "8 phiên nhận xe mới nhất</p>",
  "{t('staff.dashboard.recentCheckins.desc')} {/* TRANSLATED: 8 phiên nhận xe mới nhất */}</p>"
);
content = content.replace(
  "Xem tất cả\n              </button>",
  "{t('staff.dashboard.recentCheckins.viewAll')} {/* TRANSLATED: Xem tất cả */}\n              </button>"
);
content = content.replace(
  "Đang tải...\n                </div>",
  "{t('staff.dashboard.loading')} {/* TRANSLATED: Đang tải... */}\n                </div>"
);
content = content.replace(
  "Chưa có phiên nào hôm nay</p>",
  "{t('staff.dashboard.recentCheckins.empty')} {/* TRANSLATED: Chưa có phiên nào hôm nay */}</p>"
);

// Table headers
content = content.replace(">ID Phiên</th>", ">{t('staff.dashboard.recentCheckins.headers.sessionId')} {/* TRANSLATED: ID Phiên */}</th>");
content = content.replace(">Biển số</th>", ">{t('staff.dashboard.recentCheckins.headers.plate')} {/* TRANSLATED: Biển số */}</th>");
content = content.replace(">Loại xe</th>", ">{t('staff.dashboard.recentCheckins.headers.vehicle')} {/* TRANSLATED: Loại xe */}</th>");
content = content.replace(">Thời gian vào</th>", ">{t('staff.dashboard.recentCheckins.headers.time')} {/* TRANSLATED: Thời gian vào */}</th>");
content = content.replace(">Ô đỗ</th>", ">{t('staff.dashboard.recentCheckins.headers.slot')} {/* TRANSLATED: Ô đỗ */}</th>");
content = content.replace(">Khu vực</th>", ">{t('staff.dashboard.recentCheckins.headers.zone')} {/* TRANSLATED: Khu vực */}</th>");
content = content.replace(">Trạng thái</th>", ">{t('staff.dashboard.recentCheckins.headers.status')} {/* TRANSLATED: Trạng thái */}</th>");

// Alerts
content = content.replace(
  "Thông báo & Cảnh báo\n              </h3>",
  "{t('staff.dashboard.alerts.title')} {/* TRANSLATED: Thông báo & Cảnh báo */}\n              </h3>"
);
content = content.replace(
  "Mới</span>}",
  "{t('staff.dashboard.alerts.new')} {/* TRANSLATED: Mới */}</span>}"
);
content = content.replace(
  "Không có cảnh báo nào</p>",
  "{t('staff.dashboard.alerts.empty')} {/* TRANSLATED: Không có cảnh báo nào */}</p>"
);
content = content.replace(
  "XEM TẤT CẢ ",
  "{t('staff.dashboard.alerts.viewAll')} {/* TRANSLATED: XEM TẤT CẢ */} "
);

// Quick Search
content = content.replace(
  "> Tra cứu nhanh biển số</h3>",
  "> {t('staff.dashboard.quickSearch.title')} {/* TRANSLATED: Tra cứu nhanh biển số */}</h3>"
);
content = content.replace(
  /placeholder="Nhập biển số xe, Enter để tìm\.\.\."/,
  "placeholder={t('staff.dashboard.quickSearch.placeholder')} /* TRANSLATED: Nhập biển số xe, Enter để tìm... */"
);
content = content.replace(
  "Nhấn Enter để tìm kiếm</p>",
  "{t('staff.dashboard.quickSearch.hint')} {/* TRANSLATED: Nhấn Enter để tìm kiếm */}</p>"
);

// Revenue
content = content.replace(
  "> Doanh thu hôm nay</h3>",
  "> {t('staff.dashboard.revenue.title')} {/* TRANSLATED: Doanh thu hôm nay */}</h3>"
);
content = content.replace(
  "Đã thanh toán hoàn tất</p>",
  "{t('staff.dashboard.revenue.desc')} {/* TRANSLATED: Đã thanh toán hoàn tất */}</p>"
);

fs.writeFileSync(dashboardPath, content);
console.log("StaffDashboardScreen patched!");
