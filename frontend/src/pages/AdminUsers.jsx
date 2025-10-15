// ============================================
// src/pages/AdminUsers.jsx - ENHANCED
// ============================================

import { useState, useEffect } from "react";
import api from "../api/axios";
// import "../styles/AdminPages.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [message, setMessage] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchShifts();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/users?_=${Date.now()}`); // Prevent caching
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setMessage("❌ Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const { data } = await api.get("/shifts");
      setShifts(data);
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    }
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`badge badge-${role === "ADMIN" ? "danger" : "info"}`}>
        {role}
      </span>
    );
  };

  const handleOpenAssignForm = (user) => {
    setSelectedUser(user);
    setSelectedShift(user.shiftId || "");
    setShowAssignForm(true);
  };

  const handleAssignShift = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);

      if (selectedShift) {
        // Assign to shift
        await api.post(`/shifts/${selectedShift}/assign/${selectedUser.id}`);
        setMessage("✅ Shift assigned successfully");
      } else {
        // Unassign from shift - need to find current shift and unassign
        if (selectedUser.shiftId) {
          await api.post(
            `/shifts/${selectedUser.shiftId}/unassign/${selectedUser.id}`
          );
          setMessage("✅ Shift removed successfully");
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay for UX

      await fetchUsers();
      setShowAssignForm(false);
      setSelectedUser(null);
    } catch (error) {
      setMessage(
        "❌ " + (error.response?.data?.error || "Failed to assign shift")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>👥 Manage Users</h1>

      {message && (
        <div
          className={`message ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {/* Assign Shift Form Modal */}
      {showAssignForm && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Assign Shift</h2>
            <p className="modal-subtitle">User: {selectedUser.name}</p>

            <div className="form-group">
              <label>Select Shift</label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="form-select"
              >
                <option value="">-- No Shift (Unassign) --</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime} - {shift.endTime})
                  </option>
                ))}
              </select>
            </div>

            {selectedShift &&
              shifts.find((s) => s.id === parseInt(selectedShift)) && (
                <div className="shift-preview">
                  <h4>📋 Shift Details</h4>
                  {(() => {
                    const shift = shifts.find(
                      (s) => s.id === parseInt(selectedShift)
                    );
                    return (
                      <div className="preview-info">
                        <p>
                          <strong>Shift:</strong> {shift.name}
                        </p>
                        <p>
                          <strong>Hours:</strong> {shift.startTime} -{" "}
                          {shift.endTime}
                        </p>
                        <p>
                          <strong>Late Tolerance:</strong>{" "}
                          {shift.lateToleranceMinutes} min
                        </p>
                        <p>
                          <strong>Locations:</strong>{" "}
                          {shift.shiftLocations?.length || 0}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

            <div className="modal-actions">
              <button
                onClick={handleAssignShift}
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? "Loading..." : "Confirm Assignment"}
              </button>
              <button
                onClick={() => {
                  setShowAssignForm(false);
                  setSelectedUser(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Shift Assigned</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading">
                  Loading...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user, idx) => (
                <tr key={user.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{user.name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    {user.shift ? (
                      <span className="shift-badge">
                        {user.shift.name}
                        <br />
                        <small>
                          {user.shift.startTime} - {user.shift.endTime}
                        </small>
                      </span>
                    ) : (
                      <span className="no-shift">Not Assigned</span>
                    )}
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenAssignForm(user)}
                      className="btn btn-sm btn-primary"
                    >
                      {user.shift ? "Change Shift" : "Assign Shift"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Statistics */}
      <div className="user-stats">
        <h3>📊 User Statistics</h3>
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
          <div className="stat">
            <span>With Shift:</span>
            <strong>{users.filter((u) => u.shift).length}</strong>
          </div>
          <div className="stat">
            <span>Without Shift:</span>
            <strong>{users.filter((u) => !u.shift).length}</strong>
          </div>
        </div>
      </div>

      {/* Shift Summary */}
      {shifts.length > 0 && (
        <div className="shift-summary">
          <h3>⏰ Shift Summary</h3>
          <div className="shift-cards">
            {shifts.map((shift) => (
              <div key={shift.id} className="shift-card">
                <h4>{shift.name}</h4>
                <p>
                  <strong>Hours:</strong> {shift.startTime} - {shift.endTime}
                </p>
                <p>
                  <strong>Employees:</strong> {shift.employees?.length || 0}
                </p>
                <p>
                  <strong>Locations:</strong>{" "}
                  {shift.shiftLocations?.length || 0}
                </p>
                {shift.employees && shift.employees.length > 0 && (
                  <div className="shift-employees-list">
                    <strong>Team:</strong>
                    <ul>
                      {shift.employees.map((emp) => (
                        <li key={emp.id}>{emp.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
