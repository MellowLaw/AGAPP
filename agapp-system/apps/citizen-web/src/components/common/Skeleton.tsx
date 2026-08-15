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
      className={`skeleton-shimmer bg-surface-alt/80 dark:bg-surface-alt/50 select-none pointer-events-none ${
        circle ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-surface border border-theme flex flex-col gap-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center gap-3 pt-3 mt-auto border-t border-theme/50">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-24 rounded-xl ml-auto" />
      </div>
    </div>
  );
}

export function SkeletonServiceGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-2xl bg-surface border border-theme flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-theme/50">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-surface border border-theme flex items-start gap-4">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/4 pt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl bg-surface border border-theme overflow-hidden flex flex-col">
          <Skeleton className="w-full h-52 rounded-none" />
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
