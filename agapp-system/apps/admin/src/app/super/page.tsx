'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatAvgTurnaround } from '@/lib/turnaround';
import {
  ABANDONED_REPORT_DAYS,
  STALE_REPORT_DAYS,
  STALE_REQUEST_DAYS,
  UNCOLLECTED_REQUEST_DAYS,
} from '@/lib/importantNotices';
import dynamic from 'next/dynamic';
import { ReportsMap, type ReportPin } from '@/components/map';
import { STATUS_COLORS } from '@/components/map/colors';
import type { LguRankingDatum } from '@/components/charts/LguRankingBarChart';
import type { StatusBreakdownDatum } from '@/components/charts/StatusBreakdownChart';
import { NeedsAttentionPanel, type NeedsAttentionData } from '@/components/charts/NeedsAttentionPanel';
import { Building, People, Danger, DocumentText, Add, DocumentDownload, Printer } from 'iconsax-react';

const LguRankingBarChart = dynamic(
  () => import('@/components/charts/LguRankingBarChart').then((m) => m.LguRankingBarChart),
  { ssr: false }
);

const StatusBreakdownChart = dynamic(
  () => import('@/components/charts/StatusBreakdownChart').then((m) => m.StatusBreakdownChart),
  { ssr: false }
);

// LGUs with zero reports AND zero requests created in this window are
// flagged as inactive on the cross-LGU "Needs attention" panel.
const INACTIVE_LGU_DAYS = 14;
const daysAgo = (days: number) => Date.now() - days * 86_400_000;

const TERMINAL_REPORT_STATUS = 'Resolved';
const TERMINAL_REQUEST_STATUS = 'Released';

// Numeric twin of formatAvgTurnaround (lib/turnaround.ts) — same rows, same
// terminal statuses, but returns a raw number (or null) so it can feed the
// ranking chart instead of a display string.
function computeAvgResponseDays(reports: any[], requests: any[]): number | null {
  const durations = [
    ...reports
      .filter((r) => r.status === TERMINAL_REPORT_STATUS && r.created_at && r.updated_at)
      .map((r) => (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000)
      .filter((d) => d >= 0),
    ...requests
      .filter((r) => r.status === TERMINAL_REQUEST_STATUS && r.created_at && r.updated_at)
      .map((r) => (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000)
      .filter((d) => d >= 0),
  ];
  if (durations.length === 0) return null;
  return durations.reduce((sum, d) => sum + d, 0) / durations.length;
}

const mapDbCategoryToLabel = (category: string): string => {
  switch (category) {
    case 'pothole':
      return 'Pothole / Road Damage';
    case 'clogged_drainage':
      return 'Drainage / Canal';
    case 'stray_animal':
      return 'Stray Pets';
    case 'damaged_pole':
      return 'Damaged Pole';
    default:
      return category || 'Other';
  }
};

// Midpoint of the Liliw–Nagcarlan corridor: the platform's pilot scope is
// these two Laguna municipalities, so the cross-LGU map defaults to a Laguna
// view (fitBounds takes over as soon as report pins load).
const LAGUNA_CENTER: [number, number] = [14.1335, 121.4265];

export default function SuperAdminDashboard() {
  const [lgus, setLgus] = useState<any[]>([]);
  const [selectedLgu, setSelectedLgu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbReports, setDbReports] = useState<any[]>([]);
  const [dbRequests, setDbRequests] = useState<any[]>([]);
  const [dbUsersList, setDbUsersList] = useState<any[]>([]);

  // Printable Report Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printCategory, setPrintCategory] = useState('overall');
  const [printLgu, setPrintLgu] = useState<string>('all');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [{ data: dbLgus }, { data: dbUsers }, { data: dbReportsData }, { data: dbRequestsData }] = await Promise.all([
          supabase.from('lgus').select('id, name, is_active, latitude, longitude'),
          supabase.from('users').select('id, role, lgu_id'),
          supabase
            .from('reports')
            .select('id, lgu_id, status, created_at, updated_at, reference_number, category, barangay, latitude, longitude, photo_url, sla_due_date'),
          supabase.from('service_requests').select('id, lgu_id, status, created_at, updated_at, reference_number, service_type, office_name'),
        ]);

        if (dbReportsData) setDbReports(dbReportsData);
        if (dbRequestsData) setDbRequests(dbRequestsData);
        if (dbUsers) setDbUsersList(dbUsers);

        if (dbLgus) {
          const mapped = dbLgus.map((lgu: any) => {
            const lguUsers = (dbUsers || []).filter(u => u.lgu_id === lgu.id).length;
            const lguOwnReports = (dbReportsData || []).filter(r => r.lgu_id === lgu.id);
            const lguOwnRequests = (dbRequestsData || []).filter(s => s.lgu_id === lgu.id);
            return {
              id: lgu.id,
              name: lgu.name,
              status: lgu.is_active ? 'active' : 'inactive',
              latitude: lgu.latitude,
              longitude: lgu.longitude,
              users: lguUsers || 0,
              reports: lguOwnReports.length,
              requests: lguOwnRequests.length,
              responseTime: formatAvgTurnaround(lguOwnReports, lguOwnRequests),
              responseTimeDays: computeAvgResponseDays(lguOwnReports, lguOwnRequests),
            };
          });
          setLgus(mapped);
        }
      } catch (err) {
        console.error('Failed to load super admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate stats based on selection
  const filteredLgus = selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus;

  const stats = useMemo(() => {
    return [
      {
        label: 'Total LGUs',
        value: selectedLgu ? '1' : filteredLgus.length.toString(),
        icon: Building
      },
      {
        label: 'Active People',
        value: filteredLgus.reduce((sum, l) => sum + l.users, 0).toLocaleString(),
        icon: People
      },
      {
        label: 'Reports',
        value: filteredLgus.reduce((sum, l) => sum + l.reports, 0).toString(),
        icon: Danger
      },
      {
        label: 'Service Requests',
        value: filteredLgus.reduce((sum, l) => sum + l.requests, 0).toString(),
        icon: DocumentText
      },
    ];
  }, [selectedLgu, filteredLgus]);

  // Chart data for the LGU ranking bars — respects the LGU filter tabs like
  // the rest of the dashboard.
  const rankingData = useMemo<LguRankingDatum[]>(
    () =>
      filteredLgus.map((l) => ({
        id: l.id,
        name: l.name,
        reports: l.reports,
        requests: l.requests,
        users: l.users,
        responseTimeDays: l.responseTimeDays,
      })),
    [filteredLgus]
  );

  // Reports-by-status per LGU, stacked using the same STATUS_COLORS the
  // reports map uses, so status colors mean the same thing everywhere.
  const statusBreakdownData = useMemo<StatusBreakdownDatum[]>(
    () =>
      filteredLgus.map((lgu) => {
        const counts: StatusBreakdownDatum = { name: lgu.name };
        Object.keys(STATUS_COLORS).forEach((status) => {
          counts[status] = 0;
        });
        dbReports
          .filter((r) => r.lgu_id === lgu.id)
          .forEach((r) => {
            const key = r.status || 'Submitted';
            counts[key] = (Number(counts[key]) || 0) + 1;
          });
        return counts;
      }),
    [dbReports, filteredLgus]
  );

  // Cross-LGU "needs attention" aggregation — same aging thresholds as the
  // per-LGU notification bell (lib/importantNotices.ts), but computed across
  // ALL LGUs from data already loaded above instead of one query per LGU.
  const needsAttention = useMemo<NeedsAttentionData>(() => {
    const now = Date.now();
    let overdueReports = 0;
    let staleReports = 0;

    dbReports
      .filter((r) => ['Submitted', 'Under Review', 'In Progress'].includes(r.status))
      .forEach((r) => {
        const overdue = !!r.sla_due_date && new Date(r.sla_due_date).getTime() < now;
        if (overdue) {
          overdueReports++;
          return; // overdue takes priority over "stale", same as the bell
        }
        const abandoned = r.status === 'Submitted' && new Date(r.created_at).getTime() < daysAgo(ABANDONED_REPORT_DAYS);
        const stale = new Date(r.updated_at).getTime() < daysAgo(STALE_REPORT_DAYS);
        if (abandoned || stale) staleReports++;
      });

    let staleRequests = 0;
    let uncollectedRequests = 0;

    dbRequests.forEach((r) => {
      if (r.status === 'Ready for Pickup') {
        if (new Date(r.updated_at).getTime() < daysAgo(UNCOLLECTED_REQUEST_DAYS)) uncollectedRequests++;
        return;
      }
      if (!['Submitted', 'Under Review'].includes(r.status)) return;
      if (new Date(r.updated_at).getTime() < daysAgo(STALE_REQUEST_DAYS)) staleRequests++;
    });

    const inactiveLgus = lgus
      .filter((lgu) => {
        const cutoff = daysAgo(INACTIVE_LGU_DAYS);
        const hasRecentReport = dbReports.some((r) => r.lgu_id === lgu.id && new Date(r.created_at).getTime() >= cutoff);
        const hasRecentRequest = dbRequests.some((r) => r.lgu_id === lgu.id && new Date(r.created_at).getTime() >= cutoff);
        return !hasRecentReport && !hasRecentRequest;
      })
      .map((lgu) => lgu.name);

    return { overdueReports, staleReports, staleRequests, uncollectedRequests, inactiveLgus };
  }, [dbReports, dbRequests, lgus]);

  // Pins for the cross-LGU map, respecting the LGU filter tabs. View-only:
  // super admin sees where every report is and its status, but takes no action.
  const reportPins = useMemo<ReportPin[]>(
    () =>
      dbReports
        .filter((r) => (selectedLgu ? r.lgu_id === selectedLgu : true))
        .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
        .map((r) => ({
          id: r.id,
          refNumber: r.reference_number || r.id,
          lat: r.latitude,
          lng: r.longitude,
          status: r.status || 'Submitted',
          category: mapDbCategoryToLabel(r.category),
          barangay: r.barangay || '',
          date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
          photoUrl: r.photo_url,
        })),
    [dbReports, selectedLgu]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedLgu) {
      const lgu = lgus.find((l) => l.id === selectedLgu);
      if (lgu?.latitude && lgu?.longitude) return [lgu.latitude, lgu.longitude];
    }
    return LAGUNA_CENTER;
  }, [selectedLgu, lgus]);

  return (
    <DashboardLayout
      role="super-admin"
      title="Dashboard Overview"
      heroKicker="MUNICIPAL CONTROL CENTER — SUPER ADMIN"
      heroTitleAccent="Agapp Portal"
    >
      {/* LGU Filter Tabs */}
      <div className="flex items-center gap-2.5 mb-8 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setSelectedLgu(null)}
          className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors ${
            selectedLgu === null
              ? 'bg-text-primary text-bg'
              : 'bg-transparent border border-theme text-text-muted hover:border-text-muted hover:text-text-primary'
          }`}
        >
          All LGUs
        </motion.button>
        {lgus.map(lgu => (
          <motion.button
            key={lgu.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedLgu(lgu.id)}
            className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors ${
              selectedLgu === lgu.id
                ? 'bg-text-primary text-bg'
                : 'bg-transparent border border-theme text-text-muted hover:border-text-muted hover:text-text-primary'
            }`}
          >
            {lgu.name}
          </motion.button>
        ))}
        <Link href="/super/lgus">
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 bg-transparent border border-theme rounded-full text-[13px] font-semibold text-text-primary hover:border-text-muted flex items-center gap-1.5 transition-colors"
          >
            <Add className="w-4 h-4" />
            Add LGU
          </motion.button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card noBorder className="rounded-[20px] min-h-[140px] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-text-muted">{stat.label}</p>
                  <div className="p-1.5 bg-surface-alt rounded-md border border-theme">
                    <Icon className="w-4 h-4 text-accent" variant="Bold" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[32px] font-mono font-bold text-text-primary tracking-tight leading-none">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-text-primary">Quick Actions</h3>
            <p className="text-xs font-serif italic text-accent mt-0.5">Key administrative shortcuts & system operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/super/lgus">
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-surface hover:bg-surface-alt border border-theme hover:border-accent/40 rounded-[18px] transition-all cursor-pointer group flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-contrast transition-colors">
                  <Add className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-text-muted group-hover:text-accent transition-colors">LGUs →</span>
              </div>
              <div>
                <p className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">Add & Manage LGUs</p>
                <p className="text-[12px] text-text-muted truncate mt-0.5">Municipalities & staff</p>
              </div>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setPrintLgu(selectedLgu || 'all');
              setShowPrintModal(true);
            }}
            className="p-4 bg-surface hover:bg-surface-alt border border-theme hover:border-accent/40 rounded-[18px] transition-all cursor-pointer group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-text-muted group-hover:text-accent transition-colors">Print PDF 🖨️</span>
            </div>
            <div>
              <p className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">Printable Reports</p>
              <p className="text-[12px] text-text-muted truncate mt-0.5">Per-category & overall audit</p>
            </div>
          </motion.div>

          <Link href="/super/analytics">
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-surface hover:bg-surface-alt border border-theme hover:border-accent/40 rounded-[18px] transition-all cursor-pointer group flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-contrast transition-colors">
                  <DocumentText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-text-muted group-hover:text-accent transition-colors">Analytics →</span>
              </div>
              <div>
                <p className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">Platform Analytics</p>
                <p className="text-[12px] text-text-muted truncate mt-0.5">Cross-LGU SLA metrics</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/super/settings">
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-surface hover:bg-surface-alt border border-theme hover:border-accent/40 rounded-[18px] transition-all cursor-pointer group flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-contrast transition-colors">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-text-muted group-hover:text-accent transition-colors">Settings →</span>
              </div>
              <div>
                <p className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">System Settings</p>
                <p className="text-[12px] text-text-muted truncate mt-0.5">Global parameters</p>
              </div>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const rows = (selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus).map(l => [l.name, l.users, l.reports, l.requests, l.responseTime, 'Active'].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
              const csv = ['LGU,People,Reports,Requests,Avg Response,Status', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'lgu-system-summary.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-4 bg-surface hover:bg-surface-alt border border-theme hover:border-accent/40 rounded-[18px] transition-all cursor-pointer group flex flex-col justify-between h-32"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-contrast transition-colors">
                <DocumentDownload className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono text-text-muted group-hover:text-accent transition-colors">Export CSV ↓</span>
            </div>
            <div>
              <p className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">Export Audit Report</p>
              <p className="text-[12px] text-text-muted truncate mt-0.5">Download CSV summary</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Needs Attention + LGU Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-1">
          <NeedsAttentionPanel data={needsAttention} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <Card noBorder className="rounded-[20px] h-full">
            <div className="mb-1">
              <h3 className="text-lg font-bold text-text-primary">LGU Ranking</h3>
              <p className="text-xs font-serif italic text-accent mt-0.5">Compare each LGU by a metric of your choice</p>
            </div>
            <div className="mt-4">
              <LguRankingBarChart data={rankingData} />
            </div>
          </Card>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-8">
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-text-primary">Reports by Status</h3>
          <p className="text-sm font-serif italic text-accent mt-1">
            {selectedLgu
              ? `Status breakdown for ${lgus.find(l => l.id === selectedLgu)?.name || 'selected LGU'}`
              : 'Status breakdown per LGU, across all LGUs'}
          </p>
        </div>
        <Card noBorder className="rounded-[20px]">
          <StatusBreakdownChart data={statusBreakdownData} />
        </Card>
      </div>

      {/* Cross-LGU Reports Map */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">Reports Hotspot Map</h3>
            <p className="text-sm font-serif italic text-accent mt-1">
              {selectedLgu
                ? `Report locations for ${lgus.find(l => l.id === selectedLgu)?.name || 'selected LGU'}`
                : 'Interactive Reports Map across all LGUs'}
            </p>
          </div>
          <Badge variant="default" className="!bg-accent !text-accent-contrast font-semibold px-2.5 py-1 border-0">
            View only
          </Badge>
        </div>
        {!loading && reportPins.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-text-muted bg-surface-alt/30 rounded-2xl">
            No reports with location data{selectedLgu ? ' for this LGU' : ''} yet.
          </div>
        ) : (
          <ReportsMap className="h-[28rem] rounded-[20px] overflow-hidden" reports={reportPins} center={mapCenter} />
        )}
      </div>

      {/* LGU Performance */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">LGU Performance</h3>
            <p className="text-sm font-serif italic text-accent mt-1">Summary of reporting workloads per active LGU</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="!bg-accent !text-accent-contrast !border-0 hover:opacity-90" onClick={() => {
              const rows = (selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus).map(l => [l.name, l.users, l.reports, l.requests, l.responseTime, 'Active'].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
              const csv = ['LGU,People,Reports,Requests,Avg Response,Status', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'lgu-performance.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr>
                <th className="pb-3 pl-10 pr-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">LGU</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">People</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">Reports</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">Requests</th>
                <th className="pb-3 px-6 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider">Avg Response</th>
                <th className="pb-3 pl-6 pr-10 text-[11px] font-medium text-text-primary/80 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {(selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus).map((lgu, i) => (
                <motion.tr
                  key={lgu.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.04, ease: 'easeOut' }}
                  className="bg-surface hover:bg-surface-alt transition-colors group"
                >
                  <td className="py-5 pl-10 pr-6 rounded-l-full">
                    <span className="font-semibold text-[15px] text-text-primary">{lgu.name}</span>
                  </td>
                  <td className="py-5 px-6 text-sm font-mono text-text-muted">{lgu.users.toLocaleString()}</td>
                  <td className="py-5 px-6 text-sm font-mono font-semibold text-text-muted">{lgu.reports}</td>
                  <td className="py-5 px-6 text-sm font-mono font-semibold text-text-muted">{lgu.requests}</td>
                  <td className="py-5 px-6 text-sm text-text-muted">{lgu.responseTime}</td>
                  <td className="py-5 pl-6 pr-10 rounded-r-full text-right">
                    <Badge variant={lgu.status === 'active' ? 'success' : 'default'} className="rounded-full px-3 py-1">
                      {lgu.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE REPORT GENERATOR MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-start overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white print:static">
          
          {/* Modal Header Controls (Hidden during printing) */}
          <div className="print:hidden w-full max-w-[900px] bg-neutral-900 text-white rounded-2xl p-4 mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 border border-neutral-800">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Superadmin Audit Report Generator</h3>
                <p className="text-[11px] text-neutral-400">Configure parameters and print or save as official PDF</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Dropdown */}
              <select
                value={printCategory}
                onChange={(e) => setPrintCategory(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="overall">Overall Platform Executive Audit</option>
                <option value="pothole">Pothole & Road Infrastructure</option>
                <option value="clogged_drainage">Drainage & Waterways</option>
                <option value="stray_animal">Stray Pets & Animal Welfare</option>
                <option value="damaged_pole">Damaged Pole & Utility Hazards</option>
                <option value="eservices">eServices & Municipal Permits</option>
                <option value="moderation">Citizen Moderation & Appeals Audit</option>
              </select>

              {/* LGU Dropdown */}
              <select
                value={printLgu}
                onChange={(e) => setPrintLgu(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All LGUs Combined</option>
                {lgus.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Close ✕
              </button>
            </div>
          </div>

          {/* PRINTABLE DOCUMENT SHEET */}
          <div id="printable-document" className="w-full max-w-[900px] bg-white text-neutral-900 p-8 md:p-10 shadow-2xl rounded-2xl border border-neutral-200 print:shadow-none print:border-0 print:rounded-none print:p-4 my-auto">
            
            {/* Header Block */}
            <div className="border-b-2 border-neutral-900 pb-5 mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-neutral-900 text-white px-2 py-0.5 rounded font-bold">
                    OFFICIAL SYSTEM AUDIT REPORT
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-500">
                    AGAPP MONOREPO • MUNICIPAL CONTROL CENTER
                  </span>
                </div>
                <h1 className="text-2xl font-black text-neutral-900 tracking-tight uppercase">
                  {printCategory === 'overall' ? 'Overall Platform Executive Audit' :
                   printCategory === 'pothole' ? 'Pothole & Road Infrastructure Reports' :
                   printCategory === 'clogged_drainage' ? 'Drainage & Waterways Maintenance Reports' :
                   printCategory === 'stray_animal' ? 'Stray Pets & Animal Welfare Reports' :
                   printCategory === 'damaged_pole' ? 'Damaged Pole & Utility Hazard Reports' :
                   printCategory === 'eservices' ? 'eServices & Municipal Permits Audit' :
                   'Citizen Moderation & Appeals Audit'}
                </h1>
                <p className="text-xs text-neutral-600 mt-1 font-medium">
                  Scope: <span className="font-bold text-neutral-900">{printLgu === 'all' ? 'All Municipalities' : (lgus.find(l => l.id === printLgu)?.name || printLgu)}</span> • Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right border-l-2 border-neutral-200 pl-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">AUTHORITY</p>
                <p className="text-xs font-bold text-neutral-900">Super Admin Office</p>
                <p className="text-[11px] text-neutral-500 font-mono">ID: SA-AUDIT</p>
              </div>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Workload</p>
                <p className="text-xl font-mono font-bold text-neutral-900 mt-0.5">
                  {printCategory === 'eservices'
                    ? (printLgu === 'all' ? dbRequests.length : dbRequests.filter(r => r.lgu_id === printLgu).length)
                    : (printLgu === 'all' ? dbReports.length : dbReports.filter(r => r.lgu_id === printLgu).length)}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{printCategory === 'eservices' ? 'Applications' : 'Incident Reports'}</p>
              </div>

              <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Resolved / Released</p>
                <p className="text-xl font-mono font-bold text-emerald-700 mt-0.5">
                  {printCategory === 'eservices'
                    ? dbRequests.filter(r => (printLgu === 'all' || r.lgu_id === printLgu) && ['Released', 'Approved'].includes(r.status)).length
                    : dbReports.filter(r => (printLgu === 'all' || r.lgu_id === printLgu) && r.status === 'Resolved').length}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Completed Workload</p>
              </div>

              <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Active Municipalities</p>
                <p className="text-xl font-mono font-bold text-neutral-900 mt-0.5">{lgus.length}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">LGUs Operating</p>
              </div>

              <div className="border border-neutral-300 rounded-xl p-3 bg-neutral-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Citizen Accounts</p>
                <p className="text-xl font-mono font-bold text-neutral-900 mt-0.5">{dbUsersList.filter(u => u.role === 'CITIZEN').length}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Registered Base</p>
              </div>
            </div>

            {/* LGU Breakdown Table */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
                LGU Performance & Workload Summary
              </h2>
              <table className="w-full text-xs text-left border-collapse border border-neutral-300">
                <thead>
                  <tr className="bg-neutral-900 text-white font-bold">
                    <th className="p-2 border border-neutral-800">LGU Name</th>
                    <th className="p-2 border border-neutral-800 text-center">Citizen Count</th>
                    <th className="p-2 border border-neutral-800 text-center">Reports Filed</th>
                    <th className="p-2 border border-neutral-800 text-center">eServices Filed</th>
                    <th className="p-2 border border-neutral-800 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lgus
                    .filter(l => printLgu === 'all' || l.id === printLgu)
                    .map((lgu, idx) => {
                      const repCount = dbReports.filter(r => r.lgu_id === lgu.id).length;
                      const reqCount = dbRequests.filter(r => r.lgu_id === lgu.id).length;
                      const citCount = dbUsersList.filter(u => u.lgu_id === lgu.id && u.role === 'CITIZEN').length;
                      return (
                        <tr key={lgu.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                          <td className="p-2 border border-neutral-300 font-semibold">{lgu.name}</td>
                          <td className="p-2 border border-neutral-300 text-center font-mono">{citCount}</td>
                          <td className="p-2 border border-neutral-300 text-center font-mono">{repCount}</td>
                          <td className="p-2 border border-neutral-300 text-center font-mono">{reqCount}</td>
                          <td className="p-2 border border-neutral-300 text-center font-bold text-emerald-700">
                            {lgu.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Itemized Audit Log Table */}
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
                Itemized Audit Entry Log
              </h2>
              {(() => {
                const list = printCategory === 'eservices'
                  ? dbRequests.filter(r => printLgu === 'all' || r.lgu_id === printLgu)
                  : printCategory === 'overall'
                  ? dbReports.filter(r => printLgu === 'all' || r.lgu_id === printLgu)
                  : dbReports.filter(r => (printLgu === 'all' || r.lgu_id === printLgu) && r.category === printCategory);

                if (list.length === 0) {
                  return (
                    <p className="text-xs text-neutral-500 italic p-4 text-center border border-dashed border-neutral-300 rounded-lg">
                      No entries recorded for this selection.
                    </p>
                  );
                }

                return (
                  <table className="w-full text-[11px] text-left border-collapse border border-neutral-300">
                    <thead>
                      <tr className="bg-neutral-200 text-neutral-900 font-bold uppercase">
                        <th className="p-2 border border-neutral-300">Ref #</th>
                        <th className="p-2 border border-neutral-300">LGU</th>
                        <th className="p-2 border border-neutral-300">Type / Category</th>
                        <th className="p-2 border border-neutral-300">Location</th>
                        <th className="p-2 border border-neutral-300">Date Filed</th>
                        <th className="p-2 border border-neutral-300 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.slice(0, 45).map((rec: any, idx: number) => (
                        <tr key={rec.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                          <td className="p-2 border border-neutral-300 font-mono font-bold">{rec.reference_number || rec.id.slice(0, 8)}</td>
                          <td className="p-2 border border-neutral-300">{lgus.find(l => l.id === rec.lgu_id)?.name || rec.lgu_id}</td>
                          <td className="p-2 border border-neutral-300 capitalize">{rec.category || rec.service_type || 'N/A'}</td>
                          <td className="p-2 border border-neutral-300">{rec.barangay || rec.office_name || 'Central'}</td>
                          <td className="p-2 border border-neutral-300">{new Date(rec.created_at).toLocaleDateString()}</td>
                          <td className="p-2 border border-neutral-300 text-center font-semibold">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                              ['Resolved', 'Released', 'Approved'].includes(rec.status)
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Official Certification & Sign-off Section */}
            <div className="pt-8 border-t-2 border-neutral-900 grid grid-cols-2 gap-12 mt-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-8">PREPARED & VERIFIED BY:</p>
                <div className="border-b border-neutral-900 w-3/4 mb-1" />
                <p className="text-xs font-bold text-neutral-900">SUPERADMIN OFFICER</p>
                <p className="text-[10px] text-neutral-500">Agapp Municipal Control Center</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-8">CERTIFIED & NOTED BY:</p>
                <div className="border-b border-neutral-900 w-3/4 mb-1" />
                <p className="text-xs font-bold text-neutral-900">MUNICIPAL ADMINISTRATOR / HEAD OF OFFICE</p>
                <p className="text-[10px] text-neutral-500">Local Government Unit Representative</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
