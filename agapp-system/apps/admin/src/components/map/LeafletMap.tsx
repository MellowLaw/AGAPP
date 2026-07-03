'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

// MapContainer only honors `center` on first render; this keeps the view in
// sync when the prop changes afterwards (e.g. switching LGU).
function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center[0], center[1], zoom]);
  return null;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  /** Re-run setView whenever `center` changes (off by default so fitBounds-driven maps aren't fought over). */
  recenterOnChange?: boolean;
  children?: React.ReactNode;
}

export function LeafletMap({ center, zoom = 14, className = '', recenterOnChange = false, children }: LeafletMapProps) {
  return (
    // z-0 creates a stacking context so Leaflet's internal panes (z-index up
    // to ~1000) can't paint over the app's sticky header. Callers must give
    // this an explicit height (h-64/h-96/...) or Leaflet renders 0px tall.
    <div className={`relative z-0 overflow-hidden rounded-lg border border-[#e5e5e5] ${className}`}>
      <MapContainer center={center} zoom={zoom} className="w-full h-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {recenterOnChange && <Recenter center={center} zoom={zoom} />}
        {children}
      </MapContainer>
    </div>
  );
}
