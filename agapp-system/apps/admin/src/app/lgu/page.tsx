'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LguRootPage() {
  const router = useRouter();
  const params = useSearchParams();
  const lguParam = params?.get('lguName') || '';
  useEffect(() => {
    const base = '/lgu/dashboard';
    const href = lguParam ? `${base}?lguName=${encodeURIComponent(lguParam)}` : base;
    router.replace(href);
  }, [router, lguParam]);
  return null;
}
