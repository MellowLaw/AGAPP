import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { moduleForPath, homePathForModules } from '@/lib/modules';
import { lguNameFromId } from '@/lib/lgu';

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

  // RLS is the real security boundary — every /lgu/* table is gated by
  // staff_can('<module>') in Postgres, so a personnel who forges a URL still
  // gets no rows. This check just stops them loading a page shell they have
  // no business seeing. The lgus(name) embed is used to keep ?lguName= honest.
  const { data: profile } = await supabase
    .from('users')
    .select('role, lgu_id, module_permissions')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  const modules: string[] = profile?.module_permissions ?? [];
  // Must be the *display* name, not lgus.name — the pages round-trip this
  // through lguIdFromName(), and the stored names ("Municipality of Liliw,
  // Laguna") slugify to an id that matches no LGU. See lib/lgu.ts.
  const lguName = profile?.lgu_id ? lguNameFromId(profile.lgu_id) : undefined;
  const { pathname } = request.nextUrl;

  const homeFor = (): string => {
    if (role === 'SUPER_ADMIN') return '/super';
    if (role === 'LGU_ADMIN') return '/lgu/dashboard';
    if (role === 'LGU_PERSONNEL') {
      // Personnel land on their first granted module; if an admin has granted
      // them nothing yet, their own profile page is the only place to go.
      return homePathForModules(modules) ?? '/personnel/settings';
    }
    return '/';
  };

  let allowed = false;

  if (pathname.startsWith('/super')) {
    allowed = role === 'SUPER_ADMIN';
  } else if (pathname.startsWith('/personnel')) {
    allowed = role === 'LGU_PERSONNEL';
  } else if (pathname.startsWith('/lgu')) {
    if (role === 'LGU_ADMIN') {
      allowed = true;
    } else if (role === 'LGU_PERSONNEL') {
      // Branding + staff management are never delegated.
      const required = pathname.startsWith('/lgu/settings') ? null : moduleForPath(pathname);
      allowed = !!required && modules.includes(required);
    }
  }

  if (!allowed) {
    return NextResponse.redirect(new URL(homeFor(), request.url));
  }

  // The /lgu/* pages read their LGU from ?lguName= and fall back to a hardcoded
  // "Liliw, Laguna", so a staff member of any other LGU who arrives without the
  // param (direct link, or a redirect like the one above) would query the wrong
  // tenant and see an empty page. Pin the param to the signed-in user's own LGU
  // here, at the single choke point, instead of in all ~11 pages.
  if (lguName && (role === 'LGU_ADMIN' || role === 'LGU_PERSONNEL') && pathname.startsWith('/lgu')) {
    if (request.nextUrl.searchParams.get('lguName') !== lguName) {
      const url = request.nextUrl.clone();
      url.searchParams.set('lguName', lguName);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/lgu/:path*', '/super/:path*', '/personnel/:path*'],
};
