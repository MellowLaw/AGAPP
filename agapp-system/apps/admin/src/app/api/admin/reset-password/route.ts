import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // 1. Authenticate caller using session cookie
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !caller) {
      return NextResponse.json({ error: 'Unauthorized: Please log in.' }, { status: 401 });
    }

    const { targetUserId, newPassword } = await req.json();

    if (!targetUserId || !newPassword) {
      return NextResponse.json({ error: 'Missing targetUserId or newPassword' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // 2. Fetch caller and target profiles from DB
    const { data: callerProfile, error: callerError } = await supabaseUser
      .from('users')
      .select('id, role, lgu_id')
      .eq('id', caller.id)
      .single();

    if (callerError || !callerProfile) {
      return NextResponse.json({ error: 'Caller profile not found.' }, { status: 403 });
    }

    const { data: targetProfile, error: targetError } = await supabaseUser
      .from('users')
      .select('id, role, lgu_id, email, name')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 });
    }

    // 3. Strict RBAC Enforcement:
    // - SUPER_ADMIN: Can reset password for LGU_ADMIN and LGU_PERSONNEL across all LGUs.
    // - LGU_ADMIN: Can ONLY reset password for LGU_PERSONNEL in their OWN LGU.
    const isSuperAdmin = callerProfile.role === 'SUPER_ADMIN';
    const isOwnLguAdmin =
      callerProfile.role === 'LGU_ADMIN' &&
      callerProfile.lgu_id === targetProfile.lgu_id &&
      targetProfile.role === 'LGU_PERSONNEL';

    if (!isSuperAdmin && !isOwnLguAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to reset this account’s password.' },
        { status: 403 }
      );
    }

    // 4. Update user password using Supabase Service Role client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Failed to update password via admin API:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Password for ${targetProfile.name || targetProfile.email} has been updated successfully.`,
    });
  } catch (err: any) {
    console.error('Password reset handler crashed:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
