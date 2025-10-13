// ============================================
// src/pages/AdminUsers.jsx
// ============================================

import { useState, useEffect } from "react";
import api from "../api/axios";
// import "../styles/AdminPages.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`badge badge-${role === "ADMIN" ? "danger" : "info"}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="admin-page">
      <h1>👥 Manage Users</h1>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="loading">
                  Loading...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user, idx) => (
                <tr key={user.id}>
                  <td>{idx + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString("id-ID")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="user-stats">
        <h3>User Statistics</h3>
        <div className="stats-summary">
          <div className="stat">
            <span>Total Users:</span>
            <strong>{users.length}</strong>
          </div>
          <div className="stat">
            <span>Admins:</span>
            <strong>{users.filter((u) => u.role === "ADMIN").length}</strong>
          </div>
          <div className="stat">
            <span>Employees:</span>
            <strong>{users.filter((u) => u.role === "EMPLOYEE").length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}