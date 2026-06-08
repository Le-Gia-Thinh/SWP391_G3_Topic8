import React, { useState } from 'react'
import { Bell, Lock, User, Car, Shield, CreditCard, ChevronRight } from 'lucide-react'

const SETTINGS_TABS = [
  { id: 'account', label: 'Tài khoản', icon: User },
  { id: 'vehicles', label: 'Phương tiện', icon: Car },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'security', label: 'Bảo mật', icon: Shield },
  { id: 'payment', label: 'Thanh toán', icon: CreditCard }
]

const DriverSettings = () => {
  const [activeTab, setActiveTab] = useState('account')

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500">Quản lý tùy chọn và bảo mật tài khoản của bạn.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {SETTINGS_TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all text-left ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {active && <ChevronRight size={16} className="ml-auto opacity-70" />}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm min-h-[500px]">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Thông tin cá nhân</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Họ và tên</label>
                  <input type="text" defaultValue="Duy Nguyễn" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                  <input type="text" defaultValue="0901234567" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" defaultValue="driver@smartpark.com" disabled className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed" />
                  <p className="mt-2 text-xs text-gray-400">Email không thể thay đổi. Vui lòng liên hệ hỗ trợ nếu cần.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition">Lưu thay đổi</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Tùy chọn thông báo</h2>

              <div className="space-y-4">
                {[
                  { title: 'Thông báo đẩy (Push Notifications)', desc: 'Nhận thông báo trực tiếp trên trình duyệt hoặc thiết bị', checked: true },
                  { title: 'Thông báo SMS', desc: 'Nhận mã OTP và cảnh báo qua tin nhắn', checked: false },
                  { title: 'Thông báo Email', desc: 'Nhận hóa đơn và bản tin cập nhật qua email', checked: true },
                  { title: 'Âm thanh thông báo', desc: 'Phát âm thanh khi có thông báo mới', checked: true }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab !== 'account' && activeTab !== 'notifications' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <Shield size={48} className="text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Mục này đang được cập nhật</h3>
              <p className="text-sm text-gray-500 max-w-md">Tính năng quản lý {SETTINGS_TABS.find(t => t.id === activeTab)?.label.toLowerCase()} sẽ sớm ra mắt trong bản cập nhật tiếp theo.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DriverSettings
