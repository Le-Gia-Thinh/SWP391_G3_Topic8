import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRight, Banknote, CreditCard, QrCode, MapPin } from 'lucide-react'
import staffApi from '../../apis/staffApi'

const StaffPaymentConfirm = () => {
  const { sessionId: paramSessionId } = useParams()
  const [sessionId, setSessionId] = useState(paramSessionId || null)
  const [sessionsPending, setSessionsPending] = useState([])
  const [sessionData, setSessionData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [confirmedPlate, setConfirmedPlate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ keyword: '', vehicleType: 'all', fromDate: '', toDate: '' })

  // ── Load pending sessions nếu chưa chọn session
  useEffect(() => {
    if (!sessionId) {
      const fetchPending = async () => {
        try {
          setLoading(true)
          const res = await staffApi.searchSessions({ status: 'Pending' })
          setSessionsPending(res.data)
        } catch (err) {
          console.error(err)
          alert('Không thể tải danh sách phiên chờ thanh toán.')
        } finally {
          setLoading(false)
        }
      }
      fetchPending()
    }
  }, [sessionId])

  // ── Load session detail khi đã chọn sessionId
  useEffect(() => {
    if (!sessionId) return
    const fetchSession = async () => {
      try {
        setLoading(true)
        const res = await staffApi.getCheckoutPreview(sessionId)
        setSessionData(res.data)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || 'Không tìm thấy phiên gửi xe.')
        setSessionId(null) // quay về danh sách pending
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [sessionId])

  const handleConfirmPayment = async () => {
    if (!confirmedPlate) return
    try {
      await staffApi.checkOutSession(sessionId, { paymentMethod })
      alert('Thanh toán thành công!')
      setSessionId(null) // quay về danh sách pending
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Thanh toán thất bại.')
    }
  }

  const handleSelectSession = (s) => {
    setSessionId(s.SessionID)
    setConfirmedPlate(false)
  }

  // ── Filter pending sessions ──
  const filteredSessions = sessionsPending.filter(s => {
    const kw = filters.keyword.toLowerCase()
    const vehicleMatch = filters.vehicleType === 'all' || s.VehicleTypeID === Number(filters.vehicleType)
    const fromMatch = !filters.fromDate || new Date(s.EntryTime) >= new Date(filters.fromDate)
    const toMatch = !filters.toDate || new Date(s.EntryTime) <= new Date(filters.toDate)
    return vehicleMatch && fromMatch && toMatch && (
      !kw || s.SessionCode?.toLowerCase().includes(kw) ||
      s.PlateNumber?.toLowerCase().includes(kw) ||
      s.DriverName?.toLowerCase().includes(kw)
    )
  })

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  )

  // ── Chưa chọn session → hiển thị danh sách Pending
  if (!sessionId) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Các phiên chờ thanh toán</h2>

        {/* Filters */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <input type="text" placeholder="Tìm Session/Plate/Driver"
            className="border rounded px-2 py-1"
            value={filters.keyword}
            onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
          />
          <select value={filters.vehicleType} onChange={(e) => setFilters(f => ({ ...f, vehicleType: e.target.value }))} className="border rounded px-2 py-1">
            <option value="all">Tất cả loại xe</option>
            <option value="1">Motorbike</option>
            <option value="2">Car</option>
            <option value="3">Truck</option>
          </select>
          <input type="date" value={filters.fromDate} onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value }))} className="border rounded px-2 py-1" />
          <input type="date" value={filters.toDate} onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value }))} className="border rounded px-2 py-1" />
        </div>

        {filteredSessions.length > 0 ? (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Session</th>
                <th className="border p-2">Biển số</th>
                <th className="border p-2">Driver</th>
                <th className="border p-2">Loại xe</th>
                <th className="border p-2">Entry</th>
                <th className="border p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map(s => (
                <tr key={s.SessionID} className="hover:bg-gray-50">
                  <td className="border p-2">{s.SessionCode}</td>
                  <td className="border p-2">{s.PlateNumber}</td>
                  <td className="border p-2">{s.DriverName}</td>
                  <td className="border p-2">{s.VehicleName}</td>
                  <td className="border p-2">{new Date(s.EntryTime).toLocaleString()}</td>
                  <td className="border p-2">
                    <button onClick={() => handleSelectSession(s)} className="px-2 py-1 rounded bg-blue-600 text-white">Chọn</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-gray-500">Hiện tại không có phiên chờ thanh toán.</p>
        )}
      </div>
    )
  }

  // ── Khi đã chọn session → hiển thị chi tiết
  if (!sessionData?.session) return <p className="text-center text-red-500 mt-20">Không tìm thấy phiên gửi xe.</p>

  const { session, estimatedFee, surchargeAmount, prepaidAmount, checkoutTime, durationH, history } = sessionData

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>Thanh toán</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Xác nhận & Thu phí</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chi phí & Xác nhận thanh toán</h1>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left Column */}
        <div className="flex-[2] space-y-6">
          {/* Session Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Thông tin phiên gửi xe</h3>
                <p className="text-sm text-gray-500">Đối chiếu lại các thông tin của phương tiện vào/ra</p>
              </div>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">{session.SessionStatus}</span>
            </div>

            <div className="grid grid-cols-3 gap-y-6">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">SessionID</p>
                <p className="text-base font-bold text-gray-800">{session.SessionCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Biển số xe</p>
                <p className="text-base font-bold text-gray-800">{session.PlateNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Driver</p>
                <p className="text-base font-bold text-gray-800">{session.DriverName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Loại xe</p>
                <p className="text-base font-bold text-gray-800">{session.VehicleName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Vị trí đỗ</p>
                <p className="text-base font-bold flex items-center gap-1">
                  <MapPin size={16} className="text-gray-400" /> {session.ZoneName} - {session.FloorName} - {session.SlotCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Entry Time</p>
                <p className="text-base font-bold text-gray-800">{new Date(session.EntryTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Exit Time</p>
                <p className="text-base font-bold text-blue-600">{checkoutTime ? new Date(checkoutTime).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Fee & Surcharge */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chi tiết phí</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Phí cơ bản</span>
                <span className="font-semibold">{estimatedFee?.toLocaleString() || 0} VND</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Đã trả trước</span>
                <span className="font-semibold">{prepaidAmount?.toLocaleString() || 0} VND</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Phụ trội</span>
                <span className="font-semibold">{surchargeAmount?.toLocaleString() || 0} VND</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-bold">
                <span>Tổng cộng</span>
                <span>{(estimatedFee + surchargeAmount)?.toLocaleString() || 0} VND</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Timeline */}
        <div className="flex-1 space-y-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold mb-4">Phương thức thanh toán</h3>
            <div className="space-y-3 mb-6">
              {['cash', 'bank', 'qr'].map(method => {
                const labels = { cash: 'Tiền mặt', bank: 'Banking', qr: 'QR' }
                const Icons = { cash: Banknote, bank: CreditCard, qr: QrCode }
                const Icon = Icons[method]
                return (
                  <label key={method} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer ${paymentMethod === method ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                    <div className="flex items-center gap-3">
                      <Icon size={24} className={paymentMethod === method ? 'text-blue-600' : 'text-gray-500'} />
                      <span className={`font-bold ${paymentMethod === method ? 'text-blue-900' : 'text-gray-700'}`}>{labels[method]}</span>
                    </div>
                    <input type="radio" name="payment" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="w-5 h-5 text-blue-600" />
                  </label>
                )
              })}
            </div>
            <button disabled={!confirmedPlate} onClick={handleConfirmPayment} className={`w-full py-4 rounded-xl font-bold text-lg ${confirmedPlate ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>XÁC NHẬN THANH TOÁN</button>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Lịch sử</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {history?.map((item, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 border-white shadow shrink-0 ${item.type === 'checkout' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}></div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-4 md:pl-0 md:pr-4 md:group-odd:pr-0 md:group-odd:pl-4">
                    <div className="text-xs text-gray-400 font-semibold">{new Date(item.time).toLocaleTimeString()}</div>
                    <div className={`text-sm font-bold ${item.type === 'checkout' ? 'text-blue-600' : 'text-gray-800'}`}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffPaymentConfirm