import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { message } from 'antd';
import { getAllPillSchedules, markPillTaken } from '../components/api/Pill.api';
import axios from 'axios';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function PillScheduleCalendar() {
  const navigate = useNavigate();
  const [updatedSchedule, setUpdatedSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [takenCount, setTakenCount] = useState(0);
  const [notTakenCount, setNotTakenCount] = useState(0);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await getAllPillSchedules();
      const data = res?.data ?? [];

      const startDateStr = localStorage.getItem('pillStartDate');
      const pillType = parseInt(localStorage.getItem('pillType') || '28', 10);
      const startDate = startDateStr ? dayjs(startDateStr) : null;

      if (!startDate || !startDate.isValid()) {
        message.error('Không tìm thấy ngày bắt đầu.');
        setLoading(false);
        return;
      }

      const map = {};
      data.forEach(item => {
        const dateStr = dayjs(item.pillDate).format('YYYY-MM-DD');
        map[dateStr] = item;
      });

      const validDates = [];
      let currentDate = startDate;
      let counted = 0;

      while (counted < pillType) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        const item = map[dateStr] || {
          pillDate: dateStr,
          hasTaken: null,
          isPlacebo: false,
          scheduleId: null,
        };

        validDates.push({ ...item, dateStr });

        counted++;
        currentDate = currentDate.add(1, 'day');
      }

      const todayStr = dayjs().format('YYYY-MM-DD');

      const autoMarkPromises = [];
      validDates.forEach(item => {
        const isPast = dayjs(item.dateStr).isBefore(todayStr);
        if (isPast && item.hasTaken == null && item.scheduleId) {
          autoMarkPromises.push(markPillTaken(item.scheduleId, true));
          item.hasTaken = true;
        }
      });

      if (autoMarkPromises.length > 0) {
        await Promise.all(autoMarkPromises);
        const updated = await getAllPillSchedules();
        updated?.data?.forEach(item => {
          const dateStr = dayjs(item.pillDate).format('YYYY-MM-DD');
          map[dateStr] = item;
        });
      }

      const taken = validDates.filter(i => i.hasTaken === true).length;
      const notTaken = pillType - taken;

      const finalMap = {};
      validDates.forEach(item => {
        finalMap[item.dateStr] = map[item.dateStr] || item;
      });

      setUpdatedSchedule(finalMap);
      setTakenCount(taken);
      setNotTakenCount(notTaken);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải lịch uống thuốc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const getMonthDates = () => {
    const today = dayjs();
    const startOfMonth = today.startOf('month');
    const endOfMonth = today.endOf('month');
    const days = [];
    for (let date = startOfMonth; date.isSameOrBefore(endOfMonth); date = date.add(1, 'day')) {
      days.push(date);
    }
    return days;
  };

  const handleToggleCheck = async (dateStr) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      message.error('Bạn chưa đăng nhập.');
      return;
    }

    const clickedDate = dayjs(dateStr);
    if (clickedDate.isAfter(dayjs(), 'day')) {
      message.warning('Bạn đang đánh dấu cho ngày tương lai!');
    }

    const item = updatedSchedule[dateStr];

    try {
      if (!item || !item.scheduleId) {
        await axios.post(
          '/api/pills',
          {
            pillType: '28',
            startDate: dateStr,
            timeOfDay: '08:00:00',
            isActive: true,
            notificationFrequency: 'DAILY'
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        message.success('Đã tạo thuốc mới.');
      } else {
        const newValue = !item.hasTaken;
        await markPillTaken(item.scheduleId, newValue);
        message.success('Đã cập nhật trạng thái.');
      }

      await fetchSchedule();
    } catch (err) {
      console.error('Lỗi cập nhật:', err?.response?.data || err.message);
      message.error('Không thể cập nhật.');
    }
  };

  const daysInMonth = getMonthDates();
  const startDay = daysInMonth[0].day();
  const totalSlots = 42;
  const calendarDays = [];

  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  daysInMonth.forEach(date => {
    calendarDays.push(date);
  });

  while (calendarDays.length < totalSlots) {
    calendarDays.push(null);
  }

  const calendarRows = [];
  for (let i = 0; i < totalSlots; i += 7) {
    const row = calendarDays.slice(i, i + 7);
    calendarRows.push(
      <tr key={`row-${i}`}>
        {row.map((date, index) => {
          if (!date) {
            return <td key={`empty-${i}-${index}`} className="p-2"></td>;
          }

          const dateStr = date.format('YYYY-MM-DD');
          const item = updatedSchedule[dateStr];
          const hasTaken = item?.hasTaken ?? false;
          const isToday = dayjs().format('YYYY-MM-DD') === dateStr;
          const isFuture = date.isAfter(dayjs());

          return (
            <td key={dateStr} className="p-2 text-center">
              {item ? (
                <button
                  onClick={() => handleToggleCheck(dateStr)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition
                    ${hasTaken ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isFuture ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}
                  `}
                  disabled={isFuture}
                >
                  {date.date()}
                </button>
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-gray-300">
                  {date.date()}
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  }

  const startDateStr = localStorage.getItem('pillStartDate');
  const pillType = parseInt(localStorage.getItem('pillType') || '28', 10);

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold text-center mb-2">
        Lịch uống thuốc
      </h2>
      {startDateStr && (
        <p className="text-center text-gray-600 text-sm mb-4">
          Ngày bắt đầu: <strong>{dayjs(startDateStr).format('DD/MM/YYYY')}</strong>
        </p>
      )}

      {loading ? (
        <p className="text-center">Đang tải...</p>
      ) : (
        <>
          <table className="w-full table-fixed border-separate border-spacing-1">
            <thead>
              <tr className="text-gray-700 font-medium text-sm">
                <th>CN</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th>
              </tr>
            </thead>
            <tbody>{calendarRows}</tbody>
          </table>

          <div className="mt-4 text-center text-sm text-gray-700">
            <p>Đã uống: <strong>{takenCount}</strong> viên</p>
            <p>Chưa uống: <strong>{notTakenCount}</strong> viên</p>
          </div>

          {/* ✅ Đợi 7 ngày sau viên thứ 21 */}
          {(() => {
            const activePillCount = pillType === 28 ? 21 : pillType;
            const datesTaken = Object.entries(updatedSchedule)
              .filter(([_, item]) => item?.hasTaken === true)
              .map(([dateStr]) => dayjs(dateStr))
              .sort((a, b) => a - b);

            if (datesTaken.length >= activePillCount) {
              const lastTakenDate = datesTaken[activePillCount - 1];
              const canStartNew = dayjs().isSameOrAfter(lastTakenDate.add(7, 'day'), 'day');

              if (canStartNew) {
                return (
                  <div className="text-center p-4 bg-green-100 border border-green-300 rounded mt-4">
                    🎉 Bạn đã hoàn thành đợt uống thuốc này. Hãy bắt đầu đợt mới nếu cần!
                    <button
                      onClick={() => {
                        localStorage.removeItem('pillStartDate');
                        localStorage.removeItem('pillType');
                        navigate('/pill/tracker');
                      }}
                      className="ml-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Nhập lịch mới
                    </button>
                  </div>
                );
              } else {
                const waitUntil = lastTakenDate.add(7, 'day').format('DD/MM/YYYY');
                return (
                  <div className="text-center p-4 bg-yellow-100 border border-yellow-300 rounded mt-4">
                    ⏳ Bạn cần đợi đến <strong>{waitUntil}</strong> để bắt đầu đợt uống thuốc mới.
                  </div>
                );
              }
            }

            return null;
          })()}

          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => {
                localStorage.removeItem('pillStartDate');
                localStorage.removeItem('pillType');
                navigate('/pill/tracker');
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Nhập lại lịch mới
            </button>
          </div>
        </>
      )}
    </div>
  );
}
