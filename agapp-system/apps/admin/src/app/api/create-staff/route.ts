import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { email, password, name, role, lguId } = await req.json();

  if (!email || !password || !name || !role || !lguId) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    );
  }

  // Uses service role key — server-only, never exposed to browser.
  // Created inside the handler so importing the module (e.g. during `next build`
  // page-data collection) doesn't require the secret to be present.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Create the Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, lgu_id: lguId },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || 'Failed to create auth account.' },
      { status: 500 }
    );
  }

  // 2. Insert profile row using the real auth UID
  const { error: dbError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    name,
    email,
    role,
    lgu_id: lguId,
    is_active: true,
    notification_preferences: { push: true, sms: true, email: true },
  });

  if (dbError) {
    // Roll back: remove the auth user so we don't leave an orphan
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ id: authData.user.id });
}
