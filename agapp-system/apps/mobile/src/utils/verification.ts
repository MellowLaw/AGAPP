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
    'Poblacion I', 'Poblacion II', 'Poblacion III', 'Poblacion IV',
    'Analiw', 'Bagtak', 'Buboy', 'Bunga', 'Calumpang', 'Ibabang Calumpang',
    'Ilayang Bulo', 'Ilayang San Roque', 'Layugan', 'Luksuhin Ilaya',
    'Malalayat', 'Moog', 'Niing', 'Novaliches', 'Olla', 'San Antonio',
    'San Antonio I', 'San Isidro', 'San Jose', 'San Juan I', 'San Juan II',
    'San Roque I', 'Santa Lucia', 'Santo Tomas', 'Turbina',
  ],
  'nagcarlan-laguna': [
    'Poblacion I', 'Poblacion II', 'Poblacion III', 'Poblacion IV',
    'Bae', 'Balimbing', 'Banilad', 'Banos', 'Buboy', 'Buenavista',
    'Bukal', 'Cabuyew', 'Calumpang', 'Kanluran Calumpang', 'Silangan Calumpang',
    'Casile', 'Ibabang Nasigbit', 'Ilayang Nasigbit', 'Manaol', 'Marcelo',
    'Malaiba', 'Municion', 'Palayan', 'Banago', 'Balayong', 'Barkadahan',
    'Talahib', 'Taytay', 'Tipacan', 'Wakat',
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
