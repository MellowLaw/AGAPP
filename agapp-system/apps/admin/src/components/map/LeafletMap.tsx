'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useTheme } from '@/contexts/ThemeContext';

// CartoDB's no-API-key basemaps (same OSM data, restyled) — deep midnight
// canvas for dark mode, soft parchment/off-white for light mode. Swapping the
// tile URL is the only way to theme a raster tile layer; per-feature color
// control would require vector tiles, which is out of scope here.
const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
  const { isDark } = useTheme();

  return (
    // z-0 creates a stacking context so Leaflet's internal panes (z-index up
    // to ~1000) can't paint over the app's sticky header. Callers must give
    // this an explicit height (h-64/h-96/...) or Leaflet renders 0px tall.
    <div className={`relative z-0 overflow-hidden rounded-2xl border border-theme ${className}`}>
      <MapContainer center={center} zoom={zoom} className="w-full h-full" scrollWheelZoom>
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          attribution={TILE_ATTRIBUTION}
          url={isDark ? TILE_URLS.dark : TILE_URLS.light}
        />
        {recenterOnChange && <Recenter center={center} zoom={zoom} />}
        {children}
      </MapContainer>
    </div>
  );
}
