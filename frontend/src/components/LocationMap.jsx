// ============================================
// src/components/LocationMap.jsx - Leaflet Map
// ============================================
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

// Fix for default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function LocationMap({
  locations,
  userLocation,
  onLocationSelect,
}) {
  const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]); // Jakarta default
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);
  return (
    <div style={{ height: "400px", width: "100%", marginBottom: "20px" }}>
      <MapContainer center={mapCenter} zoom={13} style={{ height: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {/* User Location */}
        {userLocation && (
          <>
            <Marker position={[userLocation.latitude, userLocation.longitude]}>
              <Popup>Your Location</Popup>
            </Marker>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={20}
              color="blue"
              fillOpacity={0.2}
            />
          </>
        )}

        {/* Store Locations */}
        {locations.map((location) => (
          <div key={location.id}>
            <Marker
              position={[location.latitude, location.longitude]}
              eventHandlers={{
                click: () => onLocationSelect(location),
              }}
            >
              <Popup>
                <div>
                  <h3>{location.name}</h3>
                  <p>{location.address}</p>
                  <p>Radius: {location.radiusMeter}m</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[location.latitude, location.longitude]}
              radius={location.radiusMeter}
              color="red"
              fillOpacity={0.1}
            />
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
