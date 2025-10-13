// ============================================
// src/pages/AdminLocations.jsx
// ============================================

import { useState, useEffect } from "react";
import api from "../api/axios";
// import "../styles/AdminPages.css";

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radiusMeter: 100,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/locations");
      setLocations(data);
    } catch (error) {
      setMessage("❌ Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "radiusMeter" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/locations/${editingId}`, formData);
        setMessage("✅ Location updated successfully");
      } else {
        await api.post("/locations", formData);
        setMessage("✅ Location created successfully");
      }
      fetchLocations();
      setFormData({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        radiusMeter: 100,
      });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      setMessage(
        "❌ " + (error.response?.data?.error || "Failed to save location")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location) => {
    setFormData(location);
    setEditingId(location.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus lokasi ini?"))
      return;

    try {
      setLoading(true);
      await api.delete(`/locations/${id}`);
      setMessage("✅ Location deleted successfully");
      fetchLocations();
    } catch (error) {
      setMessage("❌ Failed to delete location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>📍 Manage Locations</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        className="btn btn-primary"
      >
        {showForm ? "Cancel" : "Add Location"}
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
          <h2>{editingId ? "Edit Location" : "Add New Location"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Location Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Domino's Pizza Jakarta"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Jl. Sudirman No. 123"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                  placeholder="-6.2088"
                />
              </div>

              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                  placeholder="106.8456"
                />
              </div>

              <div className="form-group">
                <label>Radius (meters)</label>
                <input
                  type="number"
                  name="radiusMeter"
                  value={formData.radiusMeter}
                  onChange={handleInputChange}
                  required
                  placeholder="100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? "Loading..." : "Save Location"}
            </button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Address</th>
              <th>Coordinates</th>
              <th>Radius</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length > 0 ? (
              locations.map((loc, idx) => (
                <tr key={loc.id}>
                  <td>{idx + 1}</td>
                  <td>{loc.name}</td>
                  <td>{loc.address}</td>
                  <td>
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </td>
                  <td>{loc.radiusMeter}m</td>
                  <td>
                    <button
                      onClick={() => handleEdit(loc)}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No locations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
