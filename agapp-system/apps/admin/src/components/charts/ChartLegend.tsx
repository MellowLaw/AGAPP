'use client';

import React from 'react';

/**
 * Shared legend row for multi-series charts. Per the dataviz method: a legend
 * is always present for 2+ series (never make the reader color-match alone),
 * with swatches that mirror the mark (rect for bars/areas, line for lines).
 * A single-series chart should not render this — the title already names it.
 */

export interface ChartLegendItem {
  key: string;
  label: string;
  color: string;
  shape?: 'rect' | 'line';
}

interface ChartLegendProps {
  items: ChartLegendItem[];
  className?: string;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ items, className = '' }) => {
  if (items.length < 2) return null;
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5 text-[12px] text-text-muted">
          {item.shape === 'line' ? (
            <span
              aria-hidden
              className="inline-block h-[2px] w-3.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
          ) : (
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-[3px] shrink-0"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
};
