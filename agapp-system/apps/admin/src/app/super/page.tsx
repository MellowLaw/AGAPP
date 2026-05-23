'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, Shield, SignOut, Plus, 
  CaretRight, Check, X, ChartBar, HardDrive, Bell 
} from '@phosphor-icons/react';

// Muted pastels seed configurations
const INITIAL_LGUS = [
  {
    id: 'liliw-laguna', name: 'Municipality of Liliw',
    logo: 'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
    primaryColor: '#A2B59F', secondaryColor: '#D9CDB8',
    province: 'Laguna', latitude: 13.9297, longitude: 121.4644,
    isActive: true, onboardingFeePaid: true, tier: 'Pro',
    featureFlags: { chatbot: true, potholeDetection: true, forum: true }
  },
  {
    id: 'nagcarlan-laguna', name: 'Municipality of Nagcarlan',
    logo: 'https://placehold.co/100x100/9FADB5/1A1A1A?text=NAGC',
    primaryColor: '#9FADB5', secondaryColor: '#CAD3D9',
    province: 'Laguna', latitude: 13.9214, longitude: 121.4157,
    isActive: true, onboardingFeePaid: false, tier: 'Standard',
    featureFlags: { chatbot: false, potholeDetection: true, forum: false }
  },
  {
    id: 'magdalena-laguna', name: 'Municipality of Magdalena',
    logo: 'https://placehold.co/100x100/AE9FB5/1A1A1A?text=MGDL',
    primaryColor: '#AE9FB5', secondaryColor: '#DFD9E3',
    province: 'Laguna', latitude: 13.9692, longitude: 121.4278,
    isActive: false, onboardingFeePaid: false, tier: 'Onboarding',
    featureFlags: { chatbot: false, potholeDetection: false, forum: false }
  }
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [lgus, setLgus] = useState(INITIAL_LGUS);
  const [showModal, setShowModal] = useState(false);
  const [newLgu, setNewLgu] = useState({
    name: '',
    province: 'Laguna',
    primaryColor: '#A2B59F',
    secondaryColor: '#D9CDB8',
    latitude: 13.9297,
    longitude: 121.4644
  });

  const handleToggleFlag = (id: string, flag: 'chatbot' | 'potholeDetection' | 'forum') => {
    setLgus(prev => prev.map(lgu => {
      if (lgu.id === id) {
        return {
          ...lgu,
          featureFlags: {
            ...lgu.featureFlags,
            [flag]: !lgu.featureFlags[flag]
          }
        };
      }
      return lgu;
    }));
  };

  const handleToggleSubscription = (id: string) => {
    setLgus(prev => prev.map(lgu => {
      if (lgu.id === id) {
        return {
          ...lgu,
          onboardingFeePaid: !lgu.onboardingFeePaid
        };
      }
      return lgu;
    }));
  };

  const handleCreateLgu = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = newLgu.name.toLowerCase().replace(/\s+/g, '-');
    const created = {
      id: newId,
      name: newLgu.name,
      logo: `https://placehold.co/100x100/${newLgu.primaryColor.replace('#','')}/1A1A1A?text=${newLgu.name.substring(0,4).toUpperCase()}`,
      primaryColor: newLgu.primaryColor,
      secondaryColor: newLgu.secondaryColor,
      province: newLgu.province,
      latitude: newLgu.latitude,
      longitude: newLgu.longitude,
      isActive: true,
      onboardingFeePaid: false,
      tier: 'Standard',
      featureFlags: { chatbot: true, potholeDetection: true, forum: true }
    };
    setLgus(prev => [...prev, created]);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#e8e7e5] text-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-[#e8e7e5]">
      {/* Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-[#dbdad7] bg-white px-6 dark:border-[#333] dark:bg-[#222]">
        <div className="flex items-center gap-3">
          <Shield size={24} weight="light" className="text-[#F497A2]" />
          <span className="logo-font text-xl font-bold">Agapp SuperAdmin</span>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 rounded-xl border border-[#dbdad7] px-4 h-10 text-sm font-semibold hover:bg-[#f4f3f0] dark:border-[#333] dark:hover:bg-[#2d2d2d]"
        >
          <SignOut size={16} />
          Sign Out
        </button>
      </header>

      {/* Main Layout */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Analytics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[#dbdad7] bg-white p-5 dark:border-[#333] dark:bg-[#222]">
            <div className="flex items-center justify-between text-[#8a8a8a] dark:text-[#666]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Tenants</span>
              <Building size={20} />
            </div>
            <p className="mt-2 text-3xl font-bold">{lgus.length}</p>
          </div>
          <div className="rounded-2xl border border-[#dbdad7] bg-white p-5 dark:border-[#333] dark:bg-[#222]">
            <div className="flex items-center justify-between text-[#8a8a8a] dark:text-[#666]">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Services</span>
              <ChartBar size={20} />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {lgus.filter(l => l.isActive).length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#dbdad7] bg-white p-5 dark:border-[#333] dark:bg-[#222]">
            <div className="flex items-center justify-between text-[#8a8a8a] dark:text-[#666]">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
              <HardDrive size={20} />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {lgus.filter(l => l.onboardingFeePaid).length}
            </p>
          </div>
        </div>

        {/* LGU List */}
        <div className="rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Local Government Tenant Isolation Registry</h2>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] text-white border border-white/10 px-4 h-10 text-xs font-semibold hover:bg-black transition-colors"
            >
              <Plus size={16} />
              Onboard LGU
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#dbdad7] text-[#8a8a8a] dark:border-[#333] dark:text-[#666]">
                  <th className="py-3 text-xs font-semibold uppercase">LGU Unit</th>
                  <th className="py-3 text-xs font-semibold uppercase">Branding Colors</th>
                  <th className="py-3 text-xs font-semibold uppercase">Chatbot</th>
                  <th className="py-3 text-xs font-semibold uppercase">YOLO ML</th>
                  <th className="py-3 text-xs font-semibold uppercase">Forum</th>
                  <th className="py-3 text-xs font-semibold uppercase">Subscription Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbdad7] dark:divide-[#333]">
                {lgus.map(lgu => (
                  <tr key={lgu.id} className="align-middle">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-xl border border-[#dbdad7] dark:border-[#333]">
                          <img src={lgu.logo} alt={lgu.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{lgu.name}</p>
                          <p className="text-xs text-[#8a8a8a] dark:text-[#666]">{lgu.province}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <span 
                          style={{ backgroundColor: lgu.primaryColor }}
                          className="inline-block h-5 w-5 rounded-full border border-black/10" 
                        />
                        <span 
                          style={{ backgroundColor: lgu.secondaryColor }}
                          className="inline-block h-5 w-5 rounded-full border border-black/10" 
                        />
                      </div>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleToggleFlag(lgu.id, 'chatbot')}
                        className={`toggle-track ${lgu.featureFlags.chatbot ? 'on' : 'off'}`}
                      >
                        <span className="toggle-knob" />
                      </button>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleToggleFlag(lgu.id, 'potholeDetection')}
                        className={`toggle-track ${lgu.featureFlags.potholeDetection ? 'on' : 'off'}`}
                      >
                        <span className="toggle-knob" />
                      </button>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleToggleFlag(lgu.id, 'forum')}
                        className={`toggle-track ${lgu.featureFlags.forum ? 'on' : 'off'}`}
                      >
                        <span className="toggle-knob" />
                      </button>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleSubscription(lgu.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                          lgu.onboardingFeePaid 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300' 
                            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300'
                        }`}
                      >
                        {lgu.onboardingFeePaid ? <Check size={12} /> : <X size={12} />}
                        {lgu.onboardingFeePaid ? 'Paid' : 'Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-6 z-50">
          <div className="w-full max-w-md rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
            <h3 className="text-lg font-bold mb-4">Onboard New LGU Tenant</h3>
            <form onSubmit={handleCreateLgu} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
                  LGU Name
                </label>
                <input
                  type="text"
                  value={newLgu.name}
                  onChange={(e) => setNewLgu({ ...newLgu, name: e.target.value })}
                  placeholder="Municipality of Pila"
                  className="w-full h-10 rounded-xl border border-[#dbdad7] px-3 text-sm outline-none focus:border-[#F497A2] dark:border-[#333] dark:bg-[#1e1e1e] dark:text-[#e8e7e5]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
                    Primary Color (Sage)
                  </label>
                  <input
                    type="color"
                    value={newLgu.primaryColor}
                    onChange={(e) => setNewLgu({ ...newLgu, primaryColor: e.target.value })}
                    className="w-full h-10 rounded-xl border border-[#dbdad7] p-1 dark:border-[#333] dark:bg-[#1e1e1e]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={newLgu.secondaryColor}
                    onChange={(e) => setNewLgu({ ...newLgu, secondaryColor: e.target.value })}
                    className="w-full h-10 rounded-xl border border-[#dbdad7] p-1 dark:border-[#333] dark:bg-[#1e1e1e]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 rounded-xl border border-[#dbdad7] px-4 text-xs font-semibold hover:bg-[#f4f3f0] dark:border-[#333] dark:hover:bg-[#2d2d2d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-[#1A1A1A] text-white border border-white/10 px-4 text-xs font-semibold hover:bg-black transition-colors"
                >
                  Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
