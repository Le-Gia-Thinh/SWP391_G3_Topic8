import React, { useState, useRef } from 'react'
import { ChevronLeft, AlertTriangle, FileText, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import staffApi from '../../apis/staffApi'
import { toast } from 'react-toastify'

export default function StaffCreateIncident({ sessionId, driverId }) {
  const navigate = useNavigate()
  const [incidentType, setIncidentType] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleSubmit = async () => {
    if (!incidentType || description.length < 20) return toast.error('Điền đủ thông tin sự cố và mô tả ≥20 ký tự')
    try {
      setLoading(true)
      await staffApi.createIncident({ sessionId, driverId, incidentType, priority, description })
      toast.success('Báo cáo sự cố thành công!')
      navigate('/staff/dashboard')
    } catch (err) {
      toast.error(err.message || 'Tạo sự cố thất bại')
    } finally { setLoading(false) }
  }

  const handleFileUpload = e => {
    const uploaded = Array.from(e.target.files).map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
      type: f.type.startsWith('image/') ? 'image' : 'pdf',
      previews: f.type.startsWith('image/') ? [URL.createObjectURL(f)] : null
    }))
    setFiles([...files, ...uploaded])
    e.target.value = null
  }

  const handleDeleteFile = id => setFiles(files.filter(f => f.id !== id))

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      <header className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/staff/dashboard')} className="flex items-center gap-2">
          <ChevronLeft /> Quay lại Dashboard
        </button>
        <h1 className="text-2xl font-bold">Tạo Sự Cố Mới</h1>
      </header>
      <div className="flex gap-6 flex-1">
        <div className="flex-[3] space-y-6 bg-white p-6 rounded-xl border">
          <h3 className="flex items-center gap-2 font-bold mb-4"><AlertTriangle /> Thông tin sự cố</h3>
          <select className="w-full mb-4 p-2 border rounded" value={incidentType} onChange={e => setIncidentType(e.target.value)}>
            <option value="">Chọn loại sự cố</option>
            <option>Mất thẻ/Hư hỏng thẻ vãng lai</option>
            <option>Va chạm/Tai nạn trong bãi</option>
            <option>Tranh chấp vị trí đỗ</option>
            <option>Xe hỏng/Cần cứu hộ</option>
            <option>Hư hỏng tài sản bãi đỗ</option>
          </select>
          <select className="w-full mb-4 p-2 border rounded" value={priority} onChange={e => setPriority(e.target.value)}>
            <option>Normal</option>
            <option>High</option>
          </select>
          <textarea rows={4} placeholder="Mô tả chi tiết sự cố ≥20 ký tự" className="w-full p-2 border rounded mb-4"
            value={description} onChange={e => setDescription(e.target.value)}
          />
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
          <div onClick={() => fileInputRef.current?.click()} className="border-dashed border p-4 rounded cursor-pointer mb-4">
            <UploadCloud /> Nhấn để tải lên hoặc kéo thả
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {files.map(f => (
              <div key={f.id} className="border p-2 rounded flex justify-between items-center">
                <span>{f.name}</span>
                <button onClick={() => handleDeleteFile(f.id)}><Trash2 /></button>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded font-bold">
            {loading ? 'Đang gửi...' : 'Gửi Sự cố Ngay'}
          </button>
        </div>
      </div>
    </div>
  )
}