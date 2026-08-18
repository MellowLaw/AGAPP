'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForumPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/news');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="animate-pulse space-y-2">
        <p className="text-sm font-['Octarine-Bold'] text-text-primary">Redirecting to News & Advisories...</p>
        <p className="text-xs text-text-muted font-['Inter-Medium']">Community discussions have migrated to official municipal bulletins.</p>
      </div>
    </div>
  );
}
