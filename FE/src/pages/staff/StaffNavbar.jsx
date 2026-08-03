import React, { useState, useEffect } from 'react'
import { MapPin, ChevronDown, User, Shield, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import staffApi from '../../apis/staffApi'

export default function StaffNavbar() {
  const { user } = useAuth()
  const [gates, setGates] = useState([])
  const [selectedGate, setSelectedGate] = useState(() => {
    try {
      const saved = localStorage.getItem('staff_active_gate')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    let active = true
    staffApi.getGates()
      .then(res => {
        if (!active) return
        const list = res?.data || []
        setGates(list)
        if (!selectedGate && list.length > 0) {
          const firstIn = list.find(g => g.GateType === 'In' || g.GateType === 'BiDirectional') || list[0]
          setSelectedGate(firstIn)
          localStorage.setItem('staff_active_gate', JSON.stringify(firstIn))
        }
      })
      .catch(() => { })
    return () => { active = false }
  }, [])

  const handleSelectGate = (gate) => {
    setSelectedGate(gate)
    localStorage.setItem('staff_active_gate', JSON.stringify(gate))
    setDropdownOpen(false)
  }

  return (
    <div className="flex items-center justify-between w-full px-4">
      {/* ── GATE SELECTOR DROPDOWN ── */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-600/50"
        >
          <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
          <span>
            {selectedGate ? `${selectedGate.BuildingName || 'Bãi xe'} - ${selectedGate.GateName}` : 'Chọn Cổng Trực'}
          </span>
          <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Cổng bảo vệ đang trực
            </p>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {gates.length === 0 ? (
                <p className="text-xs text-slate-400 px-3 py-2">Không tìm thấy danh sách cổng</p>
              ) : (
                gates.map(g => {
                  const isSelected = selectedGate?.GateID === g.GateID
                  return (
                    <button
                      key={g.GateID}
                      onClick={() => handleSelectGate(g)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <div>
                        <p>{g.GateName}</p>
                        <p className="text-[10px] font-normal text-slate-400">
                          {g.BuildingName} · {g.GateType === 'In' ? 'Làn Vào' : g.GateType === 'Out' ? 'Làn Ra' : 'Hai Chiều'}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── USER DISPLAY ── */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-black text-slate-800 dark:text-white leading-none">
            {user?.fullName || 'Bảo vệ ca trực'}
          </p>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
            <Shield size={10} /> Đang trực ca
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-blue-500/20">
          {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={16} />}
        </div>
      </div>
    </div>
  )
}