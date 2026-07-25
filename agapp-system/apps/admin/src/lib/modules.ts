/**
 * Admin-panel modules that an LGU Admin can grant to an LGU_PERSONNEL account.
 *
 * This list is the client-side mirror of `v_allowed` in the `set_staff_modules()`
 * SQL function — keep the two in sync. The real enforcement is in Postgres
 * (the `staff_can()` helper inside the RLS policies); everything here is UX so
 * staff aren't shown doors they can't open.
 *
 * `settings` is deliberately NOT grantable: LGU branding and staff management
 * stay with LGU_ADMIN. Personnel get /personnel/settings for their own profile.
 */
export const ADMIN_MODULES = [
  'dashboard',
  'reports',
  'services',
  'eservices-catalog',
  'news',
  'forum',
  'facilities',
  'citizen-guide',
  'citizens',
  'verifications',
] as const;

export type AdminModule = (typeof ADMIN_MODULES)[number];

/** Human labels for the staff-permission checkboxes. */
export const MODULE_LABELS: Record<AdminModule, string> = {
  'dashboard': 'Dashboard',
  'reports': 'Issue Reports',
  'services': 'Service Requests',
  'eservices-catalog': 'eServices Catalog',
  'news': 'Community & News',
  'forum': 'Forum Moderation',
  'facilities': 'Facilities',
  'citizen-guide': 'Citizen Guide',
  'citizens': 'Citizens & Moderation',
  'verifications': 'ID Verifications',
};

/**
 * Maps an /lgu/* pathname to the module that unlocks it.
 * Longest-prefix wins, so /lgu/eservices-catalog isn't swallowed by /lgu/e...
 */
const PATH_MODULE: [string, AdminModule][] = [
  ['/lgu/dashboard', 'dashboard'],
  ['/lgu/reports', 'reports'],
  ['/lgu/services', 'services'],
  ['/lgu/eservices-catalog', 'eservices-catalog'],
  ['/lgu/news', 'news'],
  ['/lgu/forum', 'forum'],
  ['/lgu/facilities', 'facilities'],
  ['/lgu/citizen-guide', 'citizen-guide'],
  ['/lgu/citizens', 'citizens'],
  ['/lgu/verifications', 'verifications'],
];

/**
 * The module required to view `pathname`, or null when the path isn't
 * module-gated. Returns null for /lgu/settings — that one is LGU_ADMIN-only
 * and callers must check the role directly rather than a module.
 */
export function moduleForPath(pathname: string): AdminModule | null {
  let best: AdminModule | null = null;
  let bestLen = 0;
  for (const [prefix, mod] of PATH_MODULE) {
    if ((pathname === prefix || pathname.startsWith(`${prefix}/`)) && prefix.length > bestLen) {
      best = mod;
      bestLen = prefix.length;
    }
  }
  return best;
}

/** Where a personnel account should land: their first granted module. */
export function homePathForModules(modules: string[] | null | undefined): string | null {
  if (!modules?.length) return null;
  for (const [prefix, mod] of PATH_MODULE) {
    if (modules.includes(mod)) return prefix;
  }
  return null;
}
