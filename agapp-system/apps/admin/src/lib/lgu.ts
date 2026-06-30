/**
 * Single source of truth for mapping between an LGU's database id
 * (e.g. "liliw-laguna") and its human display name (e.g. "Liliw, Laguna").
 *
 * Previously this mapping was hand-rolled inline in several pages — the login
 * page and the verifications page each did their own string juggling. The
 * verifications page derived the id from the display name with
 * `name.toLowerCase().replace(/,/g,'').replace(/\s+/g,'-')`, which only works
 * as long as every LGU happens to be named "<slug>, <Province>" matching
 * "<slug>-<province>". Centralizing it here keeps those two representations in
 * lockstep and prevents a future LGU from silently returning zero rows.
 */

const ID_TO_NAME: Record<string, string> = {
  'liliw-laguna': 'Liliw, Laguna',
  'nagcarlan-laguna': 'Nagcarlan, Laguna',
};

const DEFAULT_LGU_ID = 'liliw-laguna';

/** Build the reverse lookup once. */
const NAME_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ID_TO_NAME).map(([id, name]) => [name, id])
);

/** Display name for a given LGU id (falls back to the default LGU's name). */
export function lguNameFromId(lguId: string | null | undefined): string {
  if (lguId && ID_TO_NAME[lguId]) return ID_TO_NAME[lguId];
  return ID_TO_NAME[DEFAULT_LGU_ID];
}

/**
 * LGU id for a given display name. Falls back to the same slugification rule
 * the app used before (lowercase, drop commas, spaces -> hyphens) so any LGU
 * not yet in the explicit map still resolves predictably.
 */
export function lguIdFromName(lguName: string | null | undefined): string {
  if (!lguName) return DEFAULT_LGU_ID;
  if (NAME_TO_ID[lguName]) return NAME_TO_ID[lguName];
  return lguName.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-');
}
