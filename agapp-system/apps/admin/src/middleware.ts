import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() verifies the session against Supabase (not just "a cookie exists"),
  // so an expired or tampered token is caught here too.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // RLS already blocks the actual data if the wrong role loads a page (see
  // "Users can read their own record" + the LGU/SUPER_ADMIN management
  // policies), so this is defense-in-depth, not the real security boundary —
  // it just stops a personnel account from seeing a super-admin page shell.
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = profile?.role;
  const { pathname } = request.nextUrl;

  const ROLE_HOME: Record<string, string> = {
    SUPER_ADMIN: '/super',
    LGU_ADMIN: '/lgu/dashboard',
    LGU_PERSONNEL: '/personnel/dashboard',
  };

  const allowed =
    (pathname.startsWith('/super') && role === 'SUPER_ADMIN') ||
    (pathname.startsWith('/lgu') && role === 'LGU_ADMIN') ||
    (pathname.startsWith('/personnel') && role === 'LGU_PERSONNEL');

  if (!allowed) {
    const home = role && ROLE_HOME[role] ? ROLE_HOME[role] : '/';
    return NextResponse.redirect(new URL(home, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/lgu/:path*', '/super/:path*', '/personnel/:path*'],
};
