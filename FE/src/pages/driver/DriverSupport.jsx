import React from 'react'
import { LifeBuoy, Phone, Mail, MessageSquare, ChevronRight } from 'lucide-react'

const FAQs = [
  { q: 'Làm thế nào để hủy đặt chỗ?', a: 'Bạn có thể hủy đặt chỗ trong phần \'Lịch sử đặt chỗ\' ít nhất 30 phút trước thời gian check-in dự kiến để không bị mất phí.' },
  { q: 'Tôi có thể thay đổi biển số xe không?', a: 'Có thể, bạn vui lòng vào mục \'Cài đặt hệ thống\' hoặc \'Hồ sơ cá nhân\' để cập nhật biển số xe của mình.' },
  { q: 'Làm sao để lấy hóa đơn VAT?', a: 'Hóa đơn VAT sẽ được gửi tự động qua email của bạn sau khi quá trình thanh toán hoàn tất.' },
  { q: 'Tôi quên vị trí đỗ xe của mình?', a: 'Bạn có thể xem lại vị trí ô đỗ trực tiếp trong ứng dụng ở phần \'Phiên gửi xe hiện tại\'.' }
]

const DriverSupport = () => {
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Trung tâm hỗ trợ</h1>
        <p className="mt-1 text-sm text-gray-500">Chúng tôi luôn ở đây để giúp đỡ bạn 24/7.</p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 flex flex-col items-center text-center transition hover:bg-blue-50/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <Phone size={28} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Hotline CSKH</h3>
          <p className="text-sm text-gray-500 mb-3">Hỗ trợ khẩn cấp 24/7</p>
          <a href="tel:19001234" className="text-xl font-black text-blue-600">1900 1234</a>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 flex flex-col items-center text-center transition hover:bg-indigo-50/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
            <Mail size={28} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Email hỗ trợ</h3>
          <p className="text-sm text-gray-500 mb-3">Phản hồi trong vòng 24h</p>
          <a href="mailto:support@smartpark.vn" className="text-sm font-bold text-indigo-600">support@smartpark.vn</a>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 flex flex-col items-center text-center transition hover:bg-emerald-50/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
            <MessageSquare size={28} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Chat trực tuyến</h3>
          <p className="text-sm text-gray-500 mb-3">Trò chuyện với nhân viên</p>
          <button className="rounded-xl bg-emerald-600 text-white px-6 py-2 text-sm font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition">Bắt đầu chat</button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <LifeBuoy className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Câu hỏi thường gặp (FAQ)</h2>
        </div>

        <div className="space-y-4">
          {FAQs.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 p-5 transition hover:border-blue-100 hover:bg-blue-50/30">
              <h3 className="font-bold text-gray-900 mb-2 flex justify-between items-center">
                {faq.q}
                <ChevronRight size={18} className="text-gray-400" />
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DriverSupport
