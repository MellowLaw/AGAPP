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

/**
 * Display name for a given LGU id.
 *
 * For an id that isn't in the explicit map, the slug is title-cased instead of
 * falling back to the default LGU. That matters because the result is fed back
 * through `lguIdFromName()` (the /lgu/* pages carry the LGU as a `?lguName=`
 * display name), and a title-cased slug round-trips exactly:
 *   'santa-cruz-laguna' -> 'Santa Cruz Laguna' -> 'santa-cruz-laguna'
 * Returning Liliw's name here instead would silently point a newly onboarded
 * LGU's staff at Liliw's id. Only a null/blank id falls back to the default.
 *
 * NOTE: do NOT pass `lgus.name` from the database into `lguIdFromName()` — the
 * stored names are like "Municipality of Liliw, Laguna", which slugifies to
 * "municipality-of-liliw-laguna" and matches no LGU.
 */
export function lguNameFromId(lguId: string | null | undefined): string {
  if (lguId && ID_TO_NAME[lguId]) return ID_TO_NAME[lguId];
  if (lguId?.trim()) {
    return lguId
      .split('-')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
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
