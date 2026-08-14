'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function TownMapViewer({
  center,
  facilities,
}: {
  center: [number, number];
  facilities: any[];
}) {
  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={true}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {facilities.map((fac) => (
        <Marker
          key={fac.id}
          position={[fac.lat, fac.lng]}
          icon={customIcon}
        >
          <Popup>
            <div className="p-1 text-xs">
              <strong className="block text-sm font-bold text-slate-900">{fac.name}</strong>
              <span className="text-slate-600 block">{fac.category}</span>
              <p className="text-slate-500 mt-1">{fac.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
