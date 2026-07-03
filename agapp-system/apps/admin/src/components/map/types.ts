// Plain data shapes for map pins. Deliberately free of any leaflet imports so
// pages can import these types without dragging Leaflet into the server bundle.

export interface ReportPin {
  id: string;
  refNumber: string;
  lat: number;
  lng: number;
  status: string;
  category: string;
  barangay: string;
  date: string;
  photoUrl?: string | null;
}

export interface FacilityPin {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
}
