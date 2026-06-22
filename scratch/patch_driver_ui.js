const fs = require('fs');
const path = require('path');

const driverHomePath = path.join(__dirname, '../FE/src/pages/driver/DriverHome.jsx');
let driverHomeContent = fs.readFileSync(driverHomePath, 'utf8');

// Add import useTranslation
if (!driverHomeContent.includes("import { useTranslation } from 'react-i18next'")) {
    driverHomeContent = driverHomeContent.replace(
        "import React, { useEffect, useMemo, useState } from 'react'",
        "import React, { useEffect, useMemo, useState } from 'react'\nimport { useTranslation } from 'react-i18next'"
    );
}

// Add t function inside DriverHome
if (!driverHomeContent.includes("const { t } = useTranslation()")) {
    driverHomeContent = driverHomeContent.replace(
        "const DriverHome = () => {\n  const { user } = useAuth()",
        "const DriverHome = () => {\n  const { t } = useTranslation()\n  const { user } = useAuth()"
    );
}

// Manual regex replacements
driverHomeContent = driverHomeContent
    .replace("'Trang chủ'", "t('driverHome.title')")
    .replace(/Xin chào,\s*\{displayName\}!\s*👋/g, "{t('driverHome.greeting', { name: displayName })}")
    .replace("Chào mừng bạn quay trở lại. Dưới đây là tổng quan tình trạng bãi xe.", "{t('driverHome.welcomeBack')}")
    .replace("'Đang đồng bộ dữ liệu...'", "t('driverHome.syncing')")
    .replace("'Đã có lỗi xảy ra'", "t('driverHome.errorTitle')")
    .replace(">Thử lại<", ">{t('driverHome.retry')}<")
    .replace("'Làm mới'", "t('driverHome.refresh')")
    .replace("'Đang tải...'", "t('driverHome.loading')")
    .replace(/label="Tổng booking"/g, "label={t('driverHome.stats.totalBookings')}")
    .replace(/label="Đang hoạt động"/g, "label={t('driverHome.stats.active')}")
    .replace(/label="Đã hoàn thành"/g, "label={t('driverHome.stats.completed')}")
    .replace(/label="Đã hủy \/ hết hạn"/g, "label={t('driverHome.stats.cancelled')}")
    .replace("Trạng thái Sức chứa (Live)", "{t('driverHome.capacity.title')}")
    .replace(/Cập nhật lúc \{updatedAt\}/g, "{t('driverHome.capacity.updatedAt', { time: updatedAt })}")
    .replace("Chưa có dữ liệu vị trí đỗ được cập nhật.", "{t('driverHome.capacity.empty')}")
    .replace("Tỷ lệ lấp đầy", "{t('driverHome.capacity.fillRate')}")
    .replace(/\/ \{total\} trống/g, "{t('driverHome.capacity.available', { total })}")
    
    .replace(/title="Tiện ích nhanh"/g, "title={t('driverHome.quickActions.title')}")
    .replace(/'Đặt chỗ đỗ xe'/g, "t('driverHome.quickActions.booking.title')")
    .replace(/'Giữ chỗ trước cho chuyến đi'/g, "t('driverHome.quickActions.booking.desc')")
    .replace(/'Phiên gửi xe'/g, "t('driverHome.quickActions.session.title')")
    .replace(/'Thời gian, vị trí, phí gửi'/g, "t('driverHome.quickActions.session.desc')")
    .replace(/'Lịch sử đặt chỗ'/g, "t('driverHome.quickActions.history.title')")
    .replace(/'Xem các booking đã tạo'/g, "t('driverHome.quickActions.history.desc')")
    .replace(/'Báo sự cố'/g, "t('driverHome.quickActions.report.title')")
    .replace(/'Gửi báo cáo vấn đề'/g, "t('driverHome.quickActions.report.desc')")
    .replace(/'Hỗ trợ kỹ thuật'/g, "t('driverHome.quickActions.support.title')")
    .replace(/'Chat với nhân viên'/g, "t('driverHome.quickActions.support.desc')")
    
    .replace(/title="Phiếu Đặt chỗ hiện tại"/g, "title={t('driverHome.workflows.currentBooking')}")
    .replace(/actionText="Xem lịch sử"/g, "actionText={t('driverHome.workflows.viewHistory')}")
    .replace(/title="Phiếu Gửi xe đang hoạt động"/g, "title={t('driverHome.workflows.currentSession')}")
    .replace(/actionText="Chi tiết phiên"/g, "actionText={t('driverHome.workflows.sessionDetail')}")
    
    .replace(/title="Chưa có đặt chỗ"/g, "title={t('driverHome.workflows.noBooking')}")
    .replace(/description="Giữ vị trí đẹp cho chuyến đi sắp tới của bạn ngay hôm nay."/g, "description={t('driverHome.workflows.noBookingDesc')}")
    .replace(/actionText="Tạo đặt chỗ"/g, "actionText={t('driverHome.workflows.createBooking')}")
    
    .replace(/title="Chưa có phiên gửi xe"/g, "title={t('driverHome.workflows.noSession')}")
    .replace(/description="Phiên gửi xe sẽ tự động xuất hiện khi bạn check-in vào bãi đỗ."/g, "description={t('driverHome.workflows.noSessionDesc')}")
    
    .replace(/Mã đặt chỗ/g, "{t('driverHome.workflows.bookingCode')}")
    .replace(/label="Bắt đầu"/g, "label={t('driverHome.workflows.start')}")
    .replace(/label="Kết thúc"/g, "label={t('driverHome.workflows.end')}")
    .replace(/label="Loại xe"/g, "label={t('driverHome.workflows.vehicleType')}")
    .replace(/label="Vị trí chỉ định"/g, "label={t('driverHome.workflows.location')}")
    .replace(/Xem mã QR/g, "{t('driverHome.workflows.viewQr')}")
    
    .replace(/Biển số đang gửi/g, "{t('driverHome.workflows.plate')}")
    .replace(/Loại phiên/g, "{t('driverHome.workflows.sessionType')}")
    .replace(/'Đặt trước'/g, "t('driverHome.workflows.prebooked')")
    .replace(/'Vãng lai'/g, "t('driverHome.workflows.walkIn')")
    .replace(/label="Mã phiên"/g, "label={t('driverHome.workflows.sessionCode')}")
    .replace(/label="Liên kết đặt chỗ"/g, "label={t('driverHome.workflows.bookingLink')}")
    .replace(/'Không'/g, "t('driverHome.workflows.none')")
    .replace(/label="Giờ vào"/g, "label={t('driverHome.workflows.entryTime')}")
    .replace(/label="Vị trí hiện tại"/g, "label={t('driverHome.workflows.currentLocation')}")
    
    .replace(/Tạm tính/g, "{t('driverHome.workflows.estimatedFee')}")
    .replace(/Chưa thanh toán/g, "{t('driverHome.workflows.unpaid')}")
    .replace(/Sự cố\?/g, "{t('driverHome.workflows.issue')}")
    .replace(/Thanh toán ngay/g, "{t('driverHome.workflows.payNow')}");

fs.writeFileSync(driverHomePath, driverHomeContent);
console.log("DriverHome.jsx updated");

const sidebarPath = path.join(__dirname, '../FE/src/components/layout/Sidebar.jsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarContent.includes("import { useTranslation } from 'react-i18next'")) {
    sidebarContent = sidebarContent.replace(
        "import React from 'react'",
        "import React from 'react'\nimport { useTranslation } from 'react-i18next'"
    );
}

if (!sidebarContent.includes("const { t } = useTranslation()")) {
    sidebarContent = sidebarContent.replace(
        "const Sidebar = ({ isOpen, toggleSidebar }) => {",
        "const Sidebar = ({ isOpen, toggleSidebar }) => {\n  const { t } = useTranslation()"
    );
}

sidebarContent = sidebarContent
    .replace(/'Trang chủ'/g, "t('sidebar.home')")
    .replace(/'Phiên đỗ xe'/g, "t('sidebar.sessions')")
    .replace(/'Lịch sử'/g, "t('sidebar.history')")
    .replace(/'Thanh toán'/g, "t('sidebar.payment')")
    .replace(/'Phương tiện'/g, "t('sidebar.vehicles')")
    .replace(/'Thông báo'/g, "t('sidebar.notifications')")
    .replace(/'Báo cáo sự cố'/g, "t('sidebar.report')")
    .replace(/'Hỗ trợ'/g, "t('sidebar.support')")
    .replace(/'Đăng xuất'/g, "t('sidebar.logout')")

fs.writeFileSync(sidebarPath, sidebarContent);
console.log("Sidebar.jsx updated");
