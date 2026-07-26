import { supabase } from '../../supabaseClient';

/** Neutral placeholder — deliberately not a stock photo of a person. */
export const DEFAULT_AVATAR =
  'https://jrureblhypfdljwflout.supabase.co/storage/v1/object/public/report-photos/default-avatar.png';

export interface AuthorProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

/**
 * Public profile info (id, name, avatar) for forum authors.
 *
 * Goes through the `get_forum_author_profiles` RPC rather than `users`, because
 * a SIGNED-IN citizen cannot read anyone else's `users` row — their only SELECT
 * policy is "your own record". The old embedded join
 * (`.select('*, citizen:users!citizen_id(avatar_url)')`) therefore resolved to
 * null for every other author, which is why avatars were blank. (Guests were
 * unaffected; their is_public_forum_author policy satisfies the embed.)
 *
 * The RPC is SECURITY DEFINER and returns only id/name/avatar_url for people who
 * have actually posted publicly, so it can't be used to read private columns.
 * See supabase/patches/17_forum_author_profiles.sql.
 */
export async function fetchAuthorProfiles(
  ids: (string | null | undefined)[]
): Promise<Map<string, AuthorProfile>> {
  const unique = Array.from(new Set(ids.filter(Boolean) as string[]));
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .rpc('get_forum_author_profiles', { p_ids: unique });

  if (error) {
    // Best-effort: the feed still renders, just with placeholder avatars.
    console.warn('[authorProfiles] lookup failed:', error.message);
    return new Map();
  }

  return new Map((data || []).map((r: any) => [r.id as string, r as AuthorProfile]));
}
