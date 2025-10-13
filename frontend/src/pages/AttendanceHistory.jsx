// ============================================
// src/pages/AttendanceHistory.jsx
// ============================================

import { useState, useEffect } from "react";
import { useAttendanceStore } from "../store/attendanceStore";
import { format } from "date-fns";
// import "../styles/History.css";

export default function AttendanceHistory() {
  const { attendanceHistory, loading, getAttendanceHistory } =
    useAttendanceStore();
  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    getAttendanceHistory(30);
  }, []);

  const handleFilter = () => {
    getAttendanceHistory(30, filter.startDate, filter.endDate);
  };

  const getStatusBadge = (status) => {
    const statusClass = {
      PRESENT: "badge-success",
      ABSENT: "badge-danger",
      LATE: "badge-warning",
      LEAVE: "badge-info",
    };
    return (
      <span className={`badge ${statusClass[status] || "badge-secondary"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="history-container">
      <h1>📋 Riwayat Absensi</h1>

      {/* Filter */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Dari Tanggal</label>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) =>
              setFilter({ ...filter, startDate: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label>Sampai Tanggal</label>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
          />
        </div>

        <button onClick={handleFilter} className="btn btn-primary">
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Lokasi</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="loading">
                  Loading...
                </td>
              </tr>
            ) : attendanceHistory.length > 0 ? (
              attendanceHistory.map((attendance) => (
                <tr key={attendance.id}>
                  <td>{format(new Date(attendance.date), "dd MMM yyyy")}</td>
                  <td>{attendance.location?.name || "-"}</td>
                  <td>
                    {attendance.checkInTime
                      ? format(new Date(attendance.checkInTime), "HH:mm:ss")
                      : "-"}
                  </td>
                  <td>
                    {attendance.checkOutTime
                      ? format(new Date(attendance.checkOutTime), "HH:mm:ss")
                      : "-"}
                  </td>
                  <td>{getStatusBadge(attendance.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
