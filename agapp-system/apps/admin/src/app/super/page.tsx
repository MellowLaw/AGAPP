'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

const BarChart = dynamic(() => import('@/components/ui/Chart').then(m => m.BarChart), { ssr: false });
const LineChart = dynamic(() => import('@/components/ui/Chart').then(m => m.LineChart), { ssr: false });
const PieChart = dynamic(() => import('@/components/ui/Chart').then(m => m.PieChart), { ssr: false });

const Building = dynamic(() => import('@phosphor-icons/react').then(m => m.Building), { ssr: false });
const Users = dynamic(() => import('@phosphor-icons/react').then(m => m.Users), { ssr: false });
const Warning = dynamic(() => import('@phosphor-icons/react').then(m => m.Warning), { ssr: false });
const FileText = dynamic(() => import('@phosphor-icons/react').then(m => m.FileText), { ssr: false });
const Plus = dynamic(() => import('@phosphor-icons/react').then(m => m.Plus), { ssr: false });
const ArrowRight = dynamic(() => import('@phosphor-icons/react').then(m => m.ArrowRight), { ssr: false });

// Months for timeframe selection
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SuperAdminDashboard() {
  const [lgus, setLgus] = useState<any[]>([]);
  const [selectedLgu, setSelectedLgu] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbReports, setDbReports] = useState<any[]>([]);
  const [dbRequests, setDbRequests] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [{ data: dbLgus }, { data: dbUsers }, { data: dbReportsData }, { data: dbRequestsData }] = await Promise.all([
          supabase.from('lgus').select('*'),
          supabase.from('users').select('id, role, lgu_id'),
          supabase.from('reports').select('id, lgu_id, status, created_at'),
          supabase.from('service_requests').select('id, lgu_id, status, created_at'),
        ]);

        if (dbReportsData) setDbReports(dbReportsData);
        if (dbRequestsData) setDbRequests(dbRequestsData);

        if (dbLgus) {
          const mapped = dbLgus.map((lgu: any) => {
            const lguUsers = (dbUsers || []).filter(u => u.lgu_id === lgu.id).length;
            const lguReports = (dbReportsData || []).filter(r => r.lgu_id === lgu.id).length;
            const lguRequests = (dbRequestsData || []).filter(s => s.lgu_id === lgu.id).length;
            return {
              id: lgu.id,
              name: lgu.name,
              status: lgu.is_active ? 'active' : 'inactive',
              users: lguUsers || 0,
              reports: lguReports || 0,
              requests: lguRequests || 0,
              responseTime: '2.0 days',
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

  const [newLguName, setNewLguName] = useState('');
  const [newLguProvince, setNewLguProvince] = useState('Laguna');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [startMonth, setStartMonth] = useState('Jan'); // timeframe start, 6-month window
  const [metric, setMetric] = useState<'reports' | 'requests'>('reports');
  const [perCapita, setPerCapita] = useState(false);
  const [scale, setScale] = useState<'relative' | 'share'>('relative');
  const { showToast, ToastContainer } = useToast();

  // Helpers for timeframe-based trend data
  const getMonths = (start: string, len = 6) => {
    const startIdx = MONTHS.indexOf(start);
    const out: string[] = [];
    for (let i = 0; i < len; i++) out.push(MONTHS[(startIdx + i) % 12]);
    return out;
  };

  const buildTrendsData = () => {
    const months = getMonths(startMonth, 6);
    return months.map((m) => {
      const idx = MONTHS.indexOf(m);
      const filteredReports = (dbReports || []).filter(r => {
        if (selectedLgu && r.lgu_id !== selectedLgu) return false;
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        return d.getMonth() === idx;
      });
      const filteredRequests = (dbRequests || []).filter(req => {
        if (selectedLgu && req.lgu_id !== selectedLgu) return false;
        if (!req.created_at) return false;
        const d = new Date(req.created_at);
        return d.getMonth() === idx;
      });
      return { month: m, reports: filteredReports.length, requests: filteredRequests.length };
    });
  };

  const statusData = useMemo(() => {
    const counts = { submitted: 0, review: 0, progress: 0, resolved: 0, rejected: 0 };
    dbReports.forEach(r => {
      if (selectedLgu && r.lgu_id !== selectedLgu) return;
      if (r.status === 'Submitted') counts.submitted++;
      else if (r.status === 'Under Review') counts.review++;
      else if (r.status === 'In Progress') counts.progress++;
      else if (r.status === 'Resolved') counts.resolved++;
      else if (r.status === 'Rejected') counts.rejected++;
    });
    return [
      { label: 'Submitted', value: counts.submitted, color: '#ca8a04' },
      { label: 'Under Review', value: counts.review, color: '#2563eb' },
      { label: 'In Progress', value: counts.progress, color: '#7c3aed' },
      { label: 'Resolved', value: counts.resolved, color: '#16a34a' },
      { label: 'Rejected', value: counts.rejected, color: '#dc2626' },
    ];
  }, [dbReports, selectedLgu]);

  const handleAddLgu = () => {
    if (!newLguName.trim()) {
      showToast('Please enter a municipality name', 'error');
      return;
    }
    
    const newLgu = {
      id: newLguName.toLowerCase().replace(/\s+/g, '-'),
      name: `${newLguName}, ${newLguProvince}`,
      status: 'active' as const,
      reports: 0,
      requests: 0,
      users: 0,
      responseTime: 'N/A'
    };
    
    setLgus([...lgus, newLgu]);
    setNewLguName('');
    setNewLguProvince('Laguna');
    setAdminEmail('');
    setAdminPassword('');
    setShowAddModal(false);
    showToast(
      `LGU "${newLguName}, ${newLguProvince}" added successfully.`,
      'success'
    );
  };

  return (
    <DashboardLayout 
      role="super-admin"
      title="Cross-LGU Analytics"
    >
      <ToastContainer />
      
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Reports by LGU */}
        <Card className="shadow-sm border border-[#e5e5e5]">
          <CardHeader 
            title="Reports by LGU" 
            action={
              <Link href="/super/lgus">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            }
          />
          {/* Action Row - Prevents Text Bleeding */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#f0f0f0] text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[#737373] font-medium">Metric:</span>
                <select 
                  value={metric} 
                  onChange={(e) => setMetric(e.target.value as 'reports' | 'requests')}
                  className="px-2.5 py-1.5 bg-white border border-[#e5e5e5] rounded-md font-semibold text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                  title="Metric"
                >
                  <option value="reports">Reports</option>
                  <option value="requests">Requests</option>
                </select>
              </div>
              
              <label className="flex items-center gap-1.5 font-medium text-[#1a1a1a] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={perCapita} 
                  onChange={(e) => setPerCapita(e.target.checked)} 
                  className="rounded text-[#1a1a1a] focus:ring-[#1a1a1a] w-3.5 h-3.5"
                />
                Normalize (per 1k users)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#737373] font-medium">Scale:</span>
              <div className="flex rounded-md border border-[#e5e5e5] overflow-hidden bg-white p-0.5">
                <button
                  onClick={() => setScale('relative')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${scale==='relative' ? 'bg-[#1a1a1a] text-white' : 'text-[#737373] hover:bg-gray-50'}`}
                  title="Bar length relative to the top LGU"
                >
                  Relative
                </button>
                <button
                  onClick={() => setScale('share')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${scale==='share' ? 'bg-[#1a1a1a] text-white' : 'text-[#737373] hover:bg-gray-50'}`}
                  title="Bar length is share of total (adds to 100%)"
                >
                  Share
                </button>
              </div>
            </div>
          </div>

          {(() => {
            const source = (selectedLgu ? lgus.filter(l => l.id === selectedLgu) : lgus);
            const barItems = source.map(l => {
              const raw = metric === 'reports' ? l.reports : l.requests;
              const value = perCapita ? Math.round((raw / Math.max(1, l.users)) * 1000) : raw;
              return {
                label: l.name,
                value,
                color: metric === 'reports' ? '#2563eb' : '#16a34a',
              };
            });
            const total = barItems.reduce((s, i) => s + i.value, 0);
            return (
              <div className="pt-2">
                <BarChart 
                  data={barItems}
                  sort="desc"
                  axisOnHover
                  labelPosition="top" // placed above bars to prevent text truncation
                  maxValue={scale === 'share' ? Math.max(1, total) : undefined}
                  valueFormatter={(n) => perCapita ? `${n.toLocaleString()}/1k` : n.toLocaleString()}
                  onBarClick={(label) => {
                    const match = lgus.find(l => l.name === label);
                    if (match) setSelectedLgu(match.id);
                  }}
                  selectedLabel={(selectedLgu ? lgus.find(l => l.id === selectedLgu)?.name : undefined) || undefined}
                />
              </div>
            );
          })()}
        </Card>

        {/* Service Request Trends */}
        <Card className="shadow-sm border border-[#e5e5e5]">
          <CardHeader 
            title="Trend Monitoring (Jan-Jun)"
            action={
              <Badge variant="default" className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1">Database Sync</Badge>
            }
          />
          {/* Action Row - Prevents Text Bleeding */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#f0f0f0] text-xs">
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
              <span className="text-[#737373] font-medium">Start:</span>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#e5e5e5] rounded-md font-semibold text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                title="Start month (6-month window)"
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <LineChart 
            height={250}
            data={buildTrendsData()}
          />
        </Card>
      </div>

      {/* Grid for Leaderboard and System Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LGU Performance Leaderboard */}
        <Card className="lg:col-span-2 shadow-sm border border-[#e5e5e5]">
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

        {/* System Status Breakdown (Donut Chart) */}
        <Card className="shadow-sm border border-[#e5e5e5]">
          <CardHeader 
            title="Status Distribution" 
            subtitle="Overall report lifecycle breakdown"
          />
          <div className="flex items-center justify-center pt-4">
            <PieChart 
              size={180}
              data={statusData}
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
