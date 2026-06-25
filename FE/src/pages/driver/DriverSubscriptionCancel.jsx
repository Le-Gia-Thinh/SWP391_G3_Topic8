/**
 * FILE: DriverSubscriptionCancel.jsx
 * MÔ TẢ: Trang Hủy gia hạn Gói hội viên dành cho Driver.
 * Hiển thị xác nhận việc hủy tự động gia hạn gói cước, thông báo các quyền lợi sẽ mất,
 * và thu thập lý do hủy (nếu có).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const DriverSubscriptionCancel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleCancel = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Hủy gia hạn thành công. Bạn vẫn có thể sử dụng gói đến hết chu kỳ.');
      navigate('/driver/subscription', { state: { activeTab: 'status' } });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/driver/subscription', { state: { activeTab: 'status' } })}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại Gói của tôi</span>
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Bạn muốn hủy gia hạn?</h1>
            <p className="text-slate-500">
              Gói hội viên của bạn sẽ không tự động gia hạn vào chu kỳ tiếp theo (15/12/2026). 
              Bạn vẫn có thể tiếp tục tận hưởng các đặc quyền cho đến ngày này.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <h3 className="font-bold text-amber-800 mb-2">Quyền lợi sẽ bị mất sau khi hết hạn:</h3>
            <ul className="text-amber-700 text-sm space-y-1 ml-4 list-disc">
              <li>Mất đặc quyền đỗ xe không giới hạn hoặc số lượt đỗ miễn phí.</li>
              <li>Không còn ưu đãi giảm giá phí đỗ xe các lượt tiếp theo.</li>
              <li>Mất vị trí đỗ xe VIP cố định (nếu có).</li>
            </ul>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Lý do bạn muốn hủy (Không bắt buộc)
            </label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Chia sẻ lý do để chúng tôi cải thiện dịch vụ..."
            ></textarea>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/driver/subscription', { state: { activeTab: 'status' } })}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Giữ Lại Gói
            </button>
            <button 
              onClick={handleCancel}
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${
                loading ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Xác Nhận Hủy Gia Hạn
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSubscriptionCancel;
