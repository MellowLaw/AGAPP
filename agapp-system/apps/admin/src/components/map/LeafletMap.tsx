'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useTheme } from '@/contexts/ThemeContext';
import { Maximize4, CloseCircle, ArrowUp2, ArrowDown2, Map } from 'iconsax-react';

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

// Automatically recalculates map size whenever full-screen or collapse state changes
function InvalidateSizeOnTrigger({ trigger }: { trigger: any }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map, trigger]);
  return null;
}

export interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  /** Re-run setView whenever `center` changes (off by default so fitBounds-driven maps aren't fought over). */
  recenterOnChange?: boolean;
  title?: string;
  collapsible?: boolean;
  allowFullScreen?: boolean;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
}

export function LeafletMap({
  center,
  zoom = 14,
  className = '',
  recenterOnChange = false,
  title = 'Interactive Map',
  collapsible = true,
  allowFullScreen = true,
  defaultCollapsed = false,
  children,
}: LeafletMapProps) {
  const { isDark } = useTheme();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    if (isFullScreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullScreen]);

  // Collapsed View Representation
  if (isCollapsed && !isFullScreen) {
    return (
      <div className="relative z-0 overflow-hidden rounded-2xl border border-theme bg-surface p-4 flex items-center justify-between shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
            <p className="text-xs text-text-muted">Map view is hidden (collapsed)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 rounded-xl transition-colors border border-accent/20"
        >
          <ArrowDown2 className="w-4 h-4" />
          <span>Expand Map</span>
        </button>
      </div>
    );
  }

  const mapInnerContent = (
    <MapContainer center={center} zoom={zoom} className="w-full h-full" scrollWheelZoom>
      <TileLayer
        key={isDark ? 'dark' : 'light'}
        attribution={TILE_ATTRIBUTION}
        url={isDark ? TILE_URLS.dark : TILE_URLS.light}
      />
      {recenterOnChange && <Recenter center={center} zoom={zoom} />}
      <InvalidateSizeOnTrigger trigger={`${isFullScreen}-${isCollapsed}`} />
      {children}
    </MapContainer>
  );

  // Full Screen Modal Overlay View
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 w-screen h-screen animate-fadeIn overflow-hidden">
        {/* Fullscreen Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface border border-theme rounded-2xl mb-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">{title}</h3>
              <p className="text-xs text-text-muted">Full Screen View • Press <kbd className="px-1.5 py-0.5 bg-surface-alt border border-theme rounded text-[10px] font-mono">ESC</kbd> to exit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-alt hover:bg-red-500/10 hover:text-red-500 text-text-primary border border-theme rounded-xl transition-colors text-xs font-semibold"
          >
            <CloseCircle className="w-4 h-4" />
            <span>Exit Full Screen</span>
          </button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-theme shadow-2xl">
          {mapInnerContent}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative z-0 overflow-hidden rounded-2xl border border-theme ${className}`}>
      {/* Control Overlay Buttons */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1 bg-surface/90 backdrop-blur-md border border-theme rounded-xl p-1 shadow-md">
        {allowFullScreen && (
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="p-1.5 text-text-muted hover:text-accent hover:bg-surface-alt rounded-lg transition-colors"
            title="Expand to Full Screen"
          >
            <Maximize4 className="w-4 h-4" />
          </button>
        )}

        {collapsible && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 text-text-muted hover:text-accent hover:bg-surface-alt rounded-lg transition-colors"
            title="Collapse Map"
          >
            <ArrowUp2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {mapInnerContent}
    </div>
  );
}
