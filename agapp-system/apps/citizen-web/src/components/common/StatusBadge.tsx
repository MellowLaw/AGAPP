'use client';

import React from 'react';

export function getBadgeColorClass(status?: string): string {
  const norm = (status || '').toLowerCase().trim();

  // 1. Submitted / Pending / Open / Queued (Sky Blue)
  if (
    norm === 'submitted' ||
    norm === 'pending' ||
    norm === 'open' ||
    norm === 'queued' ||
    norm === 'new' ||
    norm === 'resident verification'
  ) {
    return 'bg-[#0284C7] text-white';
  }

  // 2. In Progress / Processing / Investigating / Under Review / Announcement (Amber)
  if (
    norm === 'in progress' ||
    norm === 'processing' ||
    norm === 'under review' ||
    norm === 'investigating' ||
    norm === 'reviewed' ||
    norm === 'evaluating' ||
    norm === 'ongoing' ||
    norm === 'announcement' ||
    norm === 'announcement!'
  ) {
    return 'bg-[#D97706] text-white';
  }

  // 3. Approved / Resolved / Completed / Released / Active / Verified (Emerald Green)
  if (
    norm === 'approved' ||
    norm === 'resolved' ||
    norm === 'completed' ||
    norm === 'released' ||
    norm === 'active' ||
    norm === 'verified' ||
    norm === 'success' ||
    norm === 'ready for pickup' ||
    norm === 'ready' ||
    norm === 'verified resident'
  ) {
    return 'bg-[#10B981] text-white';
  }

  // 4. Rejected / Cancelled / Withdrawn / Declined / Denied / Advisory (Red)
  if (
    norm === 'rejected' ||
    norm === 'cancelled' ||
    norm === 'withdrawn' ||
    norm === 'declined' ||
    norm === 'denied' ||
    norm === 'banned' ||
    norm === 'restricted' ||
    norm === 'advisory' ||
    norm === 'advisory!' ||
    norm === 'danger' ||
    norm === 'verification rejected'
  ) {
    return 'bg-[#EF4444] text-white';
  }

  // 5. Default / Tag / General / Archived (Dark Slate)
  return 'bg-[#4B5563] text-white';
}

export function StatusBadge({
  status,
  className = '',
}: {
  status: string;
  className?: string;
}) {
  const colorClass = getBadgeColorClass(status);
  return (
    <span
      className={`h-[20px] px-2.5 rounded-full font-['Octarine-Bold'] text-[9px] uppercase tracking-wide inline-flex items-center justify-center text-center leading-none select-none shrink-0 shadow-2xs ${colorClass} ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      <span className="inline-block translate-y-[-0.5px] leading-none text-center">
        {status}
      </span>
    </span>
  );
}

export function getStatusBadge(status: string, className?: string) {
  return <StatusBadge status={status} className={className} />;
}
