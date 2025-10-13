// ============================================
// src/pages/Dashboard.jsx
// ============================================

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useAttendanceStore } from "../store/attendanceStore";
import { useNavigate } from "react-router-dom";
// import "../styles/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { todayAttendance, getTodayAttendance } = useAttendanceStore();
  const [stats, setStats] = useState({
    isCheckedIn: false,
    isCheckedOut: false,
    checkInTime: null,
    checkOutTime: null,
  });

  useEffect(() => {
    getTodayAttendance();
  }, []);

  useEffect(() => {
    if (todayAttendance) {
      setStats({
        isCheckedIn: !!todayAttendance.checkInTime,
        isCheckedOut: !!todayAttendance.checkOutTime,
        checkInTime: todayAttendance.checkInTime,
        checkOutTime: todayAttendance.checkOutTime,
      });
    }
  }, [todayAttendance]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🍕 Domino's Pizza - Attendance System</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Status Card */}
        <div className="card status-card">
          <h2>Status Hari Ini</h2>
          <div className="status-indicator">
            <div
              className={`status-light ${
                stats.isCheckedIn ? "checked-in" : "unchecked"
              }`}
            ></div>
            <div>
              <p className="status-label">
                {stats.isCheckedIn ? "✅ Sudah Check-in" : "⏳ Belum Check-in"}
              </p>
              {stats.checkInTime && (
                <p className="status-time">
                  {new Date(stats.checkInTime).toLocaleTimeString("id-ID")}
                </p>
              )}
            </div>
          </div>

          <div className="status-indicator">
            <div
              className={`status-light ${
                stats.isCheckedOut ? "checked-out" : "unchecked"
              }`}
            ></div>
            <div>
              <p className="status-label">
                {stats.isCheckedOut
                  ? "✅ Sudah Check-out"
                  : "⏳ Belum Check-out"}
              </p>
              {stats.checkOutTime && (
                <p className="status-time">
                  {new Date(stats.checkOutTime).toLocaleTimeString("id-ID")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card actions-card">
          <h2>Aksi Cepat</h2>
          <button
            onClick={() => navigate("/check-in")}
            className="btn btn-primary btn-large"
          >
            📍 Check-in / Check-out
          </button>
          <button
            onClick={() => navigate("/history")}
            className="btn btn-secondary btn-large"
          >
            📋 Riwayat Absensi
          </button>
        </div>

        {/* User Info */}
        <div className="card info-card">
          <h2>Informasi Profil</h2>
          <div className="info-row">
            <span className="label">Nama:</span>
            <span className="value">{user?.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Role:</span>
            <span
              className={`badge badge-${
                user?.role === "ADMIN" ? "danger" : "info"
              }`}
            >
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
