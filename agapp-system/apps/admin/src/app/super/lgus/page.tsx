'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search } from '@/components/ui/Search';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatAvgTurnaround } from '@/lib/turnaround';
import { CaretDown, Eye, Power, UserSwitch, Download } from '@phosphor-icons/react';

interface Lgu {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  users: number;
  reports: number;
  requests: number;
  responseTime: string;
  logo: string;
  banner_url: string | null;
  primary_color: string;
  secondary_color: string;
  latitude: number;
  longitude: number;
  onboarding_fee_paid: boolean;
  feature_flags: {
    chatbot: boolean;
    potholeDetection: boolean;
    forum: boolean;
  };
}

const MUNICIPALITY_OPTIONS = [
  'Pila, Laguna',
  'Sta. Cruz, Laguna',
  'Pagsanjan, Laguna',
  'Lumban, Laguna',
  'Majayjay, Laguna',
];

export default function SuperLgusPage() {
  const [lgus, setLgus] = useState<Lgu[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedLguForEdit, setSelectedLguForEdit] = useState<Lgu | null>(null);
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLgus = async () => {
      setLoading(true);
      setLoadError(null);
      
      try {
        const [{ data: lguData, error: lguError }, { data: dbUsers }, { data: dbReports }, { data: dbRequests }] = await Promise.all([
          supabase.from('lgus').select('*'),
          supabase.from('users').select('id, lgu_id'),
          supabase.from('reports').select('id, lgu_id, status, created_at, updated_at'),
          supabase.from('service_requests').select('id, lgu_id, status, created_at, updated_at'),
        ]);

        if (lguError) {
          console.error('Error loading LGUs', lguError);
          setLoadError(lguError.message);
          setLoading(false);
          return;
        }

        if (lguData) {
          const mapped: Lgu[] = lguData.map((row: any) => {
            const lguUsers = (dbUsers || []).filter(u => u.lgu_id === row.id).length;
            const lguOwnReports = (dbReports || []).filter(r => r.lgu_id === row.id);
            const lguOwnRequests = (dbRequests || []).filter(s => s.lgu_id === row.id);
            return {
              id: row.id,
              name: row.name,
              status: row.is_active === false ? 'inactive' : 'active',
              users: lguUsers || 0,
              reports: lguOwnReports.length,
              requests: lguOwnRequests.length,
              responseTime: formatAvgTurnaround(lguOwnReports, lguOwnRequests),
              logo: row.logo || '',
              banner_url: row.banner_url || null,
              primary_color: row.primary_color || '#A2B59F',
              secondary_color: row.secondary_color || '#9FADB5',
              latitude: row.latitude || 0,
              longitude: row.longitude || 0,
              onboarding_fee_paid: !!row.onboarding_fee_paid,
              feature_flags: row.feature_flags || { chatbot: true, potholeDetection: true, forum: true },
            };
          });
          setLgus(mapped);
        }
      } catch (err: any) {
        console.error('Failed to load LGU profiles', err);
        setLoadError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLgus();
  }, []);

  const existingNames = useMemo(() => new Set(lgus.map(l => l.name)), [lgus]);
  const addable = MUNICIPALITY_OPTIONS.filter(n => !existingNames.has(n));

  const filtered = lgus.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (name: string) => {
    const id = name.split(',')[0].toLowerCase().replace(/\s+/g, '-');
    const newLgu: Lgu = {
      id,
      name,
      status: 'active',
      users: 0,
      reports: 0,
      requests: 0,
      responseTime: 'N/A',
      logo: '',
      banner_url: null,
      primary_color: '#A2B59F',
      secondary_color: '#9FADB5',
      latitude: 0,
      longitude: 0,
      onboarding_fee_paid: false,
      feature_flags: { chatbot: true, potholeDetection: true, forum: true },
    };

    // Optimistically add to list
    setLgus(prev => [...prev, newLgu]);
    setAddOpen(false);

    const { error } = await supabase
      .from('lgus')
      .insert({
        id,
        name,
        logo: '',
        banner_url: null,
        primary_color: '#A2B59F',
        secondary_color: '#9FADB5',
        latitude: 0,
        longitude: 0,
        is_active: true,
        onboarding_fee_paid: false,
        feature_flags: { chatbot: true, potholeDetection: true, forum: true },
      });

    if (error) {
      console.error('Failed to add LGU', error);
      setLgus(prev => prev.filter(l => l.id !== id));
      showToast('Failed to add LGU. Please try again.', 'error');
      return;
    }

    showToast(`Added ${name}.`, 'success');
  };

  const toggleActive = async (id: string) => {
    const target = lgus.find(l => l.id === id);
    if (!target) return;

    const newStatus: 'active' | 'inactive' = target.status === 'active' ? 'inactive' : 'active';
    setLgus(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));

    const { error } = await supabase
      .from('lgus')
      .update({ is_active: newStatus === 'active' })
      .eq('id', id);

    if (error) {
      console.error('Failed to update LGU status', error);
      // rollback
      setLgus(prev => prev.map(l => l.id === id ? { ...l, status: target.status } : l));
      showToast('Failed to update LGU status. Please try again.', 'error');
      return;
    }

    showToast(`LGU ${target.name} is now ${newStatus === 'active' ? 'Active' : 'Inactive'}.`, 'success');
  };

  const handleSaveLgu = async () => {
    if (!selectedLguForEdit) return;

    const { error } = await supabase
      .from('lgus')
      .update({
        latitude: selectedLguForEdit.latitude,
        longitude: selectedLguForEdit.longitude,
        primary_color: selectedLguForEdit.primary_color,
        secondary_color: selectedLguForEdit.secondary_color,
        onboarding_fee_paid: selectedLguForEdit.onboarding_fee_paid,
        feature_flags: selectedLguForEdit.feature_flags,
      })
      .eq('id', selectedLguForEdit.id);

    if (error) {
      console.error('Failed to update LGU profile', error);
      showToast('Failed to update LGU profile. Please try again.', 'error');
      return;
    }

    setLgus(prev => prev.map(l => l.id === selectedLguForEdit.id ? selectedLguForEdit : l));
    const name = selectedLguForEdit.name;
    setSelectedLguForEdit(null);
    showToast(`Updated profile configurations for ${name}.`, 'success');
  };

  const impersonate = (id: string, name: string) => {
    const url = `/lgu/dashboard?lguName=${encodeURIComponent(name)}`;
    window.location.href = url;
  };

  return (
    <DashboardLayout role="super-admin" title="LGU Directory">
      <ToastContainer />
      {loading && (
        <div className="mb-3 px-4 py-2 text-sm text-[#737373] bg-[#f5f5f5] rounded-md">
          Loading LGUs…
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 px-4 py-2 text-sm text-[#dc2626] bg-[#fef2f2] rounded-md">
          Failed to load LGUs: {loadError}
        </div>
      )}
      <Card>
        <CardHeader 
          title="Municipalities" 
          action={
            <div className="relative">
              <Button onClick={() => setAddOpen(v => !v)}>
                <CaretDown className="w-4 h-4 mr-1" />
                Add LGU
              </Button>
              {addOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e5e5e5] rounded-md shadow-md p-2 z-10">
                  {addable.length === 0 ? (
                    <p className="text-sm text-[#737373] px-2 py-1">All sample LGUs added</p>
                  ) : addable.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleAdd(opt)}
                      className="w-full text-left px-2 py-2 text-sm rounded hover:bg-[#f5f5f5]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        />

        <div className="flex items-center justify-between mb-4">
          <Search value={search} onChange={setSearch} className="max-w-md" placeholder="Search municipality..." />
          <Button 
            variant="secondary"
            onClick={handleExportCsv}
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#737373]">LGU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#737373]">Users</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#737373]">Reports</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#737373]">Requests</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#737373]">Avg Response</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#737373]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#737373]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lgu) => (
                <tr key={lgu.id} className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa]">
                  <td className="py-3 px-4 font-medium text-[#1a1a1a]">{lgu.name}</td>
                  <td className="py-3 px-4 text-sm text-[#1a1a1a]">{lgu.users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#1a1a1a]">{lgu.reports}</td>
                  <td className="py-3 px-4 text-sm text-[#1a1a1a]">{lgu.requests}</td>
                  <td className="py-3 px-4 text-sm text-[#1a1a1a]">{lgu.responseTime}</td>
                  <td className="py-3 px-4">
                    <Badge variant={lgu.status === 'active' ? 'success' : 'default'}>
                      {lgu.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLguForEdit({ ...lgu })}>
                        <Eye className="w-4 h-4 mr-1" /> Configure
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => toggleActive(lgu.id)}>
                        <Power className="w-4 h-4 mr-1" /> {lgu.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => impersonate(lgu.id, lgu.name)}>
                        <UserSwitch className="w-4 h-4 mr-1" /> Impersonate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* LGU Settings Modal */}
      {selectedLguForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-lg border border-[#e5e5e5] p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-[#e5e5e5] pb-3 mb-4">
              <h3 className="text-lg font-bold text-[#1a1a1a]">Configure LGU: {selectedLguForEdit.name}</h3>
              <button onClick={() => setSelectedLguForEdit(null)} className="text-[#a3a3a3] hover:text-[#1a1a1a] font-bold">✕</button>
            </div>
            
            <div className="space-y-5">
              {/* Latitude and Longitude */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#737373] uppercase mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedLguForEdit.latitude || 0}
                    onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, latitude: parseFloat(e.target.value || '0') })}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#737373] uppercase mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedLguForEdit.longitude || 0}
                    onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, longitude: parseFloat(e.target.value || '0') })}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#737373] uppercase mb-1.5">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedLguForEdit.primary_color || '#ffffff'}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, primary_color: e.target.value })}
                      className="w-10 h-10 border border-[#e5e5e5] rounded-md p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedLguForEdit.primary_color || ''}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, primary_color: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#737373] uppercase mb-1.5">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedLguForEdit.secondary_color || '#ffffff'}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, secondary_color: e.target.value })}
                      className="w-10 h-10 border border-[#e5e5e5] rounded-md p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedLguForEdit.secondary_color || ''}
                      onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, secondary_color: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm font-mono focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                </div>
              </div>

              {/* Onboarding payment status */}
              <label className="flex items-center gap-2.5 py-2 border-b border-[#e5e5e5] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLguForEdit.onboarding_fee_paid || false}
                  onChange={(e) => setSelectedLguForEdit({ ...selectedLguForEdit, onboarding_fee_paid: e.target.checked })}
                  className="rounded text-[#1a1a1a] focus:ring-[#1a1a1a] w-4 h-4"
                />
                <span className="text-sm font-semibold text-[#1a1a1a]">Onboarding Fee Paid (Active License)</span>
              </label>

              {/* Feature Flags */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#737373] uppercase tracking-wider">Feature Flags</p>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLguForEdit.feature_flags?.chatbot || false}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags!, chatbot: e.target.checked }
                      })}
                      className="rounded text-[#1a1a1a] focus:ring-[#1a1a1a] w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-[#1a1a1a]">Chatbot</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLguForEdit.feature_flags?.potholeDetection || false}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags!, potholeDetection: e.target.checked }
                      })}
                      className="rounded text-[#1a1a1a] focus:ring-[#1a1a1a] w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-[#1a1a1a]">AI Pothole</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLguForEdit.feature_flags?.forum || false}
                      onChange={(e) => setSelectedLguForEdit({
                        ...selectedLguForEdit,
                        feature_flags: { ...selectedLguForEdit.feature_flags!, forum: e.target.checked }
                      })}
                      className="rounded text-[#1a1a1a] focus:ring-[#1a1a1a] w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-[#1a1a1a]">Forum</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-[#e5e5e5] pt-4 justify-end">
              <Button variant="secondary" onClick={() => setSelectedLguForEdit(null)}>Cancel</Button>
              <Button onClick={handleSaveLgu}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );

  function handleExportCsv() {
    const rows = filtered.map(l => [l.name, l.users, l.reports, l.requests, l.responseTime, l.status].map(v => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : String(v)).join(','));
    const csv = ['LGU,Users,Reports,Requests,Avg Response,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lgu-directory.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
