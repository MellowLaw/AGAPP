'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Retired. Personnel now use the same /lgu/reports screen as an LGU Admin —
 * what limits them is their granted modules (users.module_permissions,
 * enforced by staff_can('reports') in RLS), not a separate cut-down page.
 *
 * The old page here was a 316-line subset of /lgu/reports that had already
 * begun to drift from it (different status vocabulary, no map, no CSV export).
 * Kept as a redirect so existing links and bookmarks still land somewhere
 * sensible; middleware bounces them onward if they lack the module.
 */
export default function RetiredPersonnelReportsPage() {
  const router = useRouter();
  useEffect(() => {
    // Forward the query string — the notification bell deep-links here with
    // ?reportId=..., and dropping it would land the operator on the list
    // instead of the report they clicked. (window.location avoids needing a
    // Suspense boundary around useSearchParams in a redirect-only page.)
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/lgu/reports${qs}`);
  }, [router]);
  return null;
}
