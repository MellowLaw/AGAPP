import L from 'leaflet';

export { STATUS_COLORS, FACILITY_COLORS } from './colors';

// L.divIcon with an inline SVG teardrop instead of Leaflet's default marker:
// the default icon's PNG URLs break under webpack bundling, and divIcon gives
// per-status/category coloring for free.
export function makePinIcon(color: string, size = 28): L.DivIcon {
  const w = size;
  const h = Math.round((size * 40) / 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 40"><path d="M14 0C6.28 0 0 6.28 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.28 21.72 0 14 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="#ffffff"/></svg>`;
  return L.divIcon({
    className: '', // suppress divIcon's default white box styling
    html: svg,
    iconSize: [w, h],
    iconAnchor: [w / 2, h], // tip of the teardrop sits on the coordinate
    popupAnchor: [0, -h + 6],
  });
}
