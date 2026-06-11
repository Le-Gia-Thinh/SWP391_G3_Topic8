import React, { useState } from 'react'
import { LifeBuoy, Phone, Mail, MessageSquare, ChevronRight, FileText, ShieldAlert, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQs = [
  { q: 'Làm thế nào để hủy đặt chỗ?', a: 'Bạn có thể hủy đặt chỗ trong phần \'Lịch sử đặt chỗ\' ít nhất 30 phút trước thời gian check-in dự kiến để không bị mất phí.' },
  { q: 'Tôi có thể thay đổi biển số xe không?', a: 'Có thể, bạn vui lòng vào mục \'Cài đặt hệ thống\' hoặc \'Hồ sơ cá nhân\' để cập nhật biển số xe của mình.' },
  { q: 'Làm sao để lấy hóa đơn VAT?', a: 'Hóa đơn VAT sẽ được gửi tự động qua email của bạn sau khi quá trình thanh toán hoàn tất.' },
  { q: 'Tôi quên vị trí đỗ xe của mình?', a: 'Bạn có thể xem lại vị trí ô đỗ trực tiếp trong ứng dụng ở phần \'Phiên gửi xe hiện tại\'.' }
]

const HELP_TABS = [
  { id: 'support', label: 'Trung tâm hỗ trợ', icon: HelpCircle },
  { id: 'terms', label: 'Điều khoản dịch vụ', icon: FileText },
  { id: 'privacy', label: 'Chính sách bảo mật', icon: ShieldAlert }
]

const DriverHelp = () => {
  const [activeTab, setActiveTab] = useState('support')

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Trợ giúp & Chính sách</h1>
        <p className="mt-1 text-sm text-gray-500">Các thông tin hỗ trợ và quy định của hệ thống.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {HELP_TABS.map(tab => {
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

        <main className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm min-h-[600px]">
          {activeTab === 'support' && (
            <div className="space-y-8 animate-in fade-in">
              <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 flex flex-col items-center text-center transition hover:bg-blue-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
                    <Phone size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Hotline CSKH</h3>
                  <p className="text-xs text-gray-500 mb-3">Hỗ trợ khẩn cấp 24/7</p>
                  <a href="tel:19001234" className="text-lg font-black text-blue-600">1900 1234</a>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 flex flex-col items-center text-center transition hover:bg-indigo-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
                    <Mail size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Email hỗ trợ</h3>
                  <p className="text-xs text-gray-500 mb-3">Phản hồi trong vòng 24h</p>
                  <a href="mailto:support@smartpark.vn" className="text-sm font-bold text-indigo-600 break-all">support@smartpark.vn</a>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 flex flex-col items-center text-center transition hover:bg-emerald-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Chat trực tuyến</h3>
                  <p className="text-xs text-gray-500 mb-3">Trò chuyện với nhân viên</p>
                  <button className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition">Bắt đầu chat</button>
                </div>
              </section>

              <section>
                <div className="mb-6 flex items-center gap-3">
                  <LifeBuoy className="text-blue-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Câu hỏi thường gặp (FAQ)</h2>
                </div>

                <div className="space-y-4">
                  {FAQs.map((faq, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-5 transition hover:border-blue-100 hover:bg-blue-50/30">
                      <h3 className="font-bold text-gray-900 mb-2 flex justify-between items-center">
                        {faq.q}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <FileText className="text-blue-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Điều khoản dịch vụ</h2>
              </div>

              <div className="prose prose-sm prose-blue max-w-none text-gray-600 leading-relaxed space-y-4">
                <p className="font-semibold text-gray-800">Cập nhật lần cuối: 24/05/2026</p>

                <h3 className="text-lg font-bold text-gray-900 mt-6">1. Chấp nhận điều khoản</h3>
                <p>Bằng việc đăng ký và sử dụng dịch vụ của Parking Building Management System (PBMS), bạn đồng ý tuân thủ các quy định và điều kiện được nêu trong tài liệu này.</p>

                <h3 className="text-lg font-bold text-gray-900 mt-6">2. Quy định khi gửi xe</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Bạn phải đỗ xe đúng vị trí đã được chỉ định (đối với xe có đặt trước) hoặc theo sự hướng dẫn của nhân viên bãi xe.</li>
                  <li>Không để lại tài sản có giá trị lớn trong xe. Ban quản lý sẽ không chịu trách nhiệm cho các mất mát tài sản cá nhân để bên trong xe.</li>
                  <li>Tuân thủ tốc độ tối đa 5km/h trong khu vực hầm xe và bật đèn chiếu gần.</li>
                </ul>

                <h3 className="text-lg font-bold text-gray-900 mt-6">3. Chính sách Thanh toán & Hủy chỗ</h3>
                <p>Hệ thống hỗ trợ thanh toán qua các cổng điện tử và tiền mặt. Việc hủy đặt chỗ phải được thực hiện trước thời gian check-in ít nhất 30 phút để không phát sinh phí bồi thường.</p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <ShieldAlert className="text-emerald-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Chính sách bảo mật</h2>
              </div>

              <div className="prose prose-sm prose-emerald max-w-none text-gray-600 leading-relaxed space-y-4">
                <p className="font-semibold text-gray-800">Cập nhật lần cuối: 24/05/2026</p>

                <p>Chính sách này giải thích cách chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ thông tin cá nhân của bạn khi sử dụng hệ thống đỗ xe thông minh PBMS.</p>

                <h3 className="text-lg font-bold text-gray-900 mt-6">1. Thông tin chúng tôi thu thập</h3>
                <p>Chúng tôi chỉ thu thập các thông tin cần thiết phục vụ cho việc quản lý bãi xe bao gồm:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Thông tin tài khoản: Họ tên, Email, Số điện thoại.</li>
                  <li>Thông tin phương tiện: Biển số xe, Loại xe.</li>
                  <li>Dữ liệu lịch sử gửi xe và hình ảnh biển số chụp tự động tại cổng ra/vào.</li>
                </ul>

                <h3 className="text-lg font-bold text-gray-900 mt-6">2. Sử dụng thông tin</h3>
                <p>Dữ liệu của bạn được dùng hoàn toàn cho mục đích xác thực tự động tại cổng, ghi nhận thời gian gửi để tính phí chính xác và đảm bảo an ninh cho phương tiện của bạn.</p>

                <h3 className="text-lg font-bold text-gray-900 mt-6">3. Bảo vệ dữ liệu</h3>
                <p>Chúng tôi áp dụng các tiêu chuẩn mã hóa SSL/TLS để bảo vệ dữ liệu truyền tải. Dữ liệu thẻ thanh toán không được lưu trữ trực tiếp trên máy chủ của chúng tôi mà qua đối tác thanh toán đạt chuẩn PCI-DSS.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DriverHelp
