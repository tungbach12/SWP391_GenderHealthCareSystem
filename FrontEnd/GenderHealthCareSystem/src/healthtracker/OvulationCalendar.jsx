import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { menstrualHistoryAPI, updateTrackerAPI } from "../components/api/HeathTracker.api";
import dayjs from "dayjs";

export default function OvulationCalendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [calendar, setCalendar] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [showUpdateBox, setShowUpdateBox] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) return navigate("/login");

      let calendarData = location.state?.calendar;
      if (!calendarData) {
        const res = await menstrualHistoryAPI();
        calendarData = res.data;
      }

      if (!calendarData || !calendarData.days?.length) {
        navigate("/menstrual/tracker");
        return;
      }

      setCalendar(calendarData);

      const monthSet = new Set(
        calendarData.days.map((d) => {
          const [y, m] = d.date.split("-").map(Number);
          return `${y}-${String(m).padStart(2, "0")}`;
        })
      );

      const sortedMonths = Array.from(monthSet).sort(
        (a, b) => new Date(a + "-01") - new Date(b + "-01")
      );
      setAvailableMonths(sortedMonths);

      const lastReal = calendarData.days
        .filter((d) => d.type === "MENSTRUATION" && d.note === "form")
        .map((d) => new Date(d.date))
        .sort((a, b) => b - a)[0];

      const baseDate = lastReal || new Date();
      const key = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}`;
      const [y, m] = key.split("-").map(Number);
      setSelectedYear(y);
      setSelectedMonth(m - 1);
    };

    fetchCalendar();
  }, [location.state, navigate]);

  const getMonthDays = (year, month) => {
    const days = [];
    const last = new Date(year, month + 1, 0);
    for (let i = 1; i <= last.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dateStr: dayjs(date).format("YYYY-MM-DD"),
        weekday: date.getDay(),
      });
    }
    return days;
  };

  const buildCalendarGrid = (year, month) => {
    const days = getMonthDays(year, month);
    const blanks = Array(days[0].weekday).fill(null);
    const grid = [...blanks, ...days];
    while (grid.length < 42) grid.push(null);
    const rows = [];
    for (let i = 0; i < 42; i += 7) {
      rows.push(grid.slice(i, i + 7));
    }
    return rows;
  };

  const getColor = (dateStr) => {
    const match = calendar.days.find((d) => d.date === dateStr);
    if (!match) return "bg-white text-gray-700";
    switch (match.type) {
      case "MENSTRUATION":
        return "bg-red-400 text-white";
      case "HIGH_FERTILITY":
        return "bg-green-500 text-white";
      case "MEDIUM_FERTILITY":
        return "bg-yellow-300 text-black";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleDateClick = (dateStr) => {
    if (!selectedStartDate) {
      setSelectedStartDate(dateStr);
    } else if (!selectedEndDate) {
      if (dayjs(dateStr).isAfter(dayjs(selectedStartDate))) {
        setSelectedEndDate(dateStr);
        setShowUpdateBox(true);
      } else {
        setSelectedStartDate(dateStr);
        setSelectedEndDate(null);
        setShowUpdateBox(false);
      }
    } else {
      setSelectedStartDate(dateStr);
      setSelectedEndDate(null);
      setShowUpdateBox(false);
    }
  };

  const handleUpdateCycle = async () => {
    if (!selectedStartDate || !selectedEndDate) return;

    const periodLength = dayjs(selectedEndDate).diff(dayjs(selectedStartDate), "day") + 1;
    if (periodLength < 2 || periodLength > 12) {
      alert("Độ dài kỳ kinh phải từ 2 đến 12 ngày.");
      return;
    }

    try {
      const res = await updateTrackerAPI({
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        cycleLength: calendar.cycleLength,
        note: "form",
      });

      const updated = {
        ...res.data,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
      };

      navigate("/menstrual/ovulation", { state: { calendar: updated } });
    } catch (err) {
      alert("Lỗi khi cập nhật chu kỳ. Vui lòng thử lại sau.");
    }
  };

  const handlePrev = () => {
    const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    const idx = availableMonths.indexOf(key);
    if (idx > 0) {
      const [y, m] = availableMonths[idx - 1].split("-").map(Number);
      setSelectedYear(y);
      setSelectedMonth(m - 1);
    }
  };

  const handleNext = () => {
    const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    const idx = availableMonths.indexOf(key);
    if (idx < availableMonths.length - 1) {
      const [y, m] = availableMonths[idx + 1].split("-").map(Number);
      setSelectedYear(y);
      setSelectedMonth(m - 1);
    }
  };

  if (!calendar || selectedYear === null || selectedMonth === null) return null;
  const calendarGrid = buildCalendarGrid(selectedYear, selectedMonth);

  const startDate =
    calendar.startDate || location.state?.calendar?.startDate || localStorage.getItem("menstrualStartDate");
  const endDate =
    calendar.endDate || location.state?.calendar?.endDate || localStorage.getItem("menstrualEndDate");
  const cycleLength = calendar.cycleLength || localStorage.getItem("menstrualCycleLength");

  const periodLength = (() => {
    if (!startDate || !endDate) return "-";
    const diff = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
    return diff >= 2 && diff <= 12 ? diff : "-";
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-2">
        Dự đoán chu kỳ - Tháng {selectedMonth + 1}/{selectedYear}
      </h2>

      <div className="mb-6 text-gray-700">
        <p>
          <strong>Ngày bắt đầu:</strong>{" "}
          {startDate ? dayjs(startDate).format("DD/MM/YYYY") : "Không có"}
        </p>
        <p>
          <strong>Độ dài kỳ kinh:</strong> {periodLength} ngày
        </p>
        <p>
          <strong>Độ dài chu kỳ:</strong> {cycleLength} ngày
        </p>
      </div>

      <div className="flex justify-center items-center gap-4 mb-6">
        <button
          onClick={handlePrev}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Tháng trước
        </button>
        <span className="font-medium text-lg">
          Tháng {selectedMonth + 1} / {selectedYear}
        </span>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Tháng sau →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 font-semibold text-center text-sm text-gray-700 mb-2">
        <div>CN</div>
        <div>T2</div>
        <div>T3</div>
        <div>T4</div>
        <div>T5</div>
        <div>T6</div>
        <div>T7</div>
      </div>

      {calendarGrid.map((week, i) => (
        <div key={i} className="grid grid-cols-7 gap-2 mb-2 justify-items-center">
          {week.map((day, j) =>
            day ? (
              <div
                key={j}
                onClick={() => handleDateClick(day.dateStr)}
                className={`cursor-pointer w-16 h-16 flex flex-col items-center justify-center rounded-full shadow text-xs ${getColor(
                  day.dateStr
                )} ${
                  selectedStartDate === day.dateStr || selectedEndDate === day.dateStr
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              >
                <div className="font-bold text-base">{day.date.getDate()}</div>
                <div className="text-[10px] mt-1">
                  {calendar.days.find((d) => d.date === day.dateStr)?.type ===
                  "MENSTRUATION"
                    ? "Kinh nguyệt"
                    : calendar.days.find((d) => d.date === day.dateStr)?.type ===
                      "HIGH_FERTILITY"
                    ? "Thụ thai cao"
                    : calendar.days.find((d) => d.date === day.dateStr)?.type ===
                      "MEDIUM_FERTILITY"
                    ? "Thụ thai TB"
                    : "Thường ngày"}
                </div>
              </div>
            ) : (
              <div key={j} className="w-16 h-16" />
            )
          )}
        </div>
      ))}

      <div className="mt-6 grid grid-cols-2 gap-2 text-sm max-w-sm mx-auto text-left">
        <p>
          <span className="inline-block w-4 h-4 bg-red-400 rounded-full mr-2"></span>
          Kinh nguyệt
        </p>
        <p>
          <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span>
          Thụ thai cao
        </p>
        <p>
          <span className="inline-block w-4 h-4 bg-yellow-300 rounded-full mr-2"></span>
          Thụ thai trung bình
        </p>
        <p>
          <span className="inline-block w-4 h-4 bg-gray-100 rounded-full mr-2"></span>
          Ngày thường
        </p>
      </div>

      {showUpdateBox && (
        <div className="mt-6 text-center bg-blue-50 border border-blue-300 p-4 rounded-lg">
          <p>
            Cập nhật kỳ kinh từ{" "}
            <strong>{dayjs(selectedStartDate).format("DD/MM/YYYY")}</strong> đến{" "}
            <strong>{dayjs(selectedEndDate).format("DD/MM/YYYY")}</strong>?
          </p>
          <button
            onClick={handleUpdateCycle}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Xác nhận cập nhật
          </button>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={() =>
            navigate("/menstrual/tracker", { state: { forceInput: true } })
          }
          className="px-5 py-2 bg-[#0099CF] text-white rounded hover:bg-blue-600"
        >
          ← Nhập kỳ kinh mới
        </button>
      </div>
    </div>
  );
}
