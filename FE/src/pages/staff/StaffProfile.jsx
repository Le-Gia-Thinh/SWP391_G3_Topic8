import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Camera, Shield, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const StaffProfile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  const displayName = user?.fullName || 'Nguyễn Văn An';
  const displayEmail = user?.email || 'staff@pbms.vn';
  const displayRole = user?.role?.roleName || 'Staff';

  const infoFields = [
    { icon: <User size={16} className="text-blue-500" />, label: 'Họ và tên', value: displayName },
    { icon: <Mail size={16} className="text-purple-500" />, label: 'Email', value: displayEmail },
    { icon: <Phone size={16} className="text-green-500" />, label: 'Số điện thoại', value: '0912 345 678' },
    { icon: <MapPin size={16} className="text-red-500" />, label: 'Cổng phụ trách', value: 'Cổng A – Gate 01' },
    { icon: <Calendar size={16} className="text-orange-500" />, label: 'Ngày bắt đầu làm', value: '01/01/2024' },
    { icon: <Shield size={16} className="text-indigo-500" />, label: 'Vai trò', value: displayRole },
  ];

  const stats = [
    { label: 'Phiên hôm nay', value: '24', color: 'text-blue-600' },
    { label: 'Tổng tháng này', value: '312', color: 'text-green-600' },
    { label: 'Sự cố báo cáo', value: '3', color: 'text-orange-500' },
    { label: 'Đánh giá', value: '4.9 ★', color: 'text-yellow-500' },
  ];

  const activities = [
    { time: '10:45', action: 'Check-in Walk-in – Biển 51H-999.88', type: 'checkin' },
    { time: '10:30', action: 'Xác thực Booking BK-8829', type: 'booking' },
    { time: '09:58', action: 'Check-out – Biển 43A-552.12', type: 'checkout' },
    { time: '09:15', action: 'Check-in Walk-in – Biển 29D-111.90', type: 'checkin' },
    { time: '08:40', action: 'Báo cáo sự cố #INC-0034', type: 'incident' },
  ];

  const actColor = { checkin: 'bg-green-100 text-green-600', checkout: 'bg-orange-100 text-orange-600', booking: 'bg-blue-100 text-blue-600', incident: 'bg-red-100 text-red-600' };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
          <p className="text-sm text-gray-500 mt-1">Thông tin tài khoản và hoạt động của bạn</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-200 text-sm"
        >
          <Edit3 size={15} /> {editing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left column */}
        <div className="w-72 flex flex-col gap-4">
          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img
                src="https://i.pravatar.cc/150?img=11"
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-blue-700 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <p className="text-lg font-black text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">{displayEmail}</p>
            <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 uppercase">
              {displayRole}
            </span>
            <div className="mt-4 w-full pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-600">Đang trực tuyến</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-600 uppercase mb-4">Thống kê</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(s => (
                <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3">
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verified badge */}
          <div className="bg-green-50 rounded-2xl border border-green-100 p-4 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">Tài khoản đã xác thực</p>
              <p className="text-xs text-green-600">Đã xác minh email & số điện thoại</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-auto">
          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-5">Thông tin cá nhân</h3>
            <div className="grid grid-cols-2 gap-4">
              {infoFields.map(({ icon, label, value }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                    {icon} {label}
                  </label>
                  {editing ? (
                    <input
                      defaultValue={value}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-all"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">{value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Shift info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-5">Thông tin ca trực</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Ca hiện tại', value: 'Ca Ngày (07:00 – 19:00)' },
                { label: 'Cổng phụ trách', value: 'Gate A – Cổng Vào Chính' },
                { label: 'Mã nhân viên', value: 'ST-1011-200' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs text-blue-500 font-semibold uppercase mb-1">{label}</p>
                  <p className="text-sm font-bold text-blue-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Hoạt động gần đây</h3>
              <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono w-12 shrink-0">{a.time}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${actColor[a.type]}`}>
                    {a.type === 'checkin' ? 'VÀO' : a.type === 'checkout' ? 'RA' : a.type === 'booking' ? 'BOOKING' : 'SỰ CỐ'}
                  </span>
                  <span className="text-sm text-gray-700 flex-1">{a.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
