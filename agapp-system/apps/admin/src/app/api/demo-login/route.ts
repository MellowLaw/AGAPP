import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// Demo accounts only (seeded, never real citizen/staff data). Emails are
// already shown in plaintext in the login page UI; passwords are read from
// server-only env vars (no NEXT_PUBLIC_ prefix) and never sent to the client
// — this route signs in server-side and hands back only a session cookie.
//
// Passwords are stored base64-encoded (_B64 suffix), not because base64 is
// secure (it isn't — it's an encoding, not encryption), but because Next.js's
// built-in env loader (@next/env) performs $VAR-style variable expansion on
// .env values, unlike plain dotenv. A password containing "$" gets silently
// truncated at load time. Base64 output only contains [A-Za-z0-9+/=], which
// sidesteps that entirely.
const DEMO_ACCOUNTS: Record<string, { email: string; passwordEnvVar: string }> = {
  SUPER_ADMIN: { email: 'superadmin@agapp.gov.ph', passwordEnvVar: 'DEMO_SUPERADMIN_PASSWORD_B64' },
  LGU_ADMIN: { email: 'admin@liliw.gov.ph', passwordEnvVar: 'DEMO_LGUADMIN_PASSWORD_B64' },
  LGU_PERSONNEL: { email: 'personnel@liliw.gov.ph', passwordEnvVar: 'DEMO_PERSONNEL_PASSWORD_B64' },
};

export async function POST(req: NextRequest) {
  // Lightweight CSRF defense-in-depth: reject cross-origin POSTs. The demo
  // accounts' credentials are already public (shown in the UI), so this
  // isn't guarding a secret — it just stops this endpoint being driven from
  // an arbitrary third-party page.
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const { ok, retryAfterSeconds } = rateLimit(`demo-login:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!ok) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const { role } = await req.json();

  const account = DEMO_ACCOUNTS[role];
  if (!account) {
    return NextResponse.json({ error: 'Unknown demo role.' }, { status: 400 });
  }

  const encoded = process.env[account.passwordEnvVar];
  if (!encoded) {
    return NextResponse.json(
      { error: `Demo login not configured (${account.passwordEnvVar} missing from .env.local).` },
      { status: 503 }
    );
  }
  const password = Buffer.from(encoded, 'base64').toString('utf8');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email: account.email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
