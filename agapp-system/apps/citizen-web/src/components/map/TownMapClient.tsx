'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

const CATEGORY_COLORS: Record<string, string> = {
  municipal: '#D97706',
  police: '#2563EB',
  fire: '#DC2626',
  hospital: '#059669',
  other: '#7C3AED',
  default: '#4F46E5',
};

function createCustomPin(color: string, isSelected: boolean) {
  const size = isSelected ? 42 : 34;
  const pinColor = color || CATEGORY_COLORS.default;
  
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%); cursor: pointer; transition: transform 0.2s;">
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${pinColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 6px 16px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${isSelected ? 14 : 10}px;
            height: ${isSelected ? 14 : 10}px;
            background: #FFFFFF;
            border-radius: 50%;
            transform: rotate(45deg);
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
          "></div>
        </div>
        ${isSelected ? `<div style="position: absolute; bottom: -4px; width: 10px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px);"></div>` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function MapViewController({
  center,
  selectedFacility,
}: {
  center: [number, number];
  selectedFacility: any | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedFacility?.latitude && selectedFacility?.longitude) {
      map.flyTo([Number(selectedFacility.latitude), Number(selectedFacility.longitude)], 16, {
        duration: 0.8,
      });
    } else if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, 15);
    }
  }, [center, selectedFacility, map]);

  return null;
}

export default function TownMapClient({
  center,
  facilities,
  selectedFacility,
  onSelectFacility,
}: {
  center: [number, number];
  facilities: any[];
  selectedFacility: any | null;
  onSelectFacility: (fac: any) => void;
}) {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController center={center} selectedFacility={selectedFacility} />

        {facilities.map((fac) => {
          const lat = Number(fac.latitude || fac.lat);
          const lng = Number(fac.longitude || fac.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isSelected = selectedFacility?.id === fac.id;
          const pinColor = fac.color || CATEGORY_COLORS[fac.category] || CATEGORY_COLORS.default;
          const pinIcon = createCustomPin(pinColor, isSelected);

          return (
            <Marker
              key={fac.id}
              position={[lat, lng]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectFacility(fac),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
