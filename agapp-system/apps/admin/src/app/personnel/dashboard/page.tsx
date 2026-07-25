'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Retired. The personnel "My Queue" screen was a subset of /lgu/services
 * (same service_requests table, same mark-ready / claim-code release flow).
 * Personnel now use /lgu/services directly, scoped by their granted modules
 * (users.module_permissions, enforced by staff_can('services') in RLS).
 *
 * Kept as a redirect so existing links and bookmarks still resolve;
 * middleware bounces them onward if they lack the module.
 */
export default function RetiredPersonnelDashboardPage() {
  const router = useRouter();
  useEffect(() => {
    // Preserve any query string (e.g. ?lguName=) so the target page resolves
    // the same LGU it would have on a direct visit.
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/lgu/services${qs}`);
  }, [router]);
  return null;
}
