'use client';

import React from 'react';
import dynamic from 'next/dynamic';

function MapSkeleton() {
  return <div className="w-full h-full min-h-[16rem] rounded-md bg-surface-alt animate-pulse" />;
}

// Leaflet touches `window` at import time, so every map component must load
// client-side only. This barrel is the ONLY sanctioned import path for map
// components — importing ./ReportsMap or ./FacilityPickerMap directly from a
// page crashes `next build` with "window is not defined".
export const ReportsMap = dynamic(() => import('./ReportsMap').then((m) => m.ReportsMap), {
  ssr: false,
  loading: MapSkeleton,
});

export const FacilityPickerMap = dynamic(() => import('./FacilityPickerMap').then((m) => m.FacilityPickerMap), {
  ssr: false,
  loading: MapSkeleton,
});

export type { ReportPin, FacilityPin } from './types';
