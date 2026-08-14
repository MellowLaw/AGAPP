import { supabase } from './supabase';

export function pointInPolygon(
  lng: number,
  lat: number,
  geojson: any
): boolean {
  if (!geojson || geojson.type !== 'Polygon' || !Array.isArray(geojson.coordinates)) {
    return false;
  }
  const ring = geojson.coordinates[0];
  if (!ring || ring.length < 3) return false;

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function detectGuestLguFromGps(lat: number, lng: number) {
  try {
    const { data: lgus, error } = await supabase
      .from('lgus')
      .select('id, name, logo, banner_url, primary_color, secondary_color, latitude, longitude, boundary_geojson')
      .eq('is_active', true);

    if (error || !lgus) return null;

    for (const lgu of lgus) {
      if (pointInPolygon(lng, lat, lgu.boundary_geojson)) {
        return lgu;
      }
    }
    return null;
  } catch (err) {
    console.error('Error detecting LGU from GPS', err);
    return null;
  }
}
