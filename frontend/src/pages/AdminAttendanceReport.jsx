// ============================================
// src/pages/AdminAttendanceReport.jsx
// ============================================

import { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../api/axios";
// import "../styles/AdminPages.css";

export default function AdminAttendanceReport() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
    userId: "",
  });

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;
      if (filter.userId) params.userId = filter.userId;

      const { data } = await api.get("/attendances", { params });
      setAttendances(data);
    } catch (error) {
      console.error("Failed to fetch attendances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchAttendances();
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

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Employee",
      "Location",
      "Check-in",
      "Check-out",
      "Status",
    ];
    const rows = attendances.map((a) => [
      format(new Date(a.date), "yyyy-MM-dd"),
      a.user?.name || "-",
      a.location?.name || "-",
      a.checkInTime ? format(new Date(a.checkInTime), "HH:mm:ss") : "-",
      a.checkOutTime ? format(new Date(a.checkOutTime), "HH:mm:ss") : "-",
      a.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="admin-page">
      <h1>📊 Attendance Report</h1>

      <div className="filter-section">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) =>
              setFilter({ ...filter, startDate: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
          />
        </div>

        <div className="filter-actions">
          <button onClick={handleFilter} className="btn btn-primary">
            Filter
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary">
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Email</th>
              <th>Location</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading">
                  Loading...
                </td>
              </tr>
            ) : attendances.length > 0 ? (
              attendances.map((a) => (
                <tr key={a.id}>
                  <td>{format(new Date(a.date), "dd MMM yyyy")}</td>
                  <td>{a.user?.name || "-"}</td>
                  <td>{a.user?.email || "-"}</td>
                  <td>{a.location?.name || "-"}</td>
                  <td>
                    {a.checkInTime
                      ? format(new Date(a.checkInTime), "HH:mm:ss")
                      : "-"}
                  </td>
                  <td>
                    {a.checkOutTime
                      ? format(new Date(a.checkOutTime), "HH:mm:ss")
                      : "-"}
                  </td>
                  <td>{getStatusBadge(a.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="report-summary">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Total Records:</span>
            <strong>{attendances.length}</strong>
          </div>
          <div className="summary-item">
            <span>Present:</span>
            <strong className="success">
              {attendances.filter((a) => a.status === "PRESENT").length}
            </strong>
          </div>
          <div className="summary-item">
            <span>Absent:</span>
            <strong className="danger">
              {attendances.filter((a) => a.status === "ABSENT").length}
            </strong>
          </div>
          <div className="summary-item">
            <span>Late:</span>
            <strong className="warning">
              {attendances.filter((a) => a.status === "LATE").length}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
