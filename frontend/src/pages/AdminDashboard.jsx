// ============================================
// src/pages/AdminDashboard.jsx
// ============================================

import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../api/axios";
// import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    todayPresent: 0,
    todayAbsent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [usersRes, locationsRes, attendancesRes] = await Promise.all([
        api.get("/users"),
        api.get("/locations"),
        api.get("/attendances?limit=100"),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const todayAttendances = attendancesRes.data.filter(
        (a) => a.date.split("T")[0] === today
      );

      setStats({
        totalUsers: usersRes.data.length,
        totalLocations: locationsRes.data.length,
        todayPresent: todayAttendances.filter((a) => a.status === "PRESENT")
          .length,
        todayAbsent: todayAttendances.filter((a) => a.status === "ABSENT")
          .length,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="admin-container">
        <div className="error-box">
          <h2>Access Denied</h2>
          <p>Anda tidak memiliki akses ke halaman admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1 className="text-gray-900 font-bold text-2xl mb-4">📊 Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>Total Locations</h3>
            <p className="stat-value">{stats.totalLocations}</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Present Today</h3>
            <p className="stat-value">{stats.todayPresent}</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Absent Today</h3>
            <p className="stat-value">{stats.todayAbsent}</p>
          </div>
        </div>
      </div>

      <div className="admin-links">
        <a href="/admin/users" className="admin-link">
          👥 Manage Users
        </a>
        <a href="/admin/locations" className="admin-link">
          📍 Manage Locations
        </a>
        <a href="/admin/attendance-report" className="admin-link">
          📊 Attendance Report
        </a>
      </div>
    </div>
  );
}
