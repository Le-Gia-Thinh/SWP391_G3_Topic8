import React, { useState } from 'react';
import { Settings, Bell, Monitor, Globe, Moon, Sun, Eye, EyeOff, Smartphone, Save, RefreshCcw } from 'lucide-react';

const Toggle = ({ checked, onChange, label, desc }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const StaffSettings = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotif: true,
    pushNotif: true,
    smsNotif: false,
    soundAlert: true,
    autoLogout: true,
    showPlate: true,
    compactView: false,
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
  });

  const set = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings size={24} className="text-blue-600" /> Cài đặt tài khoản
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tuỳ chỉnh giao diện, thông báo và trải nghiệm làm việc</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-all shadow-md text-sm ${
            saved
              ? 'bg-green-500 text-white shadow-green-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          }`}
        >
          <Save size={15} />
          {saved ? 'Đã lưu!' : 'Lưu cài đặt'}
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0 overflow-auto">
        {/* Left column */}
        <div className="flex-1 space-y-5">

          {/* Appearance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Monitor size={18} className="text-blue-500" /> Giao diện
            </h3>
            <p className="text-xs text-gray-400 mb-5">Tuỳ chỉnh cách hiển thị giao diện hệ thống</p>

            {/* Theme selector */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Chủ đề màu sắc</p>
              <div className="flex gap-3">
                {[
                  { id: 'light', icon: <Sun size={18} />, label: 'Sáng' },
                  { id: 'dark', icon: <Moon size={18} />, label: 'Tối' },
                  { id: 'system', icon: <Monitor size={18} />, label: 'Hệ thống' },
                ].map(({ id, icon, label }) => (
                  <button
                    key={id}
                    onClick={() => set('darkMode')(id === 'dark')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      (id === 'dark' && settings.darkMode) || (id === 'light' && !settings.darkMode)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {icon}
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Toggle label="Giao diện thu gọn" desc="Hiển thị nhiều thông tin hơn trên màn hình nhỏ" checked={settings.compactView} onChange={set('compactView')} />
            <Toggle label="Hiển thị biển số đầy đủ" desc="Không che ký tự cuối biển số xe" checked={settings.showPlate} onChange={set('showPlate')} />
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Bell size={18} className="text-purple-500" /> Thông báo
            </h3>
            <p className="text-xs text-gray-400 mb-5">Kiểm soát cách bạn nhận thông báo từ hệ thống</p>

            <Toggle label="Thông báo qua Email" desc="Gửi báo cáo và cảnh báo tới hộp thư" checked={settings.emailNotif} onChange={set('emailNotif')} />
            <Toggle label="Thông báo đẩy (Push)" desc="Thông báo ngay trên trình duyệt" checked={settings.pushNotif} onChange={set('pushNotif')} />
            <Toggle label="Thông báo SMS" desc="Tin nhắn cho sự cố khẩn cấp" checked={settings.smsNotif} onChange={set('smsNotif')} />
            <Toggle label="Âm thanh cảnh báo" desc="Phát âm khi có sự cố hoặc yêu cầu mới" checked={settings.soundAlert} onChange={set('soundAlert')} />
          </div>
        </div>

        {/* Right column */}
        <div className="w-80 flex flex-col gap-5">

          {/* Language / Region */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Globe size={18} className="text-green-500" /> Ngôn ngữ & Khu vực
            </h3>
            <p className="text-xs text-gray-400 mb-5">Ngôn ngữ hiển thị và múi giờ</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Ngôn ngữ</label>
                <select
                  value={settings.language}
                  onChange={e => set('language')(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Múi giờ</label>
                <select
                  value={settings.timezone}
                  onChange={e => set('timezone')(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                >
                  <option value="Asia/Ho_Chi_Minh">GMT+7 (Hà Nội / TP.HCM)</option>
                  <option value="Asia/Bangkok">GMT+7 (Bangkok)</option>
                  <option value="UTC">UTC+0</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security quick settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Smartphone size={18} className="text-orange-500" /> Thiết bị & Phiên
            </h3>
            <p className="text-xs text-gray-400 mb-5">Quản lý đăng nhập và phiên làm việc</p>

            <Toggle label="Tự động đăng xuất" desc="Sau 30 phút không hoạt động" checked={settings.autoLogout} onChange={set('autoLogout')} />

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Thiết bị đang đăng nhập</p>
              {[
                { name: 'Máy tính Gate A', os: 'Windows 11 – Chrome', active: true },
                { name: 'Điện thoại cá nhân', os: 'Android – App', active: false },
              ].map(device => (
                <div key={device.name} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{device.name}</p>
                    <p className="text-[11px] text-gray-400">{device.os}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${device.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {device.active ? 'Hiện tại' : 'Đã đăng xuất'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-500 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
            <RefreshCcw size={15} /> Khôi phục cài đặt mặc định
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSettings;
