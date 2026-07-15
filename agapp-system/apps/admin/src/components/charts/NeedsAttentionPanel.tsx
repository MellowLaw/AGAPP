'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Timer, Danger, Box, Location, TickCircle } from 'iconsax-react';

export interface NeedsAttentionData {
  /** Reports past their SLA due date. */
  overdueReports: number;
  /** Reports abandoned/stale (no update in a while) but not yet overdue. */
  staleReports: number;
  /** Service requests stale with no update in a while. */
  staleRequests: number;
  /** Service requests ready for pickup and left uncollected. */
  uncollectedRequests: number;
  /** LGU names with zero reports and requests in the inactivity window. */
  inactiveLgus: string[];
}

interface StatRowProps {
  icon: React.ElementType;
  count: number;
  label: string;
  tone: 'critical' | 'warning';
}

const TONE_STYLES: Record<StatRowProps['tone'], { iconBg: string; iconColor: string }> = {
  critical: { iconBg: 'bg-red-600/10', iconColor: 'text-red-600' },
  warning: { iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
};

const StatRow: React.FC<StatRowProps> = ({ icon: Icon, count, label, tone }) => {
  const styles = TONE_STYLES[tone];
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`p-2 rounded-lg ${styles.iconBg} shrink-0`}>
        <Icon className={`w-4 h-4 ${styles.iconColor}`} variant="Bold" />
      </div>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-xl font-bold font-mono text-text-primary tabular-nums">{count}</span>
        <span className="text-[13px] text-text-muted truncate">{label}</span>
      </div>
    </div>
  );
};

interface NeedsAttentionPanelProps {
  data: NeedsAttentionData;
  loading?: boolean;
}

export const NeedsAttentionPanel: React.FC<NeedsAttentionPanelProps> = ({ data, loading }) => {
  const { overdueReports, staleReports, staleRequests, uncollectedRequests, inactiveLgus } = data;
  const totalFlags = overdueReports + staleReports + staleRequests + uncollectedRequests;
  const allClear = !loading && totalFlags === 0 && inactiveLgus.length === 0;

  return (
    <Card noBorder className="rounded-[20px] h-full flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Needs Attention</h3>
          <p className="text-xs font-serif italic text-accent mt-0.5">Aging &amp; inactivity across all LGUs</p>
        </div>
        {totalFlags > 0 && (
          <Badge variant="error" className="shrink-0">
            {totalFlags} flagged
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted py-8">Loading…</div>
      ) : allClear ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-center">
          <TickCircle className="w-7 h-7 text-green-600" />
          <p className="text-sm text-text-muted">Nothing needs attention right now.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-theme">
            {overdueReports > 0 && (
              <StatRow icon={Danger} count={overdueReports} label="reports past SLA due date" tone="critical" />
            )}
            {staleReports > 0 && (
              <StatRow icon={Timer} count={staleReports} label="reports stale with no update" tone="warning" />
            )}
            {staleRequests > 0 && (
              <StatRow icon={Timer} count={staleRequests} label="service requests stale" tone="warning" />
            )}
            {uncollectedRequests > 0 && (
              <StatRow icon={Box} count={uncollectedRequests} label="requests uncollected" tone="warning" />
            )}
          </div>

          {inactiveLgus.length > 0 && (
            <div className="mt-4 pt-4 border-t border-theme">
              <div className="flex items-center gap-2 mb-2.5">
                <Location className="w-4 h-4 text-text-muted" />
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Inactive 14+ days
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {inactiveLgus.map((name) => (
                  <Badge key={name} variant="default">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
