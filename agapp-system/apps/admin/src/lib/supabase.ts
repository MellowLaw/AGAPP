import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient (not the plain supabase-js createClient) so the session
// is also written to cookies, not just localStorage — middleware.ts reads the
// session from cookies to guard routes, and can't see localStorage.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
