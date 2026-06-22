const fs = require('fs');
const path = require('path');

const driverHomePath = path.join(__dirname, '../FE/src/pages/driver/DriverHome.jsx');
let content = fs.readFileSync(driverHomePath, 'utf8');

if (!content.includes("import { useTranslation }")) {
    content = content.replace("import React, { useEffect, useMemo, useState } from 'react'", "import React, { useEffect, useMemo, useState } from 'react'\nimport { useTranslation } from 'react-i18next'");
}

// Subcomponents that need `t`
const subComponents = ['SectionHeader', 'VehicleStatusCard', 'QuickActionCard', 'InfoRow', 'BookingCard', 'ActiveSessionCard', 'EmptyCard', 'DriverHome', 'SummaryMiniCard'];

subComponents.forEach(comp => {
  const regex = new RegExp(`const ${comp} = \\(([^)]*)\\) => \\{\\n`);
  if (regex.test(content)) {
    if (!content.includes(`const ${comp} = ($1) => {\n  const { t } = useTranslation()`)) {
        content = content.replace(regex, `const ${comp} = ($1) => {\n  const { t } = useTranslation()\n`);
    }
  }
});

// QUICK_ACTIONS - convert strings to translation keys inline when rendering?
// No, it's easier to modify QUICK_ACTIONS strings directly if we move QUICK_ACTIONS inside DriverHome
// Let's just use string replace to inject QUICK_ACTIONS inside DriverHome

content = content.replace(/const QUICK_ACTIONS = \[\s*\{[\s\S]*?\]/m, "");

content = content.replace("const DriverHome = () => {\n  const { t } = useTranslation()\n  const { user } = useAuth()", `const DriverHome = () => {
  const { t } = useTranslation()
  const { user } = useAuth()

  const QUICK_ACTIONS = useMemo(() => [
    {
      title: t('driverHome.quickActions.booking.title'),
      description: t('driverHome.quickActions.booking.desc'),
      to: '/driver/booking',
      Icon: CalendarDays,
      variant: 'primary'
    },
    {
      title: t('driverHome.quickActions.session.title'),
      description: t('driverHome.quickActions.session.desc'),
      to: '/driver/session',
      Icon: Clock,
      iconClass: 'text-blue-500',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: t('driverHome.quickActions.history.title'),
      description: t('driverHome.quickActions.history.desc'),
      to: '/driver/history',
      Icon: FileText,
      iconClass: 'text-indigo-500',
      bgClass: 'bg-indigo-50'
    },
    {
      title: t('driverHome.quickActions.report.title'),
      description: t('driverHome.quickActions.report.desc'),
      to: '/driver/report',
      Icon: AlertCircle,
      iconClass: 'text-rose-500',
      bgClass: 'bg-rose-50'
    },
    {
      title: t('driverHome.quickActions.support.title'),
      description: t('driverHome.quickActions.support.desc'),
      to: '/driver/support',
      Icon: MessageSquare,
      iconClass: 'text-emerald-500',
      bgClass: 'bg-emerald-50'
    }
  ], [t]);
`);

// Now replace all the other text inside the components
content = content
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

fs.writeFileSync(driverHomePath, content);
console.log("Fixed DriverHome.jsx");
