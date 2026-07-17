import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { lguNameFromId, lguIdFromName } from '@/lib/lgu';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Safe block for server components / static generation
            }
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Fetch user role to direct them to the appropriate dashboard
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        if (profile.role === 'SUPER_ADMIN') {
          return NextResponse.redirect(`${origin}/super`);
        } else if (profile.role === 'LGU_ADMIN') {
          let lguName = lguNameFromId(profile.lgu_id);
          const { data: lgu } = await supabase.from('lgus').select('name').eq('id', profile.lgu_id).single();
          if (lgu?.name && lguIdFromName(lgu.name) === profile.lgu_id) {
            lguName = lgu.name;
          }
          return NextResponse.redirect(`${origin}/lgu/dashboard?lguName=${encodeURIComponent(lguName)}`);
        } else if (profile.role === 'LGU_PERSONNEL') {
          return NextResponse.redirect(`${origin}/personnel/dashboard`);
        } else if (profile.role === 'CITIZEN') {
          // Redirect citizens to a clean verification success landing page
          return NextResponse.redirect(`${origin}/auth/verified`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to an error page or main login page
  return NextResponse.redirect(`${origin}/?error=Verification link expired or invalid`);
}
