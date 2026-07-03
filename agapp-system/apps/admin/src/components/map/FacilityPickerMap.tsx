'use client';

import type L from 'leaflet';
import React, { useMemo } from 'react';
import { Marker, Tooltip, useMapEvents } from 'react-leaflet';
import { LeafletMap } from './LeafletMap';
import { makePinIcon, FACILITY_COLORS } from './markers';
import type { FacilityPin } from './types';

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

interface FacilityPickerMapProps {
  facilities: FacilityPin[];
  center: [number, number];
  className?: string;
  /** Facility currently being edited — rendered as the draggable draft marker instead of its category pin. */
  selectedId?: string | null;
  /** Position of the draft (new or being-edited) pin. */
  draftPosition?: [number, number] | null;
  /** Fired on map click AND on draft-marker drag end — both set the draft position. */
  onPick: (lat: number, lng: number) => void;
  onSelectFacility: (id: string) => void;
}

export function FacilityPickerMap({
  facilities,
  center,
  className = 'h-[32rem]',
  selectedId,
  draftPosition,
  onPick,
  onSelectFacility,
}: FacilityPickerMapProps) {
  const icons = useMemo(() => {
    const byCategory: Record<string, L.DivIcon> = {};
    for (const [cat, color] of Object.entries(FACILITY_COLORS)) byCategory[cat] = makePinIcon(color);
    return byCategory;
  }, []);
  // The pin being placed/edited is bigger and dark so it stands out.
  const draftIcon = useMemo(() => makePinIcon('#1a1a1a', 34), []);

  return (
    <LeafletMap center={center} zoom={15} className={className} recenterOnChange>
      <ClickToPlace onPick={onPick} />
      {facilities
        .filter((f) => f.id !== selectedId)
        .map((f) => (
          <Marker
            key={f.id}
            position={[f.lat, f.lng]}
            icon={icons[f.category] || icons.other}
            eventHandlers={{ click: () => onSelectFacility(f.id) }}
          >
            <Tooltip direction="top" offset={[0, -36]}>{f.name}</Tooltip>
          </Marker>
        ))}
      {draftPosition && (
        <Marker
          position={draftPosition}
          icon={draftIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onPick(ll.lat, ll.lng);
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -44]} permanent>
            Drag to fine-tune
          </Tooltip>
        </Marker>
      )}
    </LeafletMap>
  );
}
