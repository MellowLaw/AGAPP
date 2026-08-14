/**
 * Citizen identity verification helpers.
 *
 * Verification status lives on the `users` row (source of truth for gating)
 * and is mirrored onto `verification_requests` for the admin review queue.
 * See supabase/verification_setup.sql.
 */

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export const ID_TYPES = [
  { value: 'PhilSys',  label: 'National ID (PhilSys / PhilID)' },
  { value: 'Barangay', label: 'Barangay ID / Clearance' },
  { value: 'Voter',    label: "Voter's ID / COMELEC" },
  { value: 'Driver',   label: "Driver's License" },
  { value: 'Postal',   label: 'Postal ID' },
  { value: 'Other',    label: 'Other government-issued ID' },
] as const;

/**
 * Barangay lists per LGU id. The citizen picks the barangay printed on
 * their ID; the LGU admin visually confirms it matches during review.
 * Source: official barangay rosters for the pilot LGUs. Extend as new
 * LGUs are onboarded.
 */
export const BARANGAYS: Record<string, string[]> = {
  'liliw-laguna': [
    'Bagong Anyo (Pob.)', 'Bayate', 'Bongkol', 'Bubukal', 'Cabuyew', 'Calumpang',
    'Culoy', 'Dagatan', 'Daniw', 'Dita', 'Ibabang Palina', 'Ibabang San Roque',
    'Ibabang Sungi', 'Ibabang Taykin', 'Ilayang Palina', 'Ilayang San Roque',
    'Ilayang Sungi', 'Ilayang Taykin', 'Kanlurang Bukal', 'Laguan', 'Luquin',
    'Malabo-Kalantukan', 'Masikap (Pob.)', 'Maslun (Pob.)', 'Mojon', 'Novaliches',
    'Oples', 'Pag-Asa (Pob.)', 'Palayan', 'Rizal (Pob.)', 'San Isidro',
    'Silangang Bukal', 'Tuy-Baanan',
  ],
  'nagcarlan-laguna': [
    'Abo', 'Alibungbungan', 'Alumbrado', 'Balayong', 'Balimbing', 'Balinacon',
    'Bambang', 'Banago', 'Banca-banca', 'Bangcuro', 'Banilad', 'Bayaquitos',
    'Buboy', 'Buenavista', 'Buhanginan', 'Bukal', 'Bunga', 'Cabuyew',
    'Calumpang', 'Kanluran Kabubuhayan', 'Kanluran Lazaan', 'Labangan', 'Lagulo',
    'Lawaguin', 'Maiit', 'Malaya', 'Malinao', 'Manaol', 'Maravilla',
    'Nagcalbang', 'Oples', 'Palayan', 'Palina', 'Poblacion I (Pob.)',
    'Poblacion II (Pob.)', 'Poblacion III (Pob.)', 'Sabang', 'San Francisco',
    'Santa Lucia', 'Sibulan', 'Silangan Ilaya', 'Silangan Kabubuhayan',
    'Silangan Lazaan', 'Silangan Napapatid', 'Sinipian', 'Sulsuguin',
    'Talahib', 'Talangan', 'Taytay', 'Tipacan', 'Wakat', 'Yukos',
  ],
};

/** Default barangay list when an LGU has no curated roster yet. */
export const DEFAULT_BARANGAYS = ['Poblacion', 'Other (specify at counter)'];

export function getBarangays(lguId?: string | null): string[] {
  if (lguId && BARANGAYS[lguId]) return BARANGAYS[lguId];
  return DEFAULT_BARANGAYS;
}

export function getVerificationStatus(profile: any | null): VerificationStatus {
  if (!profile) return 'unverified';
  return (profile.verification_status as VerificationStatus) ?? 'unverified';
}

export function isVerified(profile: any | null): boolean {
  return getVerificationStatus(profile) === 'verified';
}

/** Short human label for badges. */
export function statusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'verified':   return 'Verified';
    case 'pending':    return 'Pending review';
    case 'rejected':   return 'Verification rejected';
    case 'unverified':
    default:           return 'Unverified';
  }
}
