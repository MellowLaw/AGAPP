'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const BarChart = dynamic(() => import('@/components/ui/Chart').then(m => m.BarChart), { ssr: false });
const LineChart = dynamic(() => import('@/components/ui/Chart').then(m => m.LineChart), { ssr: false });
const PieChart = dynamic(() => import('@/components/ui/Chart').then(m => m.PieChart), { ssr: false });

const Warning = dynamic(() => import('@phosphor-icons/react').then(m => m.Warning), { ssr: false });
const FileText = dynamic(() => import('@phosphor-icons/react').then(m => m.FileText), { ssr: false });
const ChatCircle = dynamic(() => import('@phosphor-icons/react').then(m => m.ChatCircle), { ssr: false });
const CheckCircle = dynamic(() => import('@phosphor-icons/react').then(m => m.CheckCircle), { ssr: false });
const ArrowRight = dynamic(() => import('@phosphor-icons/react').then(m => m.ArrowRight), { ssr: false });
const MapPin = dynamic(() => import('@phosphor-icons/react').then(m => m.MapPin), { ssr: false });
const IdentificationBadge = dynamic(() => import('@phosphor-icons/react').then(m => m.IdentificationBadge), { ssr: false });

type DbReportStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

type DashboardReportStatus = 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';

const mapDbStatusToDashboard = (status: string): DashboardReportStatus => {
  switch (status as DbReportStatus) {
    case 'Submitted':
      return 'pending';
    case 'Under Review':
      return 'acknowledged';
    case 'In Progress':
      return 'in_progress';
    case 'Resolved':
      return 'resolved';
    case 'Rejected':
      return 'rejected';
    default:
      return 'pending';
  }
};

const mapDbCategoryToLabel = (category: string): string => {
  switch (category) {
    case 'pothole':
      return 'Pothole';
    case 'clogged_drainage':
      return 'Drainage';
    case 'stray_animal':
      return 'Stray Animal';
    default:
      return category || 'Other';
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const lguParam = params?.get('lguName') || 'Liliw, Laguna';
  const reportsHref = lguParam ? `/lgu/reports?lguName=${encodeURIComponent(lguParam)}` : '/lgu/reports';
  const lguId = lguParam.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-');
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [startMonth, setStartMonth] = useState('Jan');
  const months = useMemo(() => {
    const startIdx = MONTHS.indexOf(startMonth);
    return Array.from({ length: 6 }, (_, i) => MONTHS[(startIdx + i) % 12]);
  }, [startMonth]);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [serviceRows, setServiceRows] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);

      const [{ data: reportsData, error: reportsError }, { data: servicesData, error: servicesError }, { data: verifData, error: verifError }] = await Promise.all([
        supabase
          .from('reports')
          .select('id, reference_number, category, status, barangay, created_at')
          .eq('lgu_id', lguId),
        supabase
          .from('service_requests')
          .select('id, reference_number, status, created_at')
          .eq('lgu_id', lguId),
        supabase
          .from('verification_requests')
          .select('id, status')
          .eq('lgu_id', lguId)
          .eq('status', 'pending'),
      ]);

      if (reportsError || servicesError) {
        console.error('Error loading dashboard metrics', reportsError || servicesError);
        setLoadError((reportsError || servicesError)?.message || 'Unknown error');
        setReportRows([]);
        setServiceRows([]);
        setLoading(false);
        return;
      }

      setReportRows(reportsData || []);
      setServiceRows(servicesData || []);
      if (!verifError) setPendingVerifications(verifData?.length || 0);
      setLoading(false);
    };

    fetchData();
  }, [lguId]);

  const stats = useMemo(() => {
    const submittedCount = reportRows.filter((r) => r.status === 'Submitted').length;
    const underReviewCount = reportRows.filter((r) => r.status === 'Under Review').length;
    const totalServiceRequests = serviceRows.length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const resolvedThisWeek = reportRows.filter(
      (r) => r.status === 'Resolved' && r.created_at && new Date(r.created_at) >= sevenDaysAgo
    ).length;
    const verifHref = lguParam ? `/lgu/verifications?lguName=${encodeURIComponent(lguParam)}` : '/lgu/verifications';

    return [
      {
        label: 'Pending Reports',
        value: submittedCount.toString(),
        change: underReviewCount > 0 ? `${underReviewCount} under review` : '',
        icon: Warning,
        color: 'text-[#ca8a04]',
      },
      { label: 'Service Requests', value: totalServiceRequests.toString(), change: '', icon: FileText, color: 'text-[#2563eb]' },
      {
        label: 'Pending Verifications',
        value: pendingVerifications.toString(),
        change: pendingVerifications > 0 ? 'needs review' : 'all caught up',
        icon: IdentificationBadge,
        color: pendingVerifications > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]',
        href: verifHref,
      },
      { label: 'Resolved This Week', value: resolvedThisWeek.toString(), change: '', icon: CheckCircle, color: 'text-[#16a34a]' },
    ];
  }, [reportRows, serviceRows, pendingVerifications, lguParam]);

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {
      pothole: 0,
      clogged_drainage: 0,
      stray_animal: 0,
      other: 0,
    };

    reportRows.forEach((r) => {
      const key = r.category || 'other';
      if (key in counts) {
        counts[key]++;
      } else {
        counts.other++;
      }
    });

    return [
      { label: 'Potholes', value: counts.pothole, color: '#ca8a04' },
      { label: 'Drainage', value: counts.clogged_drainage, color: '#2563eb' },
      { label: 'Stray Animals', value: counts.stray_animal, color: '#7c3aed' },
      { label: 'Others', value: counts.other, color: '#dc2626' },
    ];
  }, [reportRows]);

  const statusChartData = useMemo(() => {
    const counts = {
      submitted: 0,
      under_review: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    };

    reportRows.forEach((r) => {
      switch (r.status as DbReportStatus | null) {
        case 'Submitted':
          counts.submitted++;
          break;
        case 'Under Review':
          counts.under_review++;
          break;
        case 'In Progress':
          counts.in_progress++;
          break;
        case 'Resolved':
          counts.resolved++;
          break;
        case 'Rejected':
          counts.rejected++;
          break;
        default:
          break;
      }
    });

    return [
      { label: 'Submitted',    value: counts.submitted,    color: '#ca8a04' },
      { label: 'Under Review', value: counts.under_review, color: '#2563eb' },
      { label: 'In Progress',  value: counts.in_progress,  color: '#7c3aed' },
      { label: 'Resolved',     value: counts.resolved,     color: '#16a34a' },
      { label: 'Rejected',     value: counts.rejected,     color: '#dc2626' },
    ];
  }, [reportRows]);

  const trends = useMemo(() => {
    const buckets = months.map((m) => ({ month: m, reports: 0, requests: 0 }));

    const monthFromDate = (d: Date) => MONTHS[d.getMonth()];

    reportRows.forEach((r) => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      const m = monthFromDate(d);
      const idx = months.indexOf(m);
      if (idx !== -1) buckets[idx].reports++;
    });

    serviceRows.forEach((s) => {
      if (!s.created_at) return;
      const d = new Date(s.created_at);
      const m = monthFromDate(d);
      const idx = months.indexOf(m);
      if (idx !== -1) buckets[idx].requests++;
    });

    return buckets;
  }, [months, MONTHS, reportRows, serviceRows]);

  const recentReports = useMemo(() => {
    const sorted = [...reportRows].sort((a, b) => {
      const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bd - ad;
    });

    return sorted.slice(0, 10).map((r) => ({
      id: r.reference_number || r.id,
      category: mapDbCategoryToLabel(r.category),
      location: r.barangay,
      status: mapDbStatusToDashboard(r.status || 'Submitted'),
      time: r.created_at ? new Date(r.created_at).toLocaleString() : '',
    }));
  }, [reportRows]);

  return (
    <DashboardLayout 
      role="lgu-admin" 
      title="Dashboard Overview"
    >
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-[#737373] bg-[#f5f5f5] rounded-md animate-pulse">
          Loading dashboard metrics…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-[#dc2626] bg-[#fef2f2] rounded-md">
          Failed to load dashboard metrics: {loadError}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#737373]">{stat.label}</p>
                <p className="text-2xl font-bold text-[#1a1a1a] mt-1.5">{stat.value}</p>
                {stat.change && (
                  <p className="text-[10px] text-[#ca8a04] font-medium mt-1">{stat.change}</p>
                )}
              </div>
              <div className="p-2 bg-[#f5f5f5] rounded-lg">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
          return (
            <Card key={stat.label} padding="sm" className="shadow-sm border border-[#e5e5e5] hover:border-gray-300 transition-all duration-200">
              {stat.href ? <Link href={stat.href}>{content}</Link> : content}
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Report Volume */}
        <Card className="shadow-sm border border-[#e5e5e5]">
          <CardHeader 
            title="Report Volume by Category" 
            action={
              <Link href={reportsHref}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            }
          />
          <div className="pt-2">
            <BarChart 
              data={categoryChartData}
              labelPosition="top" // shows category above bars to prevent squishing
            />
          </div>
        </Card>

        {/* Report Status Distribution */}
        <Card className="shadow-sm border border-[#e5e5e5]">
          <CardHeader 
            title="Report Status Distribution"
            action={
              <Link href={reportsHref}>
                <Button variant="ghost" size="sm">View Details</Button>
              </Link>
            }
          />
          <div className="flex items-center justify-center pt-4">
            <PieChart 
              size={180}
              data={statusChartData}
            />
          </div>
        </Card>
      </div>

      {/* Trends Section */}
      <Card className="mb-6 shadow-sm border border-[#e5e5e5]" padding="none">
        <div className="p-6">
          <CardHeader 
            title="Service Request & Issue Trends" 
            action={
              <Badge variant="default" className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1">Synced</Badge>
            }
          />
        </div>
        {/* Timeframe Control Bar - Prevents Bleeding */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#f0f0f0] text-xs px-6">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStartMonth('Jan')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${startMonth==='Jan' ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e5e5e5] text-[#737373] hover:bg-gray-50'}`}
            >
              Jan–Jun
            </button>
            <button
              onClick={() => setStartMonth('Jul')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${startMonth==='Jul' ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e5e5e5] text-[#737373] hover:bg-gray-50'}`}
            >
              Jul–Dec
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#737373] font-medium">Start Month:</span>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#e5e5e5] rounded-md font-semibold text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
              title="Start month"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 pb-6">
          <LineChart data={trends} height={240} />
        </div>
      </Card>

      {/* Recent Submissions */}
      <Card className="shadow-sm border border-[#e5e5e5]">
        <CardHeader 
          title="Recent Submissions"
          action={
            <Link href={reportsHref}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          }
        />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] text-left">
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Location</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#737373] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr 
                  key={report.id} 
                  className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-all cursor-pointer"
                  onClick={() => router.push(`/lgu/reports?lguName=${encodeURIComponent(lguParam)}&reportId=${encodeURIComponent(report.id)}`)}
                >
                  <td className="py-4 px-4 text-sm font-semibold text-[#1a1a1a]">{report.id}</td>
                  <td className="py-4 px-4 text-sm text-[#525252] font-medium">{report.category}</td>
                  <td className="py-4 px-4 text-sm text-[#737373]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#a3a3a3]" />
                      {report.location}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge 
                      variant={
                        report.status === 'resolved' ? 'success' :
                        report.status === 'in_progress' ? 'info' :
                        report.status === 'acknowledged' ? 'default' :
                        'warning'
                      }
                    >
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-xs text-[#737373] font-medium">{report.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
