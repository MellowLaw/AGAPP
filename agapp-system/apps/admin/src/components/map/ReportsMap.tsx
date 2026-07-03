'use client';

import L from 'leaflet';
import React, { useEffect, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { LeafletMap } from './LeafletMap';
import { makePinIcon, STATUS_COLORS } from './markers';
import type { ReportPin } from './types';

// Refits the viewport whenever the pin set changes (e.g. the super admin
// switches the LGU filter tab, or a different report is selected).
function FitToPins({ pins }: { pins: ReportPin[] }) {
  const map = useMap();
  const signature = pins.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.2), { maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);
  return null;
}

interface ReportsMapProps {
  reports: ReportPin[];
  center: [number, number];
  /** Height comes from here — e.g. "h-96". */
  className?: string;
  /** When provided, popups get an "Open report" link. Omit for view-only mode (super admin). */
  getDetailHref?: (report: ReportPin) => string;
  showLegend?: boolean;
}

export function ReportsMap({ reports, center, className = 'h-96', getDetailHref, showLegend = true }: ReportsMapProps) {
  const icons = useMemo(() => {
    const byStatus: Record<string, L.DivIcon> = {};
    for (const [status, color] of Object.entries(STATUS_COLORS)) byStatus[status] = makePinIcon(color);
    return byStatus;
  }, []);
  const fallbackIcon = useMemo(() => makePinIcon('#6B7280'), []);

  return (
    <div className={`relative ${className}`}>
      <LeafletMap center={center} className="h-full">
        <FitToPins pins={reports} />
        {reports.map((r) => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={icons[r.status] || fallbackIcon}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="m-0 font-semibold text-text-primary">{r.refNumber}</p>
                <p className="mt-1 flex items-center gap-1.5 text-text-primary">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[r.status] || '#6B7280' }}
                  />
                  {r.status} · {r.category}
                </p>
                <p className="mt-1 text-text-muted">
                  {r.barangay} · {r.date}
                </p>
                {r.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.photoUrl}
                    alt="Report evidence"
                    className="mt-2 rounded-md max-h-24 w-full object-cover"
                  />
                )}
                {getDetailHref && (
                  <a href={getDetailHref(r)} className="inline-block mt-2 font-semibold text-text-primary hover:text-accent transition-colors">
                    Open report →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMap>
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-10 bg-surface border border-theme rounded-xl px-3 py-2">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted leading-4">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
