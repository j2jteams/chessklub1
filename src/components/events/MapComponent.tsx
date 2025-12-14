'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  location: string;
}

export default function MapComponent({ center, zoom, location }: MapComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>
          <div className="text-sm">
            <p className="font-semibold">{location}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}




