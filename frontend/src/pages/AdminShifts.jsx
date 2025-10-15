// ============================================
// src/pages/AdminShifts.jsx
// ============================================

import { useState, useEffect } from "react";
import api from "../api/axios";
// import "../styles/AdminPages.css";

export default function AdminShifts() {
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [message, setMessage] = useState("");
  const [formTab, setFormTab] = useState("basic"); // "basic", "locations", "employees"

  const [formData, setFormData] = useState({
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    lateToleranceMinutes: 30,
    earlyOutToleranceMinutes: 30,
    isActive: true,
  });

  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  useEffect(() => {
    fetchShifts();
    fetchLocations();
    fetchUsers();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/shifts");
      setShifts(data);
    } catch (error) {
      setMessage("❌ Failed to fetch shifts");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data } = await api.get("/locations");
      setLocations(data);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get(`/users?_=${Date.now()}`); // Prevent caching
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue;
    if (type === "checkbox") {
      finalValue = checked;
    } else if (
      name === "lateToleranceMinutes" ||
      name === "earlyOutToleranceMinutes"
    ) {
      finalValue = parseInt(value) || 0;
    } else {
      finalValue = value;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // strip extra fields
      const cleanData = {
        name: formData.name.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        lateToleranceMinutes: parseInt(formData.lateToleranceMinutes || 30),
        earlyOutToleranceMinutes: parseInt(formData.earlyOutToleranceMinutes || 30),
        isActive: formData.isActive,
      };
      console.log("Submitting shift data:", cleanData);

      if (editingId) {
        const response = await api.put(`/shifts/${editingId}`, cleanData);
        console.log("Backend response:", response.data); // ← Debug log
        setMessage("✅ Shift updated successfully");
      } else {
        await api.post("/shifts", cleanData);
        setMessage("✅ Shift created successfully");
      }

      fetchShifts();
      setFormData({
        name: "",
        startTime: "08:00",
        endTime: "17:00",
        lateToleranceMinutes: 30,
        earlyOutToleranceMinutes: 30,
        isActive: true,
      });
      setShowForm(false);
      setEditingId(null);
      setFormTab("basic");
    } catch (error) {
      console.error("Full error:", error); // ← Debug log
      console.error("Error response:", error.response); // ← Debug log
      setMessage(
        "❌ " + (error.response?.data?.error || "Failed to save shift")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (shift) => {
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      lateToleranceMinutes: shift.lateToleranceMinutes,
      earlyOutToleranceMinutes: shift.earlyOutToleranceMinutes,
      isActive: shift.isActive,
    });
    setEditingId(shift.id);
    setShowForm(true);
    setFormTab("basic");

    // Fetch shift details
    try {
      const { data } = await api.get(`/shifts/${shift.id}`);
      const locIds = data.shiftLocations.map((sl) => sl.location.id);
      const empIds = data.employees.map((emp) => emp.id);
      setSelectedLocations(locIds);
      setSelectedEmployees(empIds);
    } catch (error) {
      console.error("Failed to fetch shift details:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus shift ini?")) return;

    try {
      setLoading(true);
      await api.delete(`/shifts/${id}`);
      setMessage("✅ Shift deleted successfully");
      fetchShifts();
    } catch (error) {
      setMessage("❌ Failed to delete shift");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocationToShift = async (locationId) => {
    try {
      if (!editingId) {
        setMessage("❌ Save shift first before adding locations");
        return;
      }

      await api.post(`/shifts/${editingId}/locations/${locationId}`);
      setMessage("✅ Location added to shift");
      setSelectedLocations([...selectedLocations, locationId]);

      // Refresh shift
      const { data } = await api.get(`/shifts/${editingId}`);
      const locIds = data.shiftLocations.map((sl) => sl.location.id);
      setSelectedLocations(locIds);
    } catch (error) {
      setMessage(
        "❌ " + (error.response?.data?.error || "Failed to add location")
      );
    }
  };

  const handleRemoveLocationFromShift = async (locationId) => {
    try {
      if (!editingId) return;

      await api.delete(`/shifts/${editingId}/locations/${locationId}`);
      setMessage("✅ Location removed from shift");
      setSelectedLocations(selectedLocations.filter((id) => id !== locationId));
    } catch (error) {
      setMessage("❌ Failed to remove location");
    }
  };

  const handleAssignEmployee = async (userId) => {
    try {
      if (!editingId) {
        setMessage("❌ Save shift first before assigning employees");
        return;
      }

      await api.post(`/shifts/${editingId}/assign/${userId}`);
      setMessage("✅ Employee assigned to shift");
      fetchShifts();
      fetchUsers();

      const { data } = await api.get(`/shifts/${editingId}`);
      const empIds = data.employees.map((emp) => emp.id);
      setSelectedEmployees(empIds);
    } catch (error) {
      setMessage(
        "❌ " + (error.response?.data?.error || "Failed to assign employee")
      );
    }
  };

  const handleUnassignEmployee = async (userId) => {
    try {
      if (!editingId) return;

      await api.post(`/shifts/${editingId}/unassign/${userId}`);
      setMessage("✅ Employee unassigned from shift");
      fetchShifts();
      fetchUsers();
      setSelectedEmployees(selectedEmployees.filter((id) => id !== userId));
    } catch (error) {
      setMessage("❌ Failed to unassign employee");
    }
  };

  return (
    <div className="admin-page">
      <h1>⏰ Manage Shifts</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        className="btn btn-primary"
      >
        {showForm ? "Cancel" : "Add Shift"}
      </button>

      {message && (
        <div
          className={`message ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? "Edit Shift" : "Add New Shift"}</h2>

          <div className="form-tabs">
            <button
              className={`tab-btn ${formTab === "basic" ? "active" : ""}`}
              onClick={() => setFormTab("basic")}
            >
              Basic Info
            </button>
            {editingId && (
              <>
                <button
                  className={`tab-btn ${
                    formTab === "locations" ? "active" : ""
                  }`}
                  onClick={() => setFormTab("locations")}
                >
                  Locations
                </button>
                <button
                  className={`tab-btn ${
                    formTab === "employees" ? "active" : ""
                  }`}
                  onClick={() => setFormTab("employees")}
                >
                  Employees
                </button>
              </>
            )}
          </div>

          {formTab === "basic" && (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Shift Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Shift 1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time (HH:mm)</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time (HH:mm)</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Late Tolerance (minutes)</label>
                  <input
                    type="number"
                    name="lateToleranceMinutes"
                    value={formData.lateToleranceMinutes}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="30"
                  />
                  <small>Batas telat check-in setelah shift dimulai</small>
                </div>

                <div className="form-group">
                  <label>Early Out Tolerance (minutes)</label>
                  <input
                    type="number"
                    name="earlyOutToleranceMinutes"
                    value={formData.earlyOutToleranceMinutes}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="30"
                  />
                  <small>Batas pulang cepat sebelum shift berakhir</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? "Loading..." : "Save Shift"}
              </button>
            </form>
          )}

          {formTab === "locations" && editingId && (
            <div className="shift-locations">
              <h3>Assign Locations to Shift</h3>
              <div className="location-grid">
                {locations.map((loc) => (
                  <div key={loc.id} className="location-card">
                    <div className="location-info">
                      <strong>{loc.name}</strong>
                      <small>{loc.address}</small>
                    </div>
                    <button
                      onClick={() =>
                        selectedLocations.includes(loc.id)
                          ? handleRemoveLocationFromShift(loc.id)
                          : handleAddLocationToShift(loc.id)
                      }
                      className={`btn btn-sm ${
                        selectedLocations.includes(loc.id)
                          ? "btn-danger"
                          : "btn-success"
                      }`}
                    >
                      {selectedLocations.includes(loc.id) ? "Remove" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formTab === "employees" && editingId && (
            <div className="shift-employees">
              <h3>Assign Employees to Shift</h3>
              <div className="employee-list">
                {users
                  .filter((u) => u.role === "EMPLOYEE")
                  .map((emp) => (
                    <div key={emp.id} className="employee-item">
                      <div className="employee-info">
                        <strong>{emp.name}</strong>
                        <small>{emp.email}</small>
                      </div>
                      <button
                        onClick={() =>
                          selectedEmployees.includes(emp.id)
                            ? handleUnassignEmployee(emp.id)
                            : handleAssignEmployee(emp.id)
                        }
                        className={`btn btn-sm ${
                          selectedEmployees.includes(emp.id)
                            ? "btn-danger"
                            : "btn-success"
                        }`}
                      >
                        {selectedEmployees.includes(emp.id)
                          ? "Unassign"
                          : "Assign"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Shift Name</th>
              <th>Time</th>
              <th>Late Tolerance</th>
              <th>Employees</th>
              <th>Locations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading">
                  Loading...
                </td>
              </tr>
            ) : shifts.length > 0 ? (
              shifts.map((shift, idx) => (
                <tr key={shift.id}>
                  <td>{idx + 1}</td>
                  <td>{shift.name}</td>
                  <td>
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td>{shift.lateToleranceMinutes} min</td>
                  <td>{shift.employees?.length || 0}</td>
                  <td>{shift.shiftLocations?.length || 0}</td>
                  <td>
                    <span
                      className={`badge ${
                        shift.isActive ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {shift.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(shift)}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  No shifts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
