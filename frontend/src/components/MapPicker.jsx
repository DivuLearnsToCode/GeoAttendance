import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons don't load correctly with bundlers like Vite —
// this points them at the CDN instead.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ latitude, longitude, onPick }) {
  const hasPosition = Boolean(latitude && longitude);
  const center = hasPosition ? [latitude, longitude] : [13.0827, 80.2707]; // defaults to Chennai

  return (
    <div className="mt-3 h-64 w-full overflow-hidden rounded-xl border border-white/15">
      <MapContainer
        key={hasPosition ? `${latitude}-${longitude}` : 'default'}
        center={center}
        zoom={hasPosition ? 16 : 12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickHandler onPick={onPick} />
        {hasPosition && <Marker position={[latitude, longitude]} />}
      </MapContainer>
    </div>
  );
}