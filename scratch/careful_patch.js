const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../FE/src/pages/driver/DriverHome.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import { useTranslation }")) {
  content = content.replace(
    "import React, { useEffect, useMemo, useState } from 'react'",
    "import React, { useEffect, useMemo, useState } from 'react'\nimport { useTranslation } from 'react-i18next'"
  );
}

// 2. QUICK_ACTIONS
content = content.replace(
  "title: 'Đặt chỗ đỗ xe',",
  "titleKey: 'driverHome.quickActions.booking.title',"
).replace(
  "description: 'Giữ chỗ trước cho chuyến đi',",
  "descriptionKey: 'driverHome.quickActions.booking.desc',"
).replace(
  "title: 'Phiên gửi xe',",
  "titleKey: 'driverHome.quickActions.session.title',"
).replace(
  "description: 'Thời gian, vị trí, phí gửi',",
  "descriptionKey: 'driverHome.quickActions.session.desc',"
).replace(
  "title: 'Lịch sử đặt chỗ',",
  "titleKey: 'driverHome.quickActions.history.title',"
).replace(
  "description: 'Xem các booking đã tạo',",
  "descriptionKey: 'driverHome.quickActions.history.desc',"
).replace(
  "title: 'Báo sự cố',",
  "titleKey: 'driverHome.quickActions.report.title',"
).replace(
  "description: 'Gửi báo cáo vấn đề',",
  "descriptionKey: 'driverHome.quickActions.report.desc',"
).replace(
  "title: 'Hỗ trợ kỹ thuật',",
  "titleKey: 'driverHome.quickActions.support.title',"
).replace(
  "description: 'Chat với nhân viên',",
  "descriptionKey: 'driverHome.quickActions.support.desc',"
);

// 3. Inject useTranslation into components
const injectT = (compName) => {
  const regex = new RegExp(`const ${compName} = \\((.*?)\\) => \\{\n`);
  content = content.replace(regex, `const ${compName} = ($1) => {\n  const { t } = useTranslation();\n`);
};

injectT('VehicleStatusCard');
injectT('QuickActionCard');
injectT('InfoRow');
injectT('BookingCard');
injectT('ActiveSessionCard');
injectT('EmptyCard');
injectT('SummaryMiniCard');
injectT('DriverHome');

// 4. QuickActionCard logic
content = content.replace(
  "const QuickActionCard = ({ to, title, description, Icon, variant, iconClass, bgClass }) => {",
  "const QuickActionCard = ({ to, title, titleKey, description, descriptionKey, Icon, variant, iconClass, bgClass }) => {"
);
content = content.replace(
  "const { t } = useTranslation();\n  if (variant === 'primary')",
  "const { t } = useTranslation();\n  const displayTitle = titleKey ? t(titleKey) : title;\n  const displayDesc = descriptionKey ? t(descriptionKey) : description;\n  if (variant === 'primary')"
);
content = content.replace(/{title}/g, "{displayTitle}");
content = content.replace(/{description}/g, "{displayDesc}");

// 5. Replace strings
content = content.replace("'Trang chủ'", "t('driverHome.title')");
content = content.replace("Xin chào, {displayName}! 👋", "{t('driverHome.greeting', { name: displayName })}");
content = content.replace("Chào mừng bạn quay trở lại. Dưới đây là tổng quan tình trạng bãi xe.", "{t('driverHome.welcomeBack')}");
content = content.replace("'Đang đồng bộ dữ liệu...'", "t('driverHome.syncing')");
content = content.replace("'Đã có lỗi xảy ra'", "t('driverHome.errorTitle')");
content = content.replace(">Thử lại<", ">{t('driverHome.retry')}<");
content = content.replace("'Làm mới'", "t('driverHome.refresh')");
content = content.replace("'Đang tải...'", "t('driverHome.loading')");

content = content.replace(/label="Tổng booking"/g, "label={t('driverHome.stats.totalBookings')}");
content = content.replace(/label="Đang hoạt động"/g, "label={t('driverHome.stats.active')}");
content = content.replace(/label="Đã hoàn thành"/g, "label={t('driverHome.stats.completed')}");
content = content.replace(/label="Đã hủy \/ hết hạn"/g, "label={t('driverHome.stats.cancelled')}");

content = content.replace("Trạng thái Sức chứa (Live)", "{t('driverHome.capacity.title')}");
content = content.replace("Cập nhật lúc {updatedAt}", "{t('driverHome.capacity.updatedAt', { time: updatedAt })}");
content = content.replace("Chưa có dữ liệu vị trí đỗ được cập nhật.", "{t('driverHome.capacity.empty')}");
content = content.replace("Tỷ lệ lấp đầy", "{t('driverHome.capacity.fillRate')}");
content = content.replace(/\/ \{total\} trống/g, "{t('driverHome.capacity.available', { total })}");

content = content.replace(/title="Tiện ích nhanh"/g, "title={t('driverHome.quickActions.title')}");

content = content.replace(/title="Phiếu Đặt chỗ hiện tại"/g, "title={t('driverHome.workflows.currentBooking')}");
content = content.replace(/actionText="Xem lịch sử"/g, "actionText={t('driverHome.workflows.viewHistory')}");
content = content.replace(/title="Phiếu Gửi xe đang hoạt động"/g, "title={t('driverHome.workflows.currentSession')}");
content = content.replace(/actionText="Chi tiết phiên"/g, "actionText={t('driverHome.workflows.sessionDetail')}");

content = content.replace(/title="Chưa có đặt chỗ"/g, "title={t('driverHome.workflows.noBooking')}");
content = content.replace(/description="Giữ vị trí đẹp cho chuyến đi sắp tới của bạn ngay hôm nay."/g, "description={t('driverHome.workflows.noBookingDesc')}");
content = content.replace(/actionText="Tạo đặt chỗ"/g, "actionText={t('driverHome.workflows.createBooking')}");

content = content.replace(/title="Chưa có phiên gửi xe"/g, "title={t('driverHome.workflows.noSession')}");
content = content.replace(/description="Phiên gửi xe sẽ tự động xuất hiện khi bạn check-in vào bãi đỗ."/g, "description={t('driverHome.workflows.noSessionDesc')}");

content = content.replace(/Mã đặt chỗ/g, "{t('driverHome.workflows.bookingCode')}");
content = content.replace(/label="Bắt đầu"/g, "label={t('driverHome.workflows.start')}");
content = content.replace(/label="Kết thúc"/g, "label={t('driverHome.workflows.end')}");
content = content.replace(/label="Loại xe"/g, "label={t('driverHome.workflows.vehicleType')}");
content = content.replace(/label="Vị trí chỉ định"/g, "label={t('driverHome.workflows.location')}");
content = content.replace(/Xem mã QR/g, "{t('driverHome.workflows.viewQr')}");

content = content.replace(/Biển số đang gửi/g, "{t('driverHome.workflows.plate')}");
content = content.replace(/Loại phiên/g, "{t('driverHome.workflows.sessionType')}");
content = content.replace(/'Đặt trước'/g, "t('driverHome.workflows.prebooked')");
content = content.replace(/'Vãng lai'/g, "t('driverHome.workflows.walkIn')");
content = content.replace(/label="Mã phiên"/g, "label={t('driverHome.workflows.sessionCode')}");
content = content.replace(/label="Liên kết đặt chỗ"/g, "label={t('driverHome.workflows.bookingLink')}");
content = content.replace(/'Không'/g, "t('driverHome.workflows.none')");
content = content.replace(/label="Giờ vào"/g, "label={t('driverHome.workflows.entryTime')}");
content = content.replace(/label="Vị trí hiện tại"/g, "label={t('driverHome.workflows.currentLocation')}");

content = content.replace(/Tạm tính/g, "{t('driverHome.workflows.estimatedFee')}");
content = content.replace(/Chưa thanh toán/g, "{t('driverHome.workflows.unpaid')}");
content = content.replace(/Sự cố\?/g, "{t('driverHome.workflows.issue')}");
content = content.replace(/Thanh toán ngay/g, "{t('driverHome.workflows.payNow')}");

fs.writeFileSync(filePath, content);
console.log('DriverHome.jsx carefully patched.');
