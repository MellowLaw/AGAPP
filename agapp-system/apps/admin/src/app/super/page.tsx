'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { formatAvgTurnaround } from '@/lib/turnaround';
import { ReportsMap, type ReportPin } from '@/components/map';
import { Building, Users, Warning, FileText, Plus } from '@phosphor-icons/react';

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

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [{ data: dbLgus }, { data: dbUsers }, { data: dbReportsData }, { data: dbRequestsData }] = await Promise.all([
          supabase.from('lgus').select('id, name, is_active, latitude, longitude'),
          supabase.from('users').select('id, role, lgu_id'),
          supabase
            .from('reports')
            .select('id, lgu_id, status, created_at, updated_at, reference_number, category, barangay, latitude, longitude, photo_url'),
          supabase.from('service_requests').select('id, lgu_id, status, created_at, updated_at'),
        ]);

        if (dbReportsData) setDbReports(dbReportsData);

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
        label: 'Active Users',
        value: filteredLgus.reduce((sum, l) => sum + l.users, 0).toLocaleString(),
        icon: Users
      },
      {
        label: 'Reports Seeded',
        value: filteredLgus.reduce((sum, l) => sum + l.reports, 0).toString(),
        icon: Warning
      },
      {
        label: 'Service Requests',
        value: filteredLgus.reduce((sum, l) => sum + l.requests, 0).toString(),
        icon: FileText
      },
    ];
  }, [selectedLgu, filteredLgus]);

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
      title="Cross-LGU Analytics"
    >
      {/* LGU Filter Tabs */}
      <div className="flex items-center gap-2.5 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedLgu(null)}
          className={`px-4.5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all ${
            selectedLgu === null
              ? 'bg-[#1a1a1a] text-white'
              : 'bg-white border border-[#e5e5e5] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
          }`}
        >
          All LGUs
        </button>
        {lgus.map(lgu => (
          <button
            key={lgu.id}
            onClick={() => setSelectedLgu(lgu.id)}
            className={`px-4.5 py-2 rounded-full text-xs font-semibold shadow-sm transition-all ${
              selectedLgu === lgu.id
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-white border border-[#e5e5e5] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
            }`}
          >
            {lgu.name}
          </button>
        ))}
        <Link href="/super/lgus">
          <button
            className="px-4 py-2 bg-white border border-[#e5e5e5] rounded-full text-xs font-semibold text-[#1a1a1a] hover:bg-[#f5f5f5] flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add LGU
          </button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="sm" className="shadow-sm border border-[#e5e5e5] hover:border-gray-300 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#a3a3a3] uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5">{stat.value}</p>
                </div>
                <div className="p-2 bg-[#f5f5f5] rounded-lg">
                  <Icon className="w-5 h-5 text-[#737373]" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Cross-LGU Reports Map — replaces the old bar/line/pie charts with the
          actual geography of citizen reports. View-only by design: the super
          admin monitors, only the owning LGU acts on a report. */}
      <Card className="mb-6 shadow-sm border border-[#e5e5e5]">
        <CardHeader
          title="Reports Map"
          subtitle={selectedLgu
            ? `Report locations for ${lgus.find(l => l.id === selectedLgu)?.name || 'selected LGU'}`
            : 'Report locations across all LGUs — click a pin for details'}
          action={
            <Badge variant="default" className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1">
              View only
            </Badge>
          }
        />
        {!loading && reportPins.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-[#737373]">
            No reports with location data{selectedLgu ? ' for this LGU' : ''} yet.
          </div>
        ) : (
          <ReportsMap className="h-[28rem]" reports={reportPins} center={mapCenter} />
        )}
      </Card>

      {/* LGU Performance Leaderboard */}
      <Card className="shadow-sm border border-[#e5e5e5]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">LGU Performance Leaderboard</h3>
            <p className="text-xs text-[#a3a3a3] mt-0.5">Summary of reporting workloads per active tenant</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => {
              const rows = (selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus).map(l => [l.name, l.users, l.reports, l.requests, l.responseTime, 'Active'].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
              const csv = ['LGU,Users,Reports,Requests,Avg Response,Status', ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'lgu-leaderboard.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-left">
                <th className="py-3 px-4 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">LGU</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Users</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Reports</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Requests</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Avg Response</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {(selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus).map((lgu) => (
                <tr
                  key={lgu.id}
                  className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-all"
                >
                  <td className="py-4.5 px-4">
                    <span className="font-semibold text-sm text-[#1a1a1a]">{lgu.name}</span>
                  </td>
                  <td className="py-4.5 px-4 text-sm text-[#525252] font-medium">{lgu.users.toLocaleString()}</td>
                  <td className="py-4.5 px-4 text-sm text-[#525252] font-semibold">{lgu.reports}</td>
                  <td className="py-4.5 px-4 text-sm text-[#525252] font-semibold">{lgu.requests}</td>
                  <td className="py-4.5 px-4 text-sm text-[#525252] font-medium">{lgu.responseTime}</td>
                  <td className="py-4.5 px-4">
                    <Badge variant={lgu.status === 'active' ? 'success' : 'default'}>
                      {lgu.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
