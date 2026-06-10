import { QrCode, LogIn } from 'lucide-react'

const CheckIn = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-blue-600 p-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <QrCode size={32} />
          </div>
          <h1 className="text-2xl font-bold">Check-in Bãi Đỗ Xe</h1>
          <p className="mt-2 text-blue-100 opacity-80">Quét mã QR hoặc nhập mã thủ công</p>
        </div>
        <div className="p-8">
          <div className="mb-6 flex flex-col gap-4">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 p-4 font-semibold text-blue-700 transition hover:bg-blue-100">
              <QrCode size={20} />
              Quét mã QR (Camera)
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-4 shrink-0 text-sm font-medium text-gray-400">hoặc</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">Mã đặt chỗ / Biển số xe</label>
              <input
                type="text"
                placeholder="Ví dụ: BK-1234 hoặc 51H-123.45"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700">
              <LogIn size={20} />
              Xác nhận Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckIn
