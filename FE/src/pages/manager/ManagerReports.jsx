import React from 'react'
import { FileText, Download, TrendingUp, DollarSign, CarFront } from 'lucide-react'

const REPORTS = [
  { title: 'Báo cáo doanh thu tháng 05/2026', type: 'Doanh thu', date: '24/05/2026', size: '1.2 MB' },
  { title: 'Thống kê lưu lượng xe Quý 1', type: 'Vận hành', date: '01/04/2026', size: '3.4 MB' },
  { title: 'Danh sách sự cố tháng 04/2026', type: 'Sự cố', date: '30/04/2026', size: '840 KB' },
  { title: 'Báo cáo hiệu suất thẻ từ', type: 'Kỹ thuật', date: '15/04/2026', size: '1.5 MB' },
]

const ManagerReports = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo hệ thống</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo, xem và xuất các báo cáo liên quan đến hoạt động của bãi đỗ xe.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 transition">
          <FileText size={18} />
          Tạo báo cáo mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-300 transition cursor-pointer">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Doanh thu & Tài chính</h3>
            <p className="text-sm text-slate-500 mt-1">Xuất thống kê doanh thu theo ngày, tuần, tháng.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-300 transition cursor-pointer">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <CarFront size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Lưu lượng & Vận hành</h3>
            <p className="text-sm text-slate-500 mt-1">Lượng xe ra vào, tỷ lệ lấp đầy, thời gian lưu trú.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-300 transition cursor-pointer">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Hiệu suất hệ thống</h3>
            <p className="text-sm text-slate-500 mt-1">Tỷ lệ lỗi barie, camera, và báo cáo xử lý sự cố.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Báo cáo gần đây</h2>
        <div className="space-y-4">
          {REPORTS.map((report, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition">
              <div className="flex items-start gap-4 mb-4 sm:mb-0">
                <div className="p-2.5 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{report.title}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-lg">{report.type}</span>
                    <span className="text-xs text-slate-400">{report.date}</span>
                    <span className="text-xs text-slate-400">• {report.size}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs hover:text-blue-600 hover:border-blue-300 transition">
                <Download size={14} /> Tải PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ManagerReports
