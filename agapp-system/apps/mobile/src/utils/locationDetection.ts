/**
 * Guest LGU detection by GPS.
 *
 * Used only for the guest-browse experience: when an unauthenticated user
 * opens the app, we try to detect which municipality they're standing in so
 * Home shows relevant news/facilities. This detection is NEVER authoritative —
 * a logged-in user's LGU is locked to what they declared on their ID and an
 * admin confirmed. GPS here only decides what content to show a browser.
 *
 * Strategy:
 *   1. Ask for foreground location permission.
 *   2. Get the current GPS coordinate.
 *   3. Fetch all active LGUs with their boundary_geojson.
 *   4. Run point-in-polygon for each boundary; return the first match.
 *   5. If none match (user is outside all served towns) or anything fails,
 *      return null so the caller can show the manual town picker.
 */

import * as Location from 'expo-location';
import { supabase } from '../../supabaseClient';

export interface DetectedLgu {
  id: string;
  name: string;
  logo?: string | null;
  banner_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  detected_by_gps: true;
}

export type DetectionResult =
  | { status: 'detected'; lgu: DetectedLgu }
  | { status: 'permission_denied' }
  | { status: 'out_of_area' }
  | { status: 'error'; message: string };

/**
 * Ray-casting point-in-polygon test.
 * Handles GeoJSON Polygon geometry (array of linear rings; we test the outer
 * ring, which is standard for boundary containment).
 */
export function pointInPolygon(
  lng: number,
  lat: number,
  geojson: any,
): boolean {
  if (!geojson || geojson.type !== 'Polygon' || !Array.isArray(geojson.coordinates)) {
    return false;
  }
  // GeoJSON stores coordinates as [lng, lat].
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

/**
 * Attempt to detect the guest's LGU from their current GPS position.
 * Resolves with a DetectionResult; never throws.
 */
export async function detectGuestLgu(): Promise<DetectionResult> {
  // 1. Permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { status: 'permission_denied' };
  }

  // 2. Position
  let position;
  try {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (err: any) {
    return { status: 'error', message: err?.message || 'Could not read GPS.' };
  }

  const { latitude, longitude } = position.coords;

  // 3. Active LGUs with boundaries
  const { data: lgus, error } = await supabase
    .from('lgus')
    .select('id, name, logo, banner_url, primary_color, secondary_color, latitude, longitude, boundary_geojson')
    .eq('is_active', true);

  if (error) {
    return { status: 'error', message: error.message };
  }

  // 4. Point-in-polygon
  for (const lgu of lgus || []) {
    if (pointInPolygon(longitude, latitude, lgu.boundary_geojson)) {
      return {
        status: 'detected',
        lgu: {
          id: lgu.id,
          name: lgu.name,
          logo: lgu.logo,
          banner_url: lgu.banner_url,
          primary_color: lgu.primary_color,
          secondary_color: lgu.secondary_color,
          latitude: lgu.latitude,
          longitude: lgu.longitude,
          detected_by_gps: true,
        },
      };
    }
  }

  // 5. Outside all boundaries
  return { status: 'out_of_area' };
}
