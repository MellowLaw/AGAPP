'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

// Dynamically import Leaflet map components with SSR disabled
const DynamicMap = dynamic(
  () => import('./LeafletInnerPicker').then((mod) => mod.LeafletInnerPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-2xl bg-surface-alt border border-theme flex items-center justify-center text-xs text-text-muted">
        Loading Town Map...
      </div>
    ),
  }
);

export function LocationPickerMap({ lat, lng, onLocationChange }: LocationPickerMapProps) {
  return (
    <div className="h-64 rounded-2xl overflow-hidden border border-theme relative shadow-inner">
      <DynamicMap lat={lat} lng={lng} onLocationChange={onLocationChange} />
    </div>
  );
}
