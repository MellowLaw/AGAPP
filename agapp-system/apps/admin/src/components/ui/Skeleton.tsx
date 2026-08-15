'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  circle?: boolean;
}

export function Skeleton({ className = '', circle = false, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer bg-surface-alt/70 dark:bg-surface-alt/50 select-none pointer-events-none ${
        circle ? 'rounded-full' : 'rounded-lg'
      } ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-surface border border-theme flex flex-col gap-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center gap-3 pt-2 mt-auto border-t border-theme/50">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-surface border border-theme flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-surface border border-theme flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/5" />
          <div className="flex items-center gap-4 pt-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetailPane() {
  return (
    <div className="p-6 rounded-2xl bg-surface border border-theme flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-theme">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Media or Main visual preview */}
      <Skeleton className="w-full h-56 rounded-xl" />

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-surface-alt/50 border border-theme/60 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="p-3.5 rounded-xl bg-surface-alt/50 border border-theme/60 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="p-3.5 rounded-xl bg-surface-alt/50 border border-theme/60 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="p-3.5 rounded-xl bg-surface-alt/50 border border-theme/60 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-4 border-t border-theme flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-theme bg-surface">
      {/* Table Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-surface-alt/60 border-b border-theme">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-theme/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'w-1/3' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStaffGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-surface border border-theme flex flex-col gap-3.5">
          <div className="flex items-start gap-3.5">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-theme/50">
            <Skeleton className="h-4 w-28" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
