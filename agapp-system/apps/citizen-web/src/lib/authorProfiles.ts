import { supabase } from './supabase';

export interface AuthorProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export async function fetchAuthorProfiles(
  ids: (string | null | undefined)[]
): Promise<Map<string, AuthorProfile>> {
  const unique = Array.from(new Set(ids.filter(Boolean) as string[]));
  if (unique.length === 0) return new Map();

  try {
    const { data, error } = await supabase.rpc('get_forum_author_profiles', {
      p_ids: unique,
    });

    if (error) {
      console.warn('[authorProfiles] lookup failed:', error.message);
      return new Map();
    }

    return new Map((data || []).map((r: any) => [r.id as string, r as AuthorProfile]));
  } catch (err) {
    console.warn('[authorProfiles] exception:', err);
    return new Map();
  }
}
