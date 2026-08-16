'use client';

import React from 'react';

export function getBadgeColorClass(status?: string | string[] | any): string {
  const raw = Array.isArray(status) ? (status[0] ?? '') : (status ?? '');
  const norm = String(raw).toLowerCase().trim();

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
  status?: string | string[] | any;
  className?: string;
}) {
  const displayStatus = Array.isArray(status)
    ? (status.length > 0 ? String(status[0]) : 'General')
    : (status !== undefined && status !== null ? String(status) : 'General');
  const colorClass = getBadgeColorClass(displayStatus);

  return (
    <span
      className={`h-[22px] px-2.5 rounded-full font-['Octarine-Bold'] text-[9.5px] uppercase tracking-wider inline-flex items-center justify-center text-center leading-none select-none shrink-0 shadow-2xs ${colorClass} ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      <span className="inline-flex items-center justify-center translate-y-[1px] leading-none text-center">
        {displayStatus}
      </span>
    </span>
  );
}

export function getStatusBadge(status?: string | string[] | any, className?: string) {
  return <StatusBadge status={status} className={className} />;
}
