export const ID_TYPES = [
  { value: 'PhilSys', label: 'National ID (PhilSys / PhilID)' },
  { value: 'Barangay', label: 'Barangay ID / Clearance' },
  { value: 'Voter', label: "Voter's ID / COMELEC" },
  { value: 'Driver', label: "Driver's License" },
  { value: 'Postal', label: 'Postal ID' },
  { value: 'Other', label: 'Other government-issued ID' },
] as const;

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

export const DEFAULT_BARANGAYS = ['Poblacion', 'Other (specify at counter)'];

export function getBarangays(lguId?: string | null): string[] {
  if (lguId && BARANGAYS[lguId]) return BARANGAYS[lguId];
  return DEFAULT_BARANGAYS;
}
