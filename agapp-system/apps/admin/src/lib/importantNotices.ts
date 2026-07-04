import { supabase } from './supabase';

// Bell "needs attention" thresholds — tunable. Computed on panel-open (no
// stored rows, no cron): a report/request counts as a problem once it's been
// sitting in a non-terminal status without an update for this long.
export const ABANDONED_REPORT_DAYS = 3;
export const STALE_REPORT_DAYS = 7;
export const STALE_REQUEST_DAYS = 3;
export const UNCOLLECTED_REQUEST_DAYS = 7;

export interface ImportantNotice {
  id: string;
  type: 'report_overdue' | 'report_abandoned' | 'request_stale' | 'request_uncollected';
  title: string;
  body: string;
  timestamp: string;
  reportId?: string;
  requestId?: string;
}

const daysAgo = (days: number) => Date.now() - days * 86400000;

// Reports/requests still open, LGU-scoped, filtered/classified in JS (small
// per-LGU volumes at this app's scale — no need for a heavier SQL query).
export async function fetchImportantNotices(lguId: string): Promise<ImportantNotice[]> {
  const notices: ImportantNotice[] = [];
  const now = Date.now();

  const { data: reports } = await supabase
    .from('reports')
    .select('id, reference_number, status, sla_due_date, created_at, updated_at')
    .eq('lgu_id', lguId)
    .in('status', ['Submitted', 'Under Review', 'In Progress']);

  (reports || []).forEach(r => {
    const overdue = !!r.sla_due_date && new Date(r.sla_due_date).getTime() < now;
    if (overdue) {
      notices.push({
        id: `report-overdue-${r.id}`,
        type: 'report_overdue',
        title: 'Report Overdue',
        body: `${r.reference_number} is past its SLA due date.`,
        timestamp: r.sla_due_date as string,
        reportId: r.id,
      });
      return; // one notice per report — overdue takes priority over "abandoned"
    }

    const abandoned = r.status === 'Submitted' && new Date(r.created_at).getTime() < daysAgo(ABANDONED_REPORT_DAYS);
    const stale = new Date(r.updated_at).getTime() < daysAgo(STALE_REPORT_DAYS);
    if (abandoned || stale) {
      notices.push({
        id: `report-stale-${r.id}`,
        type: 'report_abandoned',
        title: 'Report Needs Attention',
        body: `${r.reference_number} has been ${r.status.toLowerCase()} with no update for a while.`,
        timestamp: r.updated_at,
        reportId: r.id,
      });
    }
  });

  const { data: requests } = await supabase
    .from('service_requests')
    .select('id, reference_number, status, updated_at')
    .eq('lgu_id', lguId)
    .in('status', ['Submitted', 'Under Review', 'Ready for Pickup']);

  (requests || []).forEach(r => {
    if (r.status === 'Ready for Pickup') {
      if (new Date(r.updated_at).getTime() < daysAgo(UNCOLLECTED_REQUEST_DAYS)) {
        notices.push({
          id: `request-uncollected-${r.id}`,
          type: 'request_uncollected',
          title: 'Uncollected Request',
          body: `${r.reference_number} has been ready for pickup for a while.`,
          timestamp: r.updated_at,
          requestId: r.id,
        });
      }
      return;
    }
    if (new Date(r.updated_at).getTime() < daysAgo(STALE_REQUEST_DAYS)) {
      notices.push({
        id: `request-stale-${r.id}`,
        type: 'request_stale',
        title: 'Request Needs Attention',
        body: `${r.reference_number} has been ${r.status.toLowerCase()} with no update for a while.`,
        timestamp: r.updated_at,
        requestId: r.id,
      });
    }
  });

  return notices.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
