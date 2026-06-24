const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../FE/src/i18n/locales/en.json');
const viPath = path.join(__dirname, '../FE/src/i18n/locales/vi.json');
const layoutPath = path.join(__dirname, '../FE/src/pages/staff/StaffLayout.jsx');

// Update en.json
let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!enData.staff) enData.staff = {};
enData.staff.layout = {
  mainMenu: {
    dashboard: "Dashboard",
    checkinWalkin: "Walk-in Check-in",
    checkinBooking: "Booking Check-in",
    checkout: "Checkout & Payment"
  },
  manageMenu: {
    reportIncident: "Report Incident",
    parkingMap: "Parking Map",
    searchSession: "Search Session"
  },
  defaultRole: "Staff",
  main: "Main",
  management: "Management",
  logout: "Logout",
  systemOnline: "System: Online",
  syncStable: "Sync Stable",
  help: "Help"
};
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

// Update vi.json
let viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
if (!viData.staff) viData.staff = {};
viData.staff.layout = {
  mainMenu: {
    dashboard: "Bảng điều khiển",
    checkinWalkin: "Nhận xe vãng lai",
    checkinBooking: "Nhận xe đặt trước",
    checkout: "Thanh toán & Trả xe"
  },
  manageMenu: {
    reportIncident: "Báo cáo sự cố",
    parkingMap: "Xem sơ đồ chỗ",
    searchSession: "Tra cứu phiên"
  },
  defaultRole: "Nhân viên",
  main: "Chính",
  management: "Quản lý",
  logout: "Đăng xuất",
  systemOnline: "Hệ thống: Trực tuyến",
  syncStable: "Đồng bộ ổn định",
  help: "Trợ giúp"
};
fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));

// Update StaffLayout.jsx
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Inject useTranslation
if (!layoutContent.includes("import { useTranslation }")) {
  layoutContent = layoutContent.replace(
    "import { useState } from 'react'",
    "import { useState } from 'react'\nimport { useTranslation } from 'react-i18next'"
  );
}

if (!layoutContent.includes("const { t } = useTranslation()")) {
  layoutContent = layoutContent.replace(
    "const StaffLayout = () => {",
    "const StaffLayout = () => {\n  const { t } = useTranslation()\n"
  );
}

// Translate arrays
layoutContent = layoutContent.replace(
  "{ name: 'Bảng điều khiển', path: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },",
  "{ name: t('staff.layout.mainMenu.dashboard') /* TRANSLATED: Bảng điều khiển */, path: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },"
).replace(
  "{ name: 'Nhận xe vãng lai', path: '/staff/checkin-walkin', icon: <CarFront size={20} /> },",
  "{ name: t('staff.layout.mainMenu.checkinWalkin') /* TRANSLATED: Nhận xe vãng lai */, path: '/staff/checkin-walkin', icon: <CarFront size={20} /> },"
).replace(
  "{ name: 'Nhận xe đặt trước', path: '/staff/checkin-booking', icon: <CalendarCheck size={20} /> },",
  "{ name: t('staff.layout.mainMenu.checkinBooking') /* TRANSLATED: Nhận xe đặt trước */, path: '/staff/checkin-booking', icon: <CalendarCheck size={20} /> },"
).replace(
  "{ name: 'Thanh toán & Trả xe', path: '/staff/checkout', icon: <LogOut size={20} /> }",
  "{ name: t('staff.layout.mainMenu.checkout') /* TRANSLATED: Thanh toán & Trả xe */, path: '/staff/checkout', icon: <LogOut size={20} /> }"
);

layoutContent = layoutContent.replace(
  "{ name: 'Báo cáo sự cố', path: '/staff/create-incident', icon: <AlertCircle size={20} /> },",
  "{ name: t('staff.layout.manageMenu.reportIncident') /* TRANSLATED: Báo cáo sự cố */, path: '/staff/create-incident', icon: <AlertCircle size={20} /> },"
).replace(
  "{ name: 'Xem sơ đồ chỗ', path: '/staff/parking-map', icon: <Map size={20} /> },",
  "{ name: t('staff.layout.manageMenu.parkingMap') /* TRANSLATED: Xem sơ đồ chỗ */, path: '/staff/parking-map', icon: <Map size={20} /> },"
).replace(
  "{ name: 'Tra cứu phiên', path: '/staff/search-session', icon: <Search size={20} /> }",
  "{ name: t('staff.layout.manageMenu.searchSession') /* TRANSLATED: Tra cứu phiên */, path: '/staff/search-session', icon: <Search size={20} /> }"
);

// Other strings
layoutContent = layoutContent.replace(
  "user?.role?.roleName || 'Nhân viên'",
  "user?.role?.roleName || t('staff.layout.defaultRole') /* TRANSLATED: Nhân viên */"
);

layoutContent = layoutContent.replace(
  ">Chính<",
  ">{t('staff.layout.main')} {/* TRANSLATED: Chính */}<"
);

layoutContent = layoutContent.replace(
  ">Quản lý<",
  ">{t('staff.layout.management')} {/* TRANSLATED: Quản lý */}<"
);

layoutContent = layoutContent.replace(
  "> Đăng xuất<",
  "> {t('staff.layout.logout')} {/* TRANSLATED: Đăng xuất */}<"
);

layoutContent = layoutContent.replace(
  "Hệ thống: Trực tuyến",
  "{t('staff.layout.systemOnline')} {/* TRANSLATED: Hệ thống: Trực tuyến */}"
);

layoutContent = layoutContent.replace(
  "Đồng bộ ổn định",
  "{t('staff.layout.syncStable')} {/* TRANSLATED: Đồng bộ ổn định */}"
);

layoutContent = layoutContent.replace(
  "> Trợ giúp<",
  "> {t('staff.layout.help')} {/* TRANSLATED: Trợ giúp */}<"
);

fs.writeFileSync(layoutPath, layoutContent);
console.log("StaffLayout.jsx and translations updated successfully.");
