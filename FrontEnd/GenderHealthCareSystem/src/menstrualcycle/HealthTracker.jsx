import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/provider/AuthProvider';
import { healthTrackerAPI } from '../components/utils/api';

export default function HealthTracker() {
  const [selectedFunction, setSelectedFunction] = useState('cycle');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  //const [isAuthenticated] = useAuth();

  const navigate = useNavigate();


  const handleSubmit = async () => {
    if (!startDate) {
      setPopupMessage("Vui lòng chọn ngày bắt đầu kỳ kinh");
      setShowPopup(true);
      return;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + periodLength - 1);

    try {
      setLoading(true);

      const userData =  {
        startDate,
        endDate: endDate.toISOString().split('T')[0],
        cycleLength,
        note: ""
      };

      const res = await healthTrackerAPI(userData);

      navigate("/menstrual-ovulation", { state: { calendar: res.data } });

    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setPopupMessage("Bạn chưa đăng nhập hoặc token không hợp lệ.");
      } else {
        setPopupMessage("Lỗi khi tính toán chu kỳ. Hãy thử lại sau.");
      }
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-6 relative">
      <h2 className="text-2xl font-bold text-center">Chọn chức năng</h2>

      <div className="flex justify-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="cycle"
            checked={selectedFunction === 'cycle'}
            onChange={() => setSelectedFunction('cycle')}
          />
          Quản lí chu kỳ kinh nguyệt
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="pill"
            checked={selectedFunction === 'pill'}
            onChange={() => setSelectedFunction('pill')}
          />
          Biện pháp tránh thai
        </label>
      </div>

      {selectedFunction === 'cycle' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tính Chu Kỳ Kinh Nguyệt</h3>

          <label className="block">
            Ngày bắt đầu kỳ kinh:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full mt-1 border border-gray-300 rounded p-2"
            />
          </label>

          <label className="block">
            Độ dài chu kỳ (21–35 ngày):
            <input
              type="range"
              min="21"
              max="35"
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              className="w-full mt-1"
            />
            <p>{cycleLength} ngày</p>
          </label>

          <label className="block">
            Số ngày hành kinh (2–10 ngày):
            <input
              type="range"
              min="2"
              max="10"
              value={periodLength}
              onChange={(e) => setPeriodLength(Number(e.target.value))}
              className="w-full mt-1"
            />
            <p>{periodLength} ngày</p>
          </label>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#0099CF] hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "Đang tính..." : "Tính ngay"}
          </button>
        </div>
      )}

      {showPopup && (
      <div className="fixed inset-0 bg-[#00000080] backdrop-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center border-t-4 border-blue-500">
            <h3 className="text-xl font-bold text-blue-600 mb-3">Thông báo</h3>
            <p className="text-gray-700 mb-4">{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
