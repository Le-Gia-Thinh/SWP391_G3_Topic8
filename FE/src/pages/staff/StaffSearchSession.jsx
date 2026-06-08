import React, { useState, useMemo } from 'react';
import { Search, Car, Clock, MapPin, ChevronRight, CheckCircle2, XCircle, AlertTriangle, RefreshCcw, Filter, ChevronDown, ChevronUp, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_SESSIONS = [
  {
    id: 'PS-20240518-0012',
    plate: '51H-999.88',
    vehicle: 'Ô tô 4 chỗ',
    type: 'Vãng lai',
    typeColor: 'bg-gray-100 text-gray-600',
    slot: 'A-102',
    gate: 'Gate 02',
    checkIn: '18/05/2026 14:30',
    checkOut: null,
    status: 'active',
    staff: 'Nguyễn Văn An'
  },
  {
    id: 'PS-20240518-0010',
    plate: '30A-997.21',
    vehicle: 'Ô tô 7 chỗ',
    type: 'Booking',
    typeColor: 'bg-blue-50 text-blue-600',
    slot: 'B-112',
    gate: 'Gate 01',
    checkIn: '18/05/2026 10:42',
    checkOut: '18/05/2026 13:15',
    status: 'completed',
    staff: 'Nguyễn Văn An'
  },
  {
    id: 'PS-20240518-0008',
    plate: '43A-552.12',
    vehicle: 'Xe máy',
    type: 'Vãng lai',
    typeColor: 'bg-gray-100 text-gray-600',
    slot: 'M-005',
    gate: 'Gate 03',
    checkIn: '18/05/2026 09:15',
    checkOut: '18/05/2026 11:50',
    status: 'completed',
    staff: 'Trần Minh Hòa'
  },
  {
    id: 'PS-20240517-0099',
    plate: '29D-111.90',
    vehicle: 'Bán tải',
    type: 'Vãng lai',
    typeColor: 'bg-gray-100 text-gray-600',
    slot: 'C-010',
    gate: 'Gate 01',
    checkIn: '17/05/2026 08:00',
    checkOut: '17/05/2026 17:30',
    status: 'completed',
    staff: 'Lê Thị Hoa'
  },
  {
    id: 'PS-20240518-0015',
    plate: '51G-888.77',
    vehicle: 'Ô tô 4 chỗ',
    type: 'Booking',
    typeColor: 'bg-blue-50 text-blue-600',
    slot: 'A-008',
    gate: 'Gate 01',
    checkIn: '18/05/2026 15:00',
    checkOut: null,
    status: 'active',
    staff: 'Nguyễn Văn An'
  }
]

const STATUS_CONFIG = {
  active:    { label: 'Đang đỗ', icon: <Clock size={14} />, color: 'bg-green-50 text-green-700 border-green-200' },
  completed: { label: 'Đã hoàn thành', icon: <CheckCircle2 size={14} />, color: 'bg-gray-100 text-gray-600 border-gray-200' },
  incident:  { label: 'Sự cố', icon: <AlertTriangle size={14} />, color: 'bg-red-50 text-red-600 border-red-200' }
}

const StaffSearchSession = () => {
  const navigate = useNavigate();
  
  // Search and Filter States
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    vehicle: 'all',
    gate: 'all',
    date: ''
  });
  
  const [selectedSession, setSelectedSession] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: 'all', type: 'all', vehicle: 'all', gate: 'all', date: '' });
    setQuery('');
  };

  // Filter Logic
  const filtered = useMemo(() => {
    return MOCK_SESSIONS.filter(s => {
      const matchQuery = query === '' || 
        s.plate.toLowerCase().includes(query.toLowerCase()) || 
        s.id.toLowerCase().includes(query.toLowerCase());
      
      const matchStatus = filters.status === 'all' || s.status === filters.status;
      const matchType = filters.type === 'all' || s.type === filters.type;
      const matchVehicle = filters.vehicle === 'all' || s.vehicle === filters.vehicle;
      const matchGate = filters.gate === 'all' || s.gate === filters.gate;
      const matchDate = filters.date === '' || s.checkIn.includes(filters.date.split('-').reverse().join('/'));

      return matchQuery && matchStatus && matchType && matchVehicle && matchGate && matchDate;
    });
  }, [query, filters]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length + (query ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      
      {/* Top Compact Search Bar */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 pl-2 whitespace-nowrap">
          <Search size={20} className="text-blue-600" /> Tra cứu
        </h1>
        
        <div className="flex-1 min-w-[250px] relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nhập biển số hoặc mã phiên..."
            className="w-full pl-12 pr-10 py-2.5 rounded-full bg-slate-50 border border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XCircle size={16} />
            </button>
          )}
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
            showFilters || activeFiltersCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} /> Bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expandable Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-800">Tùy chọn tra cứu nâng cao</h3>
            <button onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:underline">Xóa bộ lọc</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Trạng thái</label>
              <select 
                value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang đỗ (Active)</option>
                <option value="completed">Đã rời đi (Completed)</option>
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Loại xe</label>
              <select 
                value={filters.vehicle} onChange={e => handleFilterChange('vehicle', e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              >
                <option value="all">Tất cả xe</option>
                <option value="Ô tô 4 chỗ">Ô tô 4 chỗ</option>
                <option value="Ô tô 7 chỗ">Ô tô 7 chỗ</option>
                <option value="Bán tải">Bán tải</option>
                <option value="Xe máy">Xe máy</option>
              </select>
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Hình thức</label>
              <select 
                value={filters.type} onChange={e => handleFilterChange('type', e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              >
                <option value="all">Tất cả</option>
                <option value="Booking">Đặt trước (Booking)</option>
                <option value="Vãng lai">Vãng lai (Walk-in)</option>
              </select>
            </div>

            {/* Gate */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Cổng / Gate</label>
              <select 
                value={filters.gate} onChange={e => handleFilterChange('gate', e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              >
                <option value="all">Tất cả các cổng</option>
                <option value="Gate 01">Gate 01</option>
                <option value="Gate 02">Gate 02</option>
                <option value="Gate 03">Gate 03</option>
              </select>
            </div>

            {/* Date Picker */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Ngày check-in</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date" 
                  value={filters.date} onChange={e => handleFilterChange('date', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex justify-between items-center mb-3 px-1 text-sm">
        <span className="text-gray-500 font-medium">Tìm thấy <strong className="text-gray-900">{filtered.length}</strong> kết quả phù hợp</span>
        <div className="flex gap-4">
          <span className="text-green-600 font-semibold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Đang đỗ: {filtered.filter(s => s.status === 'active').length}</span>
          <span className="text-gray-500 font-semibold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Hoàn thành: {filtered.filter(s => s.status === 'completed').length}</span>
        </div>
      </div>

      {/* Results + Detail Panel */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left: List */}
        <div className="flex-1 min-w-0 space-y-3 overflow-auto pr-1 pb-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center h-full flex flex-col justify-center items-center">
              <Search size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-600 font-bold text-lg">Không tìm thấy phiên nào</p>
              <p className="text-sm text-gray-400 mt-2 max-w-sm">Hãy thử thay đổi điều kiện lọc, xóa từ khóa tìm kiếm hoặc làm mới trang để xem kết quả.</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 font-semibold rounded-full hover:bg-blue-100 transition-colors">
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            filtered.map(session => {
              const stCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.completed
              const isSelected = selectedSession?.id === session.id
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(isSelected ? null : session)}
                  className={`w-full text-left bg-white rounded-2xl border transition-all hover:shadow-md p-5 ${
                    isSelected ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-blue-50 text-blue-600'}`}>
                        <Car size={24} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-gray-900 tracking-wide leading-none">{session.plate}</p>
                        <p className="text-xs font-semibold text-gray-400 mt-1.5 flex items-center gap-1.5">
                          {session.id} <span className="w-1 h-1 rounded-full bg-gray-300"></span> {session.vehicle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${session.typeColor}`}>{session.type}</span>
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border ${stCfg.color}`}>
                        {stCfg.icon} {stCfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Vị trí (Slot)</p>
                      <p className="font-black text-blue-600">{session.slot}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Cổng (Gate)</p>
                      <p className="font-bold text-gray-700">{session.gate}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Thời gian vào</p>
                      <p className="font-bold text-gray-700">{session.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Thời gian ra</p>
                      <p className={`font-bold ${session.checkOut ? 'text-gray-700' : 'text-green-600 flex items-center gap-1'}`}>
                        {session.checkOut || <><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Đang đỗ</>}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Right: Detail panel */}
        <div className="w-80 flex flex-col gap-4 pb-4">
          {selectedSession ? (
            <>
              {/* Info Card */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
                <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20"><Car size={64} className="text-white transform rotate-12 scale-150 translate-x-4 -translate-y-4" /></div>
                  <h3 className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-2 relative z-10">Chi tiết phiên gửi xe</h3>
                  <p className="text-3xl font-black text-white tracking-widest relative z-10 drop-shadow-md">{selectedSession.plate}</p>
                  <p className="text-sm font-medium text-blue-100 mt-1 relative z-10">{selectedSession.vehicle}</p>
                </div>
                
                <div className="p-6">
                  <div className={`flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold mb-6 border ${STATUS_CONFIG[selectedSession.status]?.color}`}>
                    {STATUS_CONFIG[selectedSession.status]?.icon}
                    {STATUS_CONFIG[selectedSession.status]?.label}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mã phiên hệ thống</p>
                        <p className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{selectedSession.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-b border-gray-50 pb-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Loại xe</p>
                        <p className="text-sm font-bold text-gray-800">{selectedSession.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vị trí đỗ</p>
                        <p className="text-sm font-black text-blue-600">{selectedSession.slot}</p>
                      </div>
                    </div>

                    <div className="space-y-3 border-b border-gray-50 pb-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><MapPin size={14} /> Cổng vào</span>
                        <span className="font-bold text-gray-800">{selectedSession.gate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><Clock size={14} /> Thời gian vào</span>
                        <span className="font-bold text-gray-800">{selectedSession.checkIn}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><Clock size={14} /> Thời gian ra</span>
                        <span className="font-bold text-gray-800">{selectedSession.checkOut || '—'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-sm">
                      <span className="text-gray-500 font-medium flex items-center gap-2"><User size={14} /> Nhân viên tạo</span>
                      <span className="font-bold text-gray-800">{selectedSession.staff}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Thao tác</h3>
                <div className="space-y-2.5">
                  {selectedSession.status === 'active' && (
                    <button
                      onClick={() => navigate('/staff/checkout')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                      <MapPin size={16} /> Tiến hành Check-out
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/staff/create-incident')}
                    className="w-full py-3 bg-white hover:bg-red-50 text-red-600 font-bold rounded-xl text-sm border-2 border-red-100 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} /> Báo cáo sự cố
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center h-full flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Search size={28} className="text-blue-300" />
              </div>
              <p className="text-gray-800 font-bold mb-1">Xem chi tiết phiên</p>
              <p className="text-xs text-gray-400 leading-relaxed">Hãy click chọn một phiên gửi xe ở danh sách bên trái để xem thông tin chi tiết và thực hiện thao tác.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffSearchSession
