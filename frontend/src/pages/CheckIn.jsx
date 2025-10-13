// ============================================
// src/pages/CheckIn.jsx - Check In Page
// ============================================

import { useState, useEffect } from "react";
import { useAttendanceStore } from "../store/attendanceStore";
import { useGeolocation } from "../hooks/useGeolocation";
import LocationMap from "../components/LocationMap";
// import "../styles/CheckIn.css"; // Removed because file does not exist

export default function CheckIn() {
  const {
    location,
    error: geoError,
    loading: geoLoading,
    getLocation,
  } = useGeolocation();
  const {
    locations,
    todayAttendance,
    loading,
    error,
    getLocations,
    getTodayAttendance,
    checkIn,
    checkOut,
  } = useAttendanceStore();

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getLocations();
    getTodayAttendance();
  }, []);

  const handleCheckIn = async () => {
    if (!location || !selectedLocation) {
      setMessage("Pilih lokasi dan aktifkan lokasi perangkat Anda");
      return;
    }

    try {
      const result = await checkIn(
        location.latitude,
        location.longitude,
        selectedLocation.id
      );
      setMessage("✅ Check-in berhasil!");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      setMessage("Aktifkan lokasi perangkat Anda");
      return;
    }

    try {
      const result = await checkOut(location.latitude, location.longitude);
      setMessage("✅ Check-out berhasil!");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="checkin-container">
      <h1>📍 Check In / Check Out</h1>

      {/* Map */}
      {locations.length > 0 && (
        <LocationMap
          locations={locations}
          userLocation={location}
          onLocationSelect={setSelectedLocation}
        />
      )}

      {/* Status Box */}
      <div className="status-box">
        <h3>Status Hari Ini</h3>
        {todayAttendance ? (
          <div className="attendance-info">
            <p>
              <strong>Lokasi:</strong> {todayAttendance.location?.name}
            </p>
            <p>
              <strong>Check-in:</strong>{" "}
              {todayAttendance.checkInTime
                ? new Date(todayAttendance.checkInTime).toLocaleTimeString(
                    "id-ID"
                  )
                : "Belum check-in"}
            </p>
            <p>
              <strong>Check-out:</strong>{" "}
              {todayAttendance.checkOutTime
                ? new Date(todayAttendance.checkOutTime).toLocaleTimeString(
                    "id-ID"
                  )
                : "Belum check-out"}
            </p>
            <p>
              <strong>Status:</strong> {todayAttendance.status}
            </p>
          </div>
        ) : (
          <p>Belum ada data absensi hari ini</p>
        )}
      </div>

      {/* Location Selection */}
      <div className="location-selection">
        <h3>Pilih Lokasi</h3>
        <div className="location-list">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc)}
              className={`location-btn ${
                selectedLocation?.id === loc.id ? "active" : ""
              }`}
            >
              <div className="location-name">{loc.name}</div>
              <div className="location-address">{loc.address}</div>
              <div className="location-radius">Radius: {loc.radiusMeter}m</div>
            </button>
          ))}
        </div>
      </div>

      {/* Geolocation Info */}
      <div className="geolocation-info">
        <h3>📍 Lokasi Anda</h3>
        {geoError && <div className="error-message">{geoError}</div>}
        {location ? (
          <div className="location-details">
            <p>Latitude: {location.latitude.toFixed(6)}</p>
            <p>Longitude: {location.longitude.toFixed(6)}</p>
            <p>Akurasi: {location.accuracy.toFixed(0)}m</p>
            <button onClick={getLocation} className="btn btn-secondary">
              Perbarui Lokasi
            </button>
          </div>
        ) : (
          <p>Mengambil lokasi...</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={handleCheckIn}
          disabled={loading || !location || !selectedLocation}
          className="btn btn-success"
        >
          {loading ? "Loading..." : "✓ Check In"}
        </button>

        <button
          onClick={handleCheckOut}
          disabled={loading || !location || !todayAttendance?.checkInTime}
          className="btn btn-warning"
        >
          {loading ? "Loading..." : "✗ Check Out"}
        </button>

        <button
          onClick={getLocation}
          disabled={geoLoading}
          className="btn btn-secondary"
        >
          {geoLoading ? "Loading..." : "🔄 Update Location"}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`message ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
