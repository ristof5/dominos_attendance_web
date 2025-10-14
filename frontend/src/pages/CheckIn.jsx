// ============================================
// src/pages/CheckIn.jsx - UPDATED
// ============================================

import { useState, useEffect } from "react";
import { useAttendanceStore } from "../store/attendanceStore";
import { useGeolocation } from "../hooks/useGeolocation";
import LocationMap from "../components/LocationMap";
// import "../styles/CheckIn.css";
import "../styles/Shifts.css";

export default function CheckIn() {
  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();
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
  const [shiftInfo, setShiftInfo] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState(null);

  useEffect(() => {
    getLocations();
    getTodayAttendance();
  }, []);

  useEffect(() => {
    if (todayAttendance?.shift) {
      setShiftInfo(todayAttendance.shift);
      calculateCheckInStatus();
    }
  }, [todayAttendance]);

  const calculateCheckInStatus = () => {
    if (!todayAttendance?.shift) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHours}:${currentMinutes}`;

    const [shiftHour, shiftMin] = todayAttendance.shift.startTime
      .split(":")
      .map(Number);
    const shiftMinutes = shiftHour * 60 + shiftMin;

    const [currentHour, currentMin] = currentTime.split(":").map(Number);
    const nowMinutes = currentHour * 60 + currentMin;

    const lateBoundary = shiftMinutes + todayAttendance.shift.lateToleranceMinutes;

    let status = "EARLY";
    if (nowMinutes >= shiftMinutes && nowMinutes <= lateBoundary) {
      status = "PRESENT";
    } else if (nowMinutes > lateBoundary) {
      status = "LATE";
    }

    setCheckInStatus({
      status,
      currentTime,
      shiftStartTime: todayAttendance.shift.startTime,
      lateBoundary: `${String(Math.floor(lateBoundary / 60)).padStart(2, "0")}:${String(
        lateBoundary % 60
      ).padStart(2, "0")}`,
      minutesUntilLate: Math.max(0, lateBoundary - nowMinutes),
    });
  };

  // Update status setiap menit
  useEffect(() => {
    const interval = setInterval(() => {
      calculateCheckInStatus();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [todayAttendance]);

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
      setMessage(`✅ Check-in berhasil! Status: ${result.checkInInfo.status}`);
      getTodayAttendance();
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
      setMessage(`✅ Check-out berhasil! Status: ${result.checkOutInfo.status}`);
      getTodayAttendance();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="checkin-container">
      <h1>📍 Check In / Check Out</h1>

      {/* Shift Timing Info */}
      {shiftInfo && checkInStatus && (
        <div className="check-in-shift-info">
          <h3>⏰ Shift Information</h3>
          <div className="shift-timing-info">
            <div className="timing-item">
              <div className="timing-label">Current Time</div>
              <div className="timing-value">{checkInStatus.currentTime}</div>
            </div>
            <div className="timing-item">
              <div className="timing-label">Shift Start</div>
              <div className="timing-value">{checkInStatus.shiftStartTime}</div>
            </div>
            <div className="timing-item">
              <div className="timing-label">Latest Check-in</div>
              <div className="timing-value">{checkInStatus.lateBoundary}</div>
              <div className="timing-sublabel">
                ({shiftInfo.lateToleranceMinutes} min grace period)
              </div>
            </div>
            <div className="timing-item">
              <div className="timing-label">Time Until Late</div>
              <div className="timing-value" style={{ color: "#ffc107" }}>
                {checkInStatus.minutesUntilLate} min
              </div>
            </div>
          </div>

          <div className="check-in-status-box">
            <span className={`status-indicator ${checkInStatus.status.toLowerCase()}`}></span>
            <strong>Current Status: {checkInStatus.status}</strong>
            <div className="check-in-countdown">
              {checkInStatus.status === "EARLY" && (
                <>🟡 Anda terlalu awal, silakan tunggu shift dimulai</>
              )}
              {checkInStatus.status === "PRESENT" && (
                <>🟢 Anda tepat waktu! Silakan check-in sekarang</>
              )}
              {checkInStatus.status === "LATE" && (
                <>🔴 Anda TERLAMBAT! Jatah tolerance sudah habis</>
              )}
            </div>
          </div>
        </div>
      )}

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
              <strong>Shift:</strong> {todayAttendance.shift?.name}
            </p>
            <p>
              <strong>Check-in:</strong>{" "}
              {todayAttendance.checkInTime
                ? new Date(todayAttendance.checkInTime).toLocaleTimeString("id-ID")
                : "Belum check-in"}
            </p>
            <p>
              <strong>Check-out:</strong>{" "}
              {todayAttendance.checkOutTime
                ? new Date(todayAttendance.checkOutTime).toLocaleTimeString("id-ID")
                : "Belum check-out"}
            </p>
            <p>
              <strong>Status:</strong> {todayAttendance.status}
            </p>
            {todayAttendance.isLate && (
              <p style={{ color: "#dc3545" }}>
                ⚠️ <strong>TERLAMBAT</strong>
              </p>
            )}
            {todayAttendance.overtimeMinutes > 0 && (
              <p style={{ color: "#28a745" }}>
                ✅ <strong>OVERTIME: {todayAttendance.overtimeMinutes} menit</strong>
              </p>
            )}
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
              className={`location-btn ${selectedLocation?.id === loc.id ? "active" : ""}`}
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
          disabled={loading || !location || !selectedLocation || todayAttendance?.checkInTime}
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

        <button onClick={getLocation} disabled={geoLoading} className="btn btn-secondary">
          {geoLoading ? "Loading..." : "🔄 Update Location"}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}