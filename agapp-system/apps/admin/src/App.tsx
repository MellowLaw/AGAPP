import { useState, useEffect } from 'react';
import { 
  Building, Users, Warning, CheckCircle, Clock, Trash, FileText, 
  Gear, ShieldWarning, SignOut, Check, X, Shield, Plus, 
  ArrowsCounterClockwise, Eye, ChartBar, Pulse, Lock, MagnifyingGlass, Newspaper, Star,
  CaretRight, Pencil, Database, HardDrive, Bell
} from '@phosphor-icons/react';

const API_BASE = 'http://localhost:5000/api';

const initialLgus = [
  {
    id: 'liliw-laguna', name: 'Municipality of Liliw',
    logo: 'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
    bannerUrl: 'https://placehold.co/800x200/A2B59F/1a1a1a?text=Welcome+to+Liliw%2C+Laguna',
    primaryColor: '#A2B59F', secondaryColor: '#D9CDB8',
    province: 'Laguna', latitude: 13.9297, longitude: 121.4644,
    isActive: true, onboardingFeePaid: true, tier: 'Pro',
    orNumber: 'OR-2025-0912-001', dateReceived: '2025-09-12',
    featureFlags: { chatbot: true, potholeDetection: true, forum: true }
  },
  {
    id: 'nagcarlan-laguna', name: 'Municipality of Nagcarlan',
    logo: 'https://placehold.co/100x100/9FADB5/1A1A1A?text=NAGC',
    bannerUrl: 'https://placehold.co/800x200/9FADB5/1a1a1a?text=Welcome+to+Nagcarlan',
    primaryColor: '#9FADB5', secondaryColor: '#CAD3D9',
    province: 'Laguna', latitude: 13.9214, longitude: 121.4157,
    isActive: true, onboardingFeePaid: false, tier: 'Standard',
    orNumber: null, dateReceived: null,
    featureFlags: { chatbot: false, potholeDetection: true, forum: false }
  },
  {
    id: 'magdalena-laguna', name: 'Municipality of Magdalena',
    logo: 'https://placehold.co/100x100/AE9FB5/1A1A1A?text=MGDL',
    bannerUrl: 'https://placehold.co/800x200/AE9FB5/1a1a1a?text=Welcome+to+Magdalena',
    primaryColor: '#AE9FB5', secondaryColor: '#DFD9E3',
    province: 'Laguna', latitude: 13.9692, longitude: 121.4278,
    isActive: false, onboardingFeePaid: false, tier: 'Onboarding',
    orNumber: null, dateReceived: null,
    featureFlags: { chatbot: false, potholeDetection: false, forum: false }
  },
  {
    id: 'majayjay-laguna', name: 'Municipality of Majayjay',
    logo: 'https://placehold.co/100x100/B5A59F/1A1A1A?text=MJYJ',
    bannerUrl: 'https://placehold.co/800x200/B5A59F/1a1a1a?text=Welcome+to+Majayjay',
    primaryColor: '#B5A59F', secondaryColor: '#E6DFDB',
    province: 'Laguna', latitude: 13.9008, longitude: 121.4747,
    isActive: false, onboardingFeePaid: false, tier: 'Onboarding',
    orNumber: null, dateReceived: null,
    featureFlags: { chatbot: false, potholeDetection: false, forum: false }
  },
  {
    id: 'pila-laguna', name: 'Municipality of Pila',
    logo: 'https://placehold.co/100x100/B59FA5/1A1A1A?text=PILA',
    bannerUrl: 'https://placehold.co/800x200/B59FA5/1a1a1a?text=Welcome+to+Pila',
    primaryColor: '#B59FA5', secondaryColor: '#E3D9DB',
    province: 'Laguna', latitude: 14.0625, longitude: 121.3653,
    isActive: false, onboardingFeePaid: false, tier: 'Onboarding',
    orNumber: null, dateReceived: null,
    featureFlags: { chatbot: false, potholeDetection: false, forum: false }
  }
];

const initialReports = [
  {
    id: 'rep-001', referenceNumber: 'RPT-00481', lguId: 'liliw-laguna',
    citizenId: 'usr-citizen', citizenName: 'Lawrence Alcantara',
    category: 'pothole', description: 'Malaking butas sa kalsada sa tapat ng Liliw Public Market. Mapanganib para sa mga motorsiklo.',
    photoUrl: 'https://placehold.co/400x300/78716c/ffffff?text=Pothole+on+Road',
    latitude: 13.9301, longitude: 121.4651, barangay: 'Poblacion',
    status: 'In Progress', mlConfidence: 0.94, mlVerified: true, isLowCredibility: false,
    assignedOffice: 'Municipal Engineering Office', slaTier: 'simple',
    slaDaysLeft: 2, slaDueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: 'usr-citizen', notes: 'Submitted via mobile', timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
      { status: 'Under Review', updatedBy: 'usr-liliw-admin', notes: 'Routed to MEO', timestamp: new Date(Date.now() - 36 * 3600000).toISOString() },
      { status: 'In Progress', updatedBy: 'usr-liliw-admin', notes: 'Crew dispatched', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() }
    ]
  },
  {
    id: 'rep-002', referenceNumber: 'RPT-00480', lguId: 'liliw-laguna',
    citizenId: 'usr-citizen', citizenName: 'Maria Santos',
    category: 'clogged_drainage', description: 'Overflowing canal near Liliw Elementary School causing flooding during light rain.',
    photoUrl: 'https://placehold.co/400x300/44403c/ffffff?text=Clogged+Drainage',
    latitude: 13.9285, longitude: 121.4630, barangay: 'San Juan',
    status: 'Submitted', mlConfidence: 0.88, mlVerified: true, isLowCredibility: false,
    assignedOffice: 'MENRO', slaTier: 'simple', slaDaysLeft: 4,
    slaDueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    statusHistory: [{ status: 'Submitted', updatedBy: 'usr-citizen', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() }]
  },
  {
    id: 'rep-003', referenceNumber: 'RPT-00478', lguId: 'liliw-laguna',
    citizenId: 'usr-citizen', citizenName: 'Jose Dela Cruz',
    category: 'pothole', description: 'Flooding near Brgy. Bukal intersection. SLA breached.',
    photoUrl: 'https://placehold.co/400x300/7c3aed/ffffff?text=Flooding',
    latitude: 13.9310, longitude: 121.4660, barangay: 'Bukal',
    status: 'Under Review', mlConfidence: 0.76, mlVerified: true, isLowCredibility: false,
    assignedOffice: 'Engineering Office', slaTier: 'simple', slaDaysLeft: -1,
    slaDueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    statusHistory: [
      { status: 'Submitted', updatedBy: 'usr-citizen', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
      { status: 'Under Review', updatedBy: 'usr-liliw-admin', notes: 'Routed to Engineering', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() }
    ]
  }
];

const initialServiceRequests = [
  {
    id: 'req-001', referenceNumber: 'SR-1042', lguId: 'liliw-laguna',
    citizenId: 'usr-citizen', citizenName: 'Juan D. Dela Cruz',
    serviceType: 'Barangay Clearance', officeName: 'Civil Registrar',
    status: 'Under Review', slaDaysLeft: 2,
    formDetails: { fullName: 'Juan D. Dela Cruz', purpose: 'Employment requirement', barangay: 'Poblacion' },
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SR-1042',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'req-002', referenceNumber: 'SR-1041', lguId: 'liliw-laguna',
    citizenId: 'usr-citizen', citizenName: 'Maria Santos',
    serviceType: 'Business Permit Renewal', officeName: 'BPLO',
    status: 'Submitted', slaDaysLeft: 3,
    formDetails: { businessName: 'Santos Sari-Sari Store', ownerName: 'Maria Santos' },
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SR-1041',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'req-003', referenceNumber: 'SR-1040', lguId: 'liliw-laguna',
    citizenId: 'usr-citizen', citizenName: 'Jose Dela Cruz',
    serviceType: 'Birth Certificate Request', officeName: 'Civil Registrar',
    status: 'Released', slaDaysLeft: 0,
    formDetails: { fullName: 'Jose Dela Cruz', birthDate: '1990-06-19', placeOfBirth: 'Liliw District Hospital' },
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SR-1040',
    attachmentUrl: 'https://placehold.co/file.pdf',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

const initialForumPosts = [
  {
    id: 'forum-001', lguId: 'liliw-laguna', citizenId: 'usr-001',
    citizenName: 'Maria S.', initials: 'MS',
    content: 'Suggest dagdag na streetlights sa Brgy. San Juan. Madilim pagkatapos ng 7PM malapit sa elementary school.',
    isApproved: true, flaggedKeywords: [], flagType: null,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), upvotes: 24, comments: 6
  },
  {
    id: 'forum-002', lguId: 'liliw-laguna', citizenId: 'usr-002',
    citizenName: 'Anonymous', initials: '?',
    content: 'Sample flagged content excerpt with offensive language here…',
    isApproved: false, flaggedKeywords: ['putang ina'], flagType: 'Hate speech (auto)',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(), upvotes: 0, comments: 0
  },
  {
    id: 'forum-003', lguId: 'liliw-laguna', citizenId: 'usr-003',
    citizenName: 'Pedro M.', initials: 'PM',
    content: 'Buy cheap loans online here, click link bit.ly/scam123…',
    isApproved: false, flaggedKeywords: [], flagType: 'Possible spam',
    createdAt: new Date(Date.now() - 50 * 60000).toISOString(), upvotes: 0, comments: 0
  }
];

type ReportStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';
type ServiceStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Released' | 'Rejected';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [lgusList, setLgusList] = useState<any[]>(initialLgus);
  const [reportsList, setReportsList] = useState<any[]>(initialReports);
  const [requestsList, setRequestsList] = useState<any[]>(initialServiceRequests);
  const [forumList, setForumList] = useState<any[]>(initialForumPosts);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showLguModal, setShowLguModal] = useState(false);
  const [newLgu, setNewLgu] = useState({ name: '', province: '', primaryColor: '#15803d', secondaryColor: '#fbbf24', latitude: 13.9297, longitude: 121.4644 });
  const [dbConnected, setDbConnected] = useState(false);

  // Filter states
  const [reportSearch, setReportSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');
  const [auditFilter, setAuditFilter] = useState('7 days');

  // Office Assignments
  const [officeRules] = useState([
    { category: 'Pothole / road damage', office: 'Municipal Engineering Office', notify: 'Engineer-on-duty', sla: '3 working days', active: true },
    { category: 'Streetlight', office: 'Municipal Engineering Office · Electrical', notify: 'Electrical foreman', sla: '3 working days', active: true },
    { category: 'Drainage / clogged canal', office: 'MENRO', notify: 'MENRO head', sla: '7 working days', active: true },
    { category: 'Stray / missing pet', office: 'Office of the Municipal Agriculturist', notify: 'Agriculturist', sla: '7 working days', active: true },
    { category: 'Lost & found', office: 'PNP Liaison', notify: 'Desk officer', sla: '3 working days', active: true },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resLgus = await fetch(`${API_BASE}/lgus`);
      if (resLgus.ok) { setLgusList(await resLgus.json()); setDbConnected(true); }
      const resReports = await fetch(`${API_BASE}/reports`);
      if (resReports.ok) setReportsList(await resReports.json());
      const resRequests = await fetch(`${API_BASE}/services`);
      if (resRequests.ok) setRequestsList(await resRequests.json());
      const resForum = await fetch(`${API_BASE}/forum?includePending=true`);
      if (resForum.ok) setForumList(await resForum.json());
      const resLogs = await fetch(`${API_BASE}/audit-logs`);
      if (resLogs.ok) setAuditLogs(await resLogs.json());
    } catch { setDbConnected(false); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (res.ok) { setUser((await res.json()).user); }
      else { setError((await res.json()).error || 'Authentication failed'); }
    } catch {
      if (email === 'superadmin@agapp.gov.ph') setUser({ id: 'usr-super', email, name: 'Patricia Santos', role: 'SUPER_ADMIN', isActive: true });
      else if (email === 'admin@liliw.gov.ph') setUser({ id: 'usr-liliw-admin', email, name: 'Ricardo dela Cruz', role: 'LGU_ADMIN', lguId: 'liliw-laguna', isActive: true });
      else setError('Use superadmin@agapp.gov.ph or admin@liliw.gov.ph for demo');
    }
    finally { setLoading(false); }
  };

  const handleQuickLogin = (role: 'super' | 'lgu') => {
    if (role === 'super') { setEmail('superadmin@agapp.gov.ph'); setPassword('password123'); }
    else { setEmail('admin@liliw.gov.ph'); setPassword('password123'); }
  };

  const handleLogout = () => { setUser(null); setEmail(''); setPassword(''); setActiveTab('dashboard'); };

  const handleCreateLgu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/lgus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newLgu) });
      if (res.ok) { fetchData(); }
    } catch {
      const newId = newLgu.name.toLowerCase().replace(/\s+/g, '-');
      setLgusList([...lgusList, { id: newId, ...newLgu, logo: `https://placehold.co/100x100/1e3b8a/ffffff?text=${newLgu.name.substring(0,4).toUpperCase()}`, isActive: true, onboardingFeePaid: false, tier: 'Standard', orNumber: null, dateReceived: null, featureFlags: { chatbot: true, potholeDetection: true, forum: true } }]);
    }
    setShowLguModal(false);
    setNewLgu({ name: '', province: '', primaryColor: '#1e3b8a', secondaryColor: '#f59e0b', latitude: 13.6218, longitude: 123.1948 });
  };



  const handleToggleFlag = async (id: string, flag: 'chatbot' | 'potholeDetection' | 'forum', currentVal: boolean) => {
    try { const res = await fetch(`${API_BASE}/lgus/${id}/feature-flags`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featureFlags: { [flag]: !currentVal } }) }); if (res.ok) fetchData(); }
    catch { setLgusList(lgusList.map(l => l.id === id ? { ...l, featureFlags: { ...l.featureFlags, [flag]: !currentVal } } : l)); }
  };

  const handleUpdateReportStatus = async (id: string, newStatus: ReportStatus, notes: string) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, updatedBy: user.id, userRole: user.role, userEmail: user.email, notes }) });
      if (res.ok) { fetchData(); setSelectedReport(null); }
    } catch {
      setReportsList(reportsList.map(r => r.id === id ? { ...r, status: newStatus, statusHistory: [...r.statusHistory, { status: newStatus, updatedBy: user.id, notes, timestamp: new Date().toISOString() }] } : r));
      setSelectedReport(null);
    }
  };

  const handleUpdateServiceStatus = async (id: string, newStatus: ServiceStatus, notes: string, releaseFile?: string) => {
    try {
      const res = await fetch(`${API_BASE}/services/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, updatedBy: user.id, userRole: user.role, userEmail: user.email, notes, attachmentUrl: releaseFile }) });
      if (res.ok) { fetchData(); setSelectedRequest(null); }
    } catch {
      setRequestsList(requestsList.map(r => r.id === id ? { ...r, status: newStatus, attachmentUrl: releaseFile, statusHistory: [...(r.statusHistory || []), { status: newStatus, updatedBy: user.id, notes, timestamp: new Date().toISOString() }] } : r));
      setSelectedRequest(null);
    }
  };

  const handleApproveForum = async (id: string) => {
    try { const res = await fetch(`${API_BASE}/forum/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvedBy: user.id }) }); if (res.ok) fetchData(); }
    catch { setForumList(forumList.map(f => f.id === id ? { ...f, isApproved: true, flaggedKeywords: [], flagType: null } : f)); }
  };

  const handleDeleteForum = async (id: string) => {
    try { const res = await fetch(`${API_BASE}/forum/${id}`, { method: 'DELETE' }); if (res.ok) fetchData(); }
    catch { setForumList(forumList.filter(f => f.id !== id)); }
  };

  // ─── STATUS BADGE ────────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      'Submitted': 'bg-amber-100 text-amber-800',
      'Under Review': 'bg-blue-100 text-blue-800',
      'In Review': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      'Resolved': 'bg-emerald-100 text-emerald-800',
      'Released': 'bg-emerald-100 text-emerald-800',
      'Approved': 'bg-emerald-100 text-emerald-800',
      'Paid in-person': 'bg-emerald-100 text-emerald-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Breached': 'bg-red-100 text-red-800',
      'Awaiting payment': 'bg-amber-100 text-amber-800',
      'Active': 'bg-emerald-100 text-emerald-800',
      'Operational': 'bg-emerald-100 text-emerald-800',
      'Degraded': 'bg-amber-100 text-amber-800',
      'Investigating': 'bg-amber-100 text-amber-800',
      'Trial': 'bg-amber-100 text-amber-800',
      'Fulfilled': 'bg-emerald-100 text-emerald-800',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
  };

  // ─── SLA CHIP ─────────────────────────────────────────────────────────────────
  const SlaBadge = ({ days }: { days: number }) => {
    if (days < 0) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">−{Math.abs(days)}d (Breached)</span>;
    if (days <= 1) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">{days}d left (At risk)</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{days}d left</span>;
  };

  // ─── SEARCH FILTER ────────────────────────────────────────────────────────────
  const filteredReports = reportsList.filter(r =>
    !reportSearch || r.referenceNumber.toLowerCase().includes(reportSearch.toLowerCase()) ||
    r.barangay?.toLowerCase().includes(reportSearch.toLowerCase()) ||
    r.category?.toLowerCase().includes(reportSearch.toLowerCase())
  );

  const filteredRequests = requestsList.filter(req => {
    const matchSearch = !requestSearch || req.referenceNumber.toLowerCase().includes(requestSearch.toLowerCase()) || req.citizenName.toLowerCase().includes(requestSearch.toLowerCase());
    const matchStatus = requestStatusFilter === 'All' || req.status === requestStatusFilter || (requestStatusFilter === 'Pending' && req.status === 'Submitted') || (requestStatusFilter === 'In review' && req.status === 'Under Review') || (requestStatusFilter === 'Approved' && req.status === 'Released');
    return matchSearch && matchStatus;
  });

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-color5 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-color2 rounded-2xl border border-color4 p-8 shadow-md">
          <div className="text-center mb-8">
            {/* AGAPP Premium Logo */}
            <div className="mb-4 inline-block bg-[#1A1A1A] px-6 py-3 rounded-2xl shadow-sm border border-color4">
              <h1 className="logo-font text-4xl text-white">
                A<span className="text-color1 animate-pulse">g</span>app.
              </h1>
            </div>
            <p className="text-slate-500 text-sm mt-1 font-semibold">Automated Governance &amp; Public Service Platform</p>
            <div className="bg-color3 text-slate-700 border border-color1 text-xs px-3 py-1.5 rounded-full inline-block mt-3 font-semibold">
              Dashboard Console — PC / Browser Only
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. admin@liliw.gov.ph"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-color1 transition" required />
            </div>
            <div>
              <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-color1 transition" required />
            </div>
            {error && <div className="bg-red-50 text-red-700 border border-red-100 text-xs p-3 rounded-lg text-center">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-color1 hover:bg-color4 text-slate-800 font-bold py-3 px-4 rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-2">
              {loading ? <ArrowsCounterClockwise weight="light" className="w-5 h-5 animate-spin" /> : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <span className="bg-color2 px-3 text-slate-400 text-xs uppercase tracking-widest relative z-10">Demo Quick Login</span>
            <div className="border-b border-slate-200 absolute top-1/2 left-0 right-0"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleQuickLogin('super')} className="bg-color5 hover:bg-color1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-xs font-semibold transition">Super Admin</button>
            <button onClick={() => handleQuickLogin('lgu')} className="bg-color5 hover:bg-color1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-xs font-semibold transition">Liliw LGU Admin</button>
          </div>
        </div>
      </div>
    );
  }

  const isSuper = user.role === 'SUPER_ADMIN';
  const myLgu = isSuper ? null : lgusList.find(l => l.id === user.lguId);
  const myLguName = myLgu ? myLgu.name : 'AGAP · Super Admin';
  // ─── NAV ITEMS ────────────────────────────────────────────────────────────────
  const superNavItems = [
    { tab: 'analytics', label: 'Analytics', icon: ChartBar },
    { tab: 'tenants', label: 'Tenants', icon: Building },
    { tab: 'health', label: 'System Health', icon: Pulse },
    { tab: 'dpa', label: 'DPA Compliance', icon: Lock },
  ];

  const lguNavMain = [
    { tab: 'dashboard', label: 'Dashboard', icon: ChartBar },
    { tab: 'reports', label: 'Reports', icon: Warning },
    { tab: 'requests', label: 'Service Requests', icon: FileText },
    { tab: 'news', label: 'News', icon: Newspaper },
    { tab: 'forum', label: 'Forum', icon: ShieldWarning },
  ];

  const lguNavConfig = [
    { tab: 'service-builder', label: 'Service Builder', icon: Gear },
    { tab: 'rules', label: 'Office Assignments', icon: CaretRight },
    { tab: 'logs', label: 'Audit Log', icon: Eye },
  ];

  const NavBtn = ({ tab, label, Icon }: { tab: string; label: string; Icon: any }) => (
    <button onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition ${activeTab === tab ? 'bg-color1 text-slate-800' : 'hover:bg-color3 hover:text-slate-800 text-slate-600'}`}>
      <Icon weight="light" className="w-4 h-4 flex-shrink-0" /> {label}
    </button>
  );
  // Bar chart data (last 7 days mock)
  const barData = [35, 55, 48, 70, 62, 80, 54];
  const barDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const openQueue = reportsList.filter(r => r.status !== 'Resolved' && r.status !== 'Rejected').length + requestsList.filter(r => r.status !== 'Released' && r.status !== 'Rejected').length;
  const slaBreached = reportsList.filter(r => r.slaDaysLeft < 0).length;
  const atRisk = reportsList.filter(r => r.slaDaysLeft >= 0 && r.slaDaysLeft <= 1).length;
  const onTime = reportsList.filter(r => r.slaDaysLeft > 1).length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-color5">
      {/* ── SIDEBAR ────────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 bg-color2 text-slate-700 flex flex-col justify-between border-r border-color4">
        <div>
          {/* Brand Logo Header */}
          <div className="bg-[#1A1A1A] p-4 text-center border-b border-color4">
            <span className="logo-font text-2xl text-[#e8e7e5] block">
              A<span className="text-[#F497A2] animate-pulse">g</span>app.
            </span>
          </div>
          {/* Brand LGU */}
          <div className="p-6 border-b border-color4 flex flex-col items-center text-center">
            {myLgu?.logo
              ? <img src={myLgu.logo} alt="LGU Seal" className="w-12 h-12 rounded-full mb-3 ring-2 ring-color1" />
              : <Shield weight="light" className="w-10 h-10 text-color1 mb-3" />
            }
            <h2 className="text-slate-800 font-bold text-sm tracking-wide uppercase line-clamp-1">{myLguName}</h2>
            <div className="flex items-center gap-1.5 mt-2 bg-color3 border border-color1 text-[10px] text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              {dbConnected ? 'DB Connected' : 'Simulated DB'}
            </div>
          </div>

          {/* Nav */}
          <nav className="p-4 space-y-1.5">
            {isSuper ? (
              superNavItems.map(n => <NavBtn key={n.tab} tab={n.tab} label={n.label} Icon={n.icon} />)
            ) : (
              <>
                {lguNavMain.map(n => <NavBtn key={n.tab} tab={n.tab} label={n.label} Icon={n.icon} />)}
                <div className="pt-3 pb-1 px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</div>
                {lguNavConfig.map(n => <NavBtn key={n.tab} tab={n.tab} label={n.label} Icon={n.icon} />)}
              </>
            )}
          </nav>
        </div>

        {/* User footer */}
        <div className="p-4 border-t border-color4 bg-color5/50 flex items-center justify-between text-xs">
          <div>
            <p className="text-slate-800 font-bold line-clamp-1">{user.name}</p>
            <p className="text-slate-500 font-semibold">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-slate-200 rounded-lg hover:text-red-600 transition" title="Log Out">
            <SignOut weight="light" className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen bg-color5">
        {/* Top header */}
        <header className="bg-color2 border-b border-color4 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {activeTab === 'dashboard' ? (isSuper ? 'Cross-LGU Analytics' : 'Dashboard Overview') :
               activeTab === 'analytics' ? 'Cross-LGU Analytics' :
               activeTab === 'tenants' ? 'Tenants & Feature Flags' :
               activeTab === 'health' ? 'System Health' :
               activeTab === 'dpa' ? 'DPA Compliance' :
               activeTab === 'reports' ? 'Reports Queue' :
               activeTab === 'requests' ? 'Service Requests' :
               activeTab === 'news' ? 'News & Announcements' :
               activeTab === 'forum' ? 'Forum Moderation' :
               activeTab === 'service-builder' ? 'Service Builder' :
               activeTab === 'rules' ? 'Office Assignments' :
               activeTab === 'logs' ? 'Audit Log' : activeTab}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {activeTab === 'dashboard' && !isSuper && `Mon Apr 27 – Sun May 3, 2026`}
              {activeTab === 'analytics' && 'Aggregated performance across all tenants'}
              {activeTab === 'tenants' && 'Provision LGUs and toggle modules per tenant'}
              {activeTab === 'health' && 'Live infrastructure metrics & incidents'}
              {activeTab === 'dpa' && 'RA 10173 — DSARs & consent records'}
              {activeTab === 'reports' && 'Citizen-submitted issue reports'}
              {activeTab === 'requests' && 'Document and permit applications'}
              {activeTab === 'forum' && 'Auto-flagged posts & user reports'}
              {activeTab === 'rules' && 'Set which office handles each report category and the SLA under RA 11032'}
              {activeTab === 'logs' && 'Tamper-evident record of admin actions'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(activeTab === 'analytics' || activeTab === 'logs') && (
              <button className="border border-color4 bg-color2 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-color3 transition">Export CSV</button>
            )}
            {(activeTab === 'tenants' || activeTab === 'dashboard' && isSuper) && (
              <button onClick={() => setShowLguModal(true)} className="bg-color1 hover:bg-color4 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition">
                <Plus weight="light" className="w-3.5 h-3.5" /> Onboard new LGU
              </button>
            )}
            {activeTab === 'dashboard' && !isSuper && (
              <button className="bg-color1 hover:bg-color4 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition">
                <Plus weight="light" className="w-3.5 h-3.5" /> New announcement
              </button>
            )}
            {activeTab === 'reports' && (
              <button className="border border-color4 bg-color2 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-color3 transition">Assign selected</button>
            )}
            {activeTab === 'rules' && (
              <button className="bg-color1 hover:bg-color4 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition">
                <Plus weight="light" className="w-3.5 h-3.5" /> Add category
              </button>
            )}
            <button onClick={fetchData} className="p-2 hover:bg-color3 rounded-lg text-slate-500 hover:text-slate-800 transition" title="Sync Data">
              <ArrowsCounterClockwise weight="light" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 flex-1 max-w-7xl w-full mx-auto space-y-6">

          {/* ── SUPER ADMIN: ANALYTICS ──────────────────────────────── */}
          {isSuper && (activeTab === 'analytics' || activeTab === 'dashboard') && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: 'Active LGUs', value: '12', delta: '▲ 2 new', icon: Building },
                  { label: 'Active Citizens', value: '48,210', delta: '▲ 12%', icon: Users },
                  { label: 'Avg. CSAT', value: '4.5 / 5', delta: '▲ 0.2', icon: Star },
                  { label: 'SLA Compliance', value: '93%', delta: '▲ 1.4%', icon: CheckCircle }
                ].map((k, i) => (
                  <div key={i} className="bg-color2 border border-color4 rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-color3 text-slate-700 rounded-lg"><k.icon weight="light" className="w-5 h-5" /></div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{k.label}</span>
                      <h4 className="text-xl font-bold text-slate-800 mt-0.5">{k.value}</h4>
                      <span className="text-[10px] text-emerald-600 font-semibold">{k.delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active users chart */}
                <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4">Active users · 30 days</h4>
                  <div className="h-32 relative">
                    <svg viewBox="0 0 300 120" className="w-full h-full" preserveAspectRatio="none">
                      <polyline fill="none" stroke="#f0b2c7" strokeWidth="2.5"
                        points="0,90 25,80 50,82 75,65 100,70 125,55 150,60 175,45 200,50 225,35 250,40 275,25 300,30" />
                      <polygon fill="rgba(240,178,199,0.15)" stroke="none"
                        points="0,90 25,80 50,82 75,65 100,70 125,55 150,60 175,45 200,50 225,35 250,40 275,25 300,30 300,120 0,120" />
                    </svg>
                  </div>
                </div>

                {/* CSAT leaderboard */}
                <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4">CSAT leaderboard</h4>
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate-400 font-semibold uppercase text-[10px] border-b border-color4">
                      <th className="pb-2 text-left">#</th><th className="pb-2 text-left">LGU</th><th className="pb-2 text-left">CSAT</th><th className="pb-2 text-left">Volume</th>
                    </tr></thead>
                    <tbody className="divide-y divide-color4">
                      {[['1','Municipality of Liliw','4.8','3,240'],['2','Municipality of Nagcarlan','4.7','2,810'],['3','Municipality of Magdalena','4.6','1,920'],['4','Municipality of Majayjay','4.4','1,540'],['5','Municipality of Pila','4.1','1,210']].map(([rank,lgu,csat,vol]) => (
                        <tr key={rank} className="hover:bg-color5/40">
                          <td className="py-2 text-slate-500 font-bold">{rank}</td>
                          <td className="py-2 text-slate-800 font-semibold">{lgu}</td>
                          <td className="py-2"><StatusBadge status={parseFloat(csat) >= 4.5 ? 'Active' : 'Trial'} /></td>
                          <td className="py-2 text-slate-500">{vol}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform metrics */}
              <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4">Cross-LGU Platform Metrics Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{ label: 'Total Citizens', value: '48,210', color: 'text-slate-800' },
                    { label: 'Total Submissions', value: '4,560', color: 'text-slate-800' },
                    { label: 'ML Auto-Blocked', value: '1,280', color: 'text-amber-600' },
                    { label: 'DPA Compliance', value: '100%', color: 'text-emerald-600' }
                  ].map((m, i) => (
                    <div key={i} className="p-4 bg-color5 rounded-lg text-center border border-color4">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{m.label}</p>
                      <p className={`text-2xl font-extrabold mt-1 ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SUPER ADMIN: TENANTS ────────────────────────────────── */}
          {isSuper && activeTab === 'tenants' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table */}
              <div className="bg-color2 border border-color4 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-color5 border-b border-color4 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="p-3 text-left">LGU</th><th className="p-3 text-left">Province</th><th className="p-3 text-left">Tier</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Onboarded</th>
                  </tr></thead>
                  <tbody className="divide-y divide-color4">
                    {lgusList.map(lgu => (
                      <tr key={lgu.id} className="hover:bg-color5/40">
                        <td className="p-3 font-semibold text-slate-800">{lgu.name}</td>
                        <td className="p-3 text-slate-500">{lgu.province || 'Laguna'}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lgu.tier === 'Pro' ? 'bg-color3 text-slate-800 border border-color1' : 'bg-slate-100 text-slate-600'}`}>{lgu.tier || 'Standard'}</span></td>
                        <td className="p-3"><StatusBadge status={lgu.isActive ? 'Active' : 'Trial'} /></td>
                        <td className="p-3 text-slate-500">{lgu.dateReceived || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Feature flags panel for first LGU */}
              <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-color4">
                  <img src={lgusList[0]?.logo} alt="" className="w-10 h-10 rounded-full ring-2 ring-color1" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{lgusList[0]?.name}</h4>
                    <span className="text-[10px] text-slate-400">Feature flags</span>
                  </div>
                </div>
                {[
                  { label: 'Issue Reports w/ ML triage', flag: 'potholeDetection' as const },
                  { label: 'Community Forum', flag: 'forum' as const },
                  { label: 'Chatbot (LLM)', flag: 'chatbot' as const },
                ].map(({ label, flag }) => (
                  <div key={flag} className="flex justify-between items-center py-1">
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFlag(lgusList[0]?.id, flag, lgusList[0]?.featureFlags[flag])}
                      className={`toggle-track ${lgusList[0]?.featureFlags[flag] ? 'on' : 'off'}`}
                      aria-label={label}
                    >
                      <div className="toggle-knob" />
                    </button>
                  </div>
                ))}
                <div className="pt-3 border-t border-color4">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Custom Domain</p>
                  <div className="bg-color5 border border-color4 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono">liliw.agap.gov.ph</div>
                </div>
              </div>
            </div>
          )}



          {/* ── SUPER ADMIN: SYSTEM HEALTH ──────────────────────────── */}
          {isSuper && activeTab === 'health' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: 'API uptime (30d)', value: '99.97%', delta: 'SLO 99.9%' }, { label: 'P95 latency', value: '214 ms', delta: '▼ 12 ms' }, { label: 'Error rate', value: '0.12%', delta: '▼ 0.04%' }, { label: 'Active jobs', value: '38', delta: 'queue depth: 4' }].map((k, i) => (
                  <div key={i} className="bg-color2 border border-color4 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{k.label}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{k.value}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{k.delta}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800 mb-2">Service status</h4>
                  {[{ name: 'API Gateway', icon: HardDrive, status: 'Operational' }, { name: 'Auth Service', icon: Shield, status: 'Operational' }, { name: 'ML Triage Worker', icon: Pulse, status: 'Degraded' }, { name: 'Storage (S3)', icon: Database, status: 'Operational' }, { name: 'Database (Postgres)', icon: Database, status: 'Operational' }, { name: 'Push notifications (FCM)', icon: Bell, status: 'Operational' }].map(s => (
                    <div key={s.name} className="flex justify-between items-center py-1.5 border-b border-color4 last:border-0">
                      <div className="flex items-center gap-2 text-sm text-slate-700"><s.icon weight="light" className="w-4 h-4 text-slate-400" />{s.name}</div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>

                <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800 mb-2">Recent incidents</h4>
                  {[{ title: 'ML worker queue lag', status: 'Investigating', desc: 'Started 14:21 · 3 LGUs affected' }, { title: 'DB failover drill', status: 'Operational', desc: 'Apr 28 · scheduled · no downtime' }, { title: 'FCM partial outage', status: 'Operational', desc: 'Apr 22 · 38 min' }].map((inc, i) => (
                    <div key={i} className="py-2 border-b border-color4 last:border-0">
                      <div className="flex justify-between items-center"><span className="text-sm font-semibold text-slate-800">{inc.title}</span><StatusBadge status={inc.status} /></div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{inc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SUPER ADMIN: DPA COMPLIANCE ─────────────────────────── */}
          {isSuper && activeTab === 'dpa' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: 'Open DSARs', value: '6', delta: 'SLA: 15 days' }, { label: 'Consent rate', value: '96%', delta: '▲ 1.2%' }, { label: 'Breaches (YTD)', value: '0', delta: 'target: 0' }, { label: 'Avg. response', value: '4.1d', delta: 'well within SLA' }].map((k, i) => (
                  <div key={i} className="bg-color2 border border-color4 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{k.label}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{k.value}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{k.delta}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-color2 border border-color4 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-color4"><h4 className="font-bold text-slate-800">DSAR queue</h4></div>
                  <table className="w-full text-xs">
                    <thead><tr className="bg-color5 border-b border-color4 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="p-3 text-left">Ref.</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Submitted</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Due</th>
                    </tr></thead>
                    <tbody className="divide-y divide-color4">
                      {[{ ref: 'DSAR-204', type: 'Access', date: 'Apr 26', status: 'Under Review', due: 'May 11' }, { ref: 'DSAR-203', type: 'Erasure', date: 'Apr 25', status: 'Awaiting payment', due: 'May 10' }, { ref: 'DSAR-202', type: 'Rectification', date: 'Apr 23', status: 'Fulfilled', due: '—' }, { ref: 'DSAR-201', type: 'Portability', date: 'Apr 21', status: 'Fulfilled', due: '—' }].map(d => (
                        <tr key={d.ref} className="hover:bg-color5/40">
                          <td className="p-3 font-mono text-slate-700 font-semibold">{d.ref}</td>
                          <td className="p-3 text-slate-600">{d.type}</td>
                          <td className="p-3 text-slate-500">{d.date}</td>
                          <td className="p-3"><StatusBadge status={d.status} /></td>
                          <td className="p-3 text-slate-500">{d.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800 mb-2">Consent records</h4>
                  {[{ label: 'Privacy Notice acceptance', value: '99.4%', good: true }, { label: 'Location while reporting', value: '82%', good: true }, { label: 'Push notifications', value: '76%', good: true }, { label: 'Analytics & usage data', value: '41%', good: false }, { label: 'Marketing communications', value: '12%', good: false }].map(c => (
                    <div key={c.label} className="flex justify-between items-center py-1.5 border-b border-color4 last:border-0">
                      <span className="text-sm text-slate-700">{c.label}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.good ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{c.value}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-color4">
                    <p className="text-xs font-bold text-slate-700 mb-1">Recent updates to Privacy Notice</p>
                    <p className="text-[11px] text-slate-400">v2.3 · published Apr 1, 2026 · accepted by 47,812 users</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LGU ADMIN: DASHBOARD ─────────────────────────────────── */}
          {!isSuper && activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Open queue', value: openQueue, delta: '▲ 8% vs last week', bad: true, icon: FileText },
                  { label: 'SLA breaches', value: slaBreached, delta: `▲ ${slaBreached}`, bad: slaBreached > 0, icon: Warning },
                  { label: 'Avg. resolution', value: '2.3d', delta: '▼ 0.4d', bad: false, icon: Clock },
                  { label: 'CSAT', value: '4.6 / 5', delta: '▲ 0.1', bad: false, icon: Star },
                ].map((k, i) => (
                  <div key={i} className="bg-color2 border border-color4 rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${k.bad ? 'bg-red-100 text-red-600' : 'bg-color3 text-slate-700'}`}><k.icon weight="light" className="w-5 h-5" /></div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{k.label}</span>
                      <h4 className="text-xl font-bold text-slate-800 mt-0.5">{k.value}</h4>
                      <span className={`text-[10px] font-semibold ${k.bad ? 'text-red-500' : 'text-emerald-600'}`}>{k.delta}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly bar chart */}
                <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4">Requests & reports (last 7 days)</h4>
                  <div className="flex items-end gap-2 h-36">
                    {barData.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-color1 rounded-t transition-all hover:bg-color4" style={{ height: `${h}%`, minHeight: 8 }}></div>
                        <span className="text-[9px] text-slate-400 font-semibold">{barDays[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SLA status card */}
                <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800 mb-2">SLA status</h4>
                  <div className="flex justify-between items-center py-1.5 border-b border-color4">
                    <span className="text-sm text-slate-700 font-medium">On time</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{onTime + 128}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-color4">
                    <span className="text-sm text-slate-700 font-medium">At risk</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">{atRisk + 7}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-color4">
                    <span className="text-sm text-slate-700 font-medium">Breached</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">{slaBreached + 7}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Top categories</p>
                    {[['Roads / potholes', 42], ['Streetlights', 28], ['Garbage collection', 21]].map(([cat, n]) => (
                      <div key={String(cat)} className="flex justify-between items-center py-1">
                        <span className="text-xs text-slate-600">{cat}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LGU ADMIN: REPORTS ──────────────────────────────────── */}
          {!isSuper && activeTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-color2 border border-color4 rounded-xl shadow-sm lg:col-span-2 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-color4 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-2 bg-color5 border border-color4 rounded-lg px-3 py-2 flex-1 min-w-48">
                    <MagnifyingGlass weight="light" className="w-3.5 h-3.5 text-slate-400" />
                    <input type="text" placeholder="Search by ID, location, or keyword…" value={reportSearch} onChange={e => setReportSearch(e.target.value)} className="bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400 w-full" />
                  </div>
                  <button className="border border-color4 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-color3 transition">Map view</button>
                  <button className="border border-color4 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-color3 transition">Filters</button>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="bg-color5 border-b border-color4 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="p-3 text-left">ID</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Location</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">SLA</th><th className="p-3 text-left"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-color4">
                    {filteredReports.map(r => (
                      <tr key={r.id} className="hover:bg-color5/40 transition cursor-pointer" onClick={() => setSelectedReport(r)}>
                        <td className="p-3 font-mono font-semibold text-slate-700">{r.referenceNumber}</td>
                        <td className="p-3 capitalize text-slate-600">{r.category.replace('_', ' ')}</td>
                        <td className="p-3 text-slate-500">{r.barangay}</td>
                        <td className="p-3"><StatusBadge status={r.status} /></td>
                        <td className="p-3"><SlaBadge days={r.slaDaysLeft ?? 3} /></td>
                        <td className="p-3"><button className="text-slate-400 hover:text-slate-800 transition text-xs font-semibold flex items-center gap-1"><Eye weight="light" className="w-3.5 h-3.5" />Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Side panel */}
              <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm h-fit space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Report Details & Actions</h4>
                {selectedReport ? (
                  <div className="space-y-4 text-xs">
                    <div className="h-36 rounded-lg overflow-hidden border border-color4">
                      <img src={selectedReport.photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-2 bg-color5 rounded-lg p-3 border border-color4">
                      <div className="flex justify-between border-b border-color4 pb-1.5"><span className="text-slate-400">Citizen</span><span className="font-bold text-slate-800">{selectedReport.citizenName}</span></div>
                      <div className="flex justify-between border-b border-color4 pb-1.5"><span className="text-slate-400">Category</span><span className="font-semibold capitalize">{selectedReport.category.replace('_',' ')}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Office</span><span className="font-semibold text-slate-700">{selectedReport.assignedOffice || '—'}</span></div>
                    </div>
                    <div className={`p-2.5 rounded-lg border flex items-center justify-between ${selectedReport.isLowCredibility ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      <span className="font-bold uppercase tracking-wider text-[9px]">{selectedReport.isLowCredibility ? 'Low Credibility Alert' : 'ML Validated — Road Damage'}</span>
                      <span className="font-extrabold">{Math.round(selectedReport.mlConfidence * 100)}%</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {selectedReport.status === 'Submitted' && <button onClick={() => handleUpdateReportStatus(selectedReport.id, 'Under Review', 'Acknowledged and routed.')} className="w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2 rounded-lg transition active:scale-95 text-xs">Acknowledge & Route</button>}
                      {selectedReport.status === 'Under Review' && <button onClick={() => handleUpdateReportStatus(selectedReport.id, 'In Progress', 'Personnel dispatched.')} className="w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2 rounded-lg transition active:scale-95 text-xs">Start Investigation</button>}
                      {(selectedReport.status === 'Under Review' || selectedReport.status === 'In Progress') && (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateReportStatus(selectedReport.id, 'Resolved', 'Road damage repaired.')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition active:scale-95 text-xs">Mark Resolved</button>
                          <button onClick={() => handleUpdateReportStatus(selectedReport.id, 'Rejected', 'Invalid or out of scope.')} className="flex-1 bg-red-50 text-red-600 border border-red-100 font-semibold py-2 rounded-lg transition active:scale-95 text-xs hover:bg-red-100">Reject</button>
                        </div>
                      )}
                      {selectedReport.status === 'Resolved' && <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg text-center font-bold flex items-center justify-center gap-1"><Check weight="light" className="w-4 h-4" /> Resolved</div>}
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="w-full text-slate-400 text-xs hover:text-slate-600">← Back to list</button>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8 text-xs">Select a report to review details and take action.</p>
                )}
              </div>
            </div>
          )}

          {/* ── LGU ADMIN: SERVICE REQUESTS ─────────────────────────── */}
          {!isSuper && activeTab === 'requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-color2 border border-color4 rounded-xl shadow-sm lg:col-span-2 overflow-hidden">
                {/* Search + filter chips */}
                <div className="p-4 border-b border-color4 space-y-3">
                  <div className="flex items-center gap-2 bg-color5 border border-color4 rounded-lg px-3 py-2">
                    <MagnifyingGlass weight="light" className="w-3.5 h-3.5 text-slate-400" />
                    <input type="text" placeholder="Search applicant or reference no…" value={requestSearch} onChange={e => setRequestSearch(e.target.value)} className="bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400 w-full" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['All', 'Pending', 'In review', 'Approved', 'Rejected'].map(f => (
                      <button key={f} onClick={() => setRequestStatusFilter(f)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${requestStatusFilter === f ? 'bg-color1 text-slate-800' : 'bg-color5 border border-color4 text-slate-600 hover:bg-color3'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="bg-color5 border-b border-color4 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="p-3 text-left">Ref. No.</th><th className="p-3 text-left">Applicant</th><th className="p-3 text-left">Service</th><th className="p-3 text-left">Submitted</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">SLA</th><th className="p-3 text-left"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-color4">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-color5/40 transition cursor-pointer" onClick={() => setSelectedRequest(req)}>
                        <td className="p-3 font-mono font-semibold text-slate-700">{req.referenceNumber}</td>
                        <td className="p-3 font-medium text-slate-800">{req.citizenName}</td>
                        <td className="p-3 text-slate-600">{req.serviceType}</td>
                        <td className="p-3 text-slate-500">{new Date(req.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td>
                        <td className="p-3"><StatusBadge status={req.status} /></td>
                        <td className="p-3"><SlaBadge days={req.slaDaysLeft ?? 3} /></td>
                        <td className="p-3"><button className="text-slate-400 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"><Eye weight="light" className="w-3.5 h-3.5" />Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Side panel */}
              <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm h-fit space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Application Details</h4>
                {selectedRequest ? (
                  <div className="space-y-4 text-xs">
                    <div className="bg-color5 rounded-lg p-3 border border-color4 space-y-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Form Details</p>
                      {Object.entries(selectedRequest.formDetails).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-color4 pb-1 last:border-0">
                          <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-semibold text-slate-800">{v as string}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={selectedRequest.qrCodeUrl} alt="QR Code" className="w-16 h-16 border border-color4 rounded-lg" />
                      <div>
                        <p className="text-slate-400">Verify Code</p>
                        <p className="font-bold text-slate-800">{selectedRequest.referenceNumber}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Present QR at counter to pay & collect.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedRequest.status === 'Submitted' && <button onClick={() => handleUpdateServiceStatus(selectedRequest.id, 'Under Review', 'Requirements verified.')} className="w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2 rounded-lg transition active:scale-95 text-xs">Mark Under Review</button>}
                      {selectedRequest.status === 'Under Review' && <button onClick={() => handleUpdateServiceStatus(selectedRequest.id, 'In Progress', 'Assigned processor.')} className="w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2 rounded-lg transition active:scale-95 text-xs">Process Application</button>}
                      {selectedRequest.status === 'In Progress' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateServiceStatus(selectedRequest.id, 'Released', 'Document released.', 'https://placehold.co/file.pdf')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition active:scale-95 text-xs">Mark Released</button>
                          <button onClick={() => handleUpdateServiceStatus(selectedRequest.id, 'Rejected', 'Missing documents.')} className="flex-1 bg-red-50 text-red-600 border border-red-100 font-semibold py-2 rounded-lg transition active:scale-95 text-xs hover:bg-red-100">Reject</button>
                        </div>
                      )}
                      {selectedRequest.status === 'Released' && <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg text-center font-bold flex items-center justify-center gap-1"><Check weight="light" className="w-4 h-4" /> Document Released</div>}
                    </div>
                    <button onClick={() => setSelectedRequest(null)} className="w-full text-slate-400 text-xs hover:text-slate-600">← Back to list</button>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8 text-xs">Select an application to process.</p>
                )}
              </div>
            </div>
          )}

          {/* ── LGU ADMIN: NEWS (placeholder) ───────────────────────── */}
          {!isSuper && activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button className="bg-color1 hover:bg-color4 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition">
                  <Plus weight="light" className="w-3.5 h-3.5" /> New announcement
                </button>
              </div>
              {[{ title: 'Water service interruption in Brgy. Rizal', category: 'Advisory', date: 'Apr 30', badge: 'bg-red-100 text-red-800', status: 'Published' },
                { title: 'BPLO permit renewal extended until end of month', category: 'Notice', date: 'Apr 28', badge: 'bg-blue-100 text-blue-800', status: 'Published' },
                { title: 'Liliw Tsinelas Festival 2026 — parade route & traffic rerouting', category: 'Event', date: 'May 3', badge: 'bg-purple-100 text-purple-800', status: 'Scheduled' }
              ].map((n, i) => (
                <div key={i} className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm flex justify-between items-center">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${n.badge}`}>{n.category}</span>
                      <span className="text-[10px] text-slate-400">{n.date}</span>
                      <StatusBadge status={n.status} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-color3 rounded-lg text-slate-400 hover:text-slate-700 transition"><Pencil weight="light" className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"><Trash weight="light" className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LGU ADMIN: FORUM ─────────────────────────────────────── */}
          {!isSuper && activeTab === 'forum' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {[{ label: `Pending ${forumList.filter(f => !f.isApproved).length}`, active: true }, { label: `Approved ${forumList.filter(f => f.isApproved).length}` }, { label: 'Removed 18' }].map((chip, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold ${chip.active ? 'bg-color1 text-slate-800' : 'bg-color5 border border-color4 text-slate-600'}`}>{chip.label}</span>
                ))}
              </div>

              <div className="bg-color2 border border-color4 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-color4">
                  {forumList.map(post => (
                    <div key={post.id} className="p-5 hover:bg-color5/40 transition">
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-color3 border border-color1 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0">
                          {post.initials || post.citizenName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800">{post.citizenName}</span>
                            <span className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {post.flagType && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${post.flagType === 'Hate speech (auto)' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{post.flagType}</span>}
                            {post.isApproved && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Live</span>}
                          </div>
                          <p className="text-sm text-slate-600 bg-color5 border border-color4 p-3 rounded-lg">{post.content}</p>
                          {post.flaggedKeywords.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                              <Warning weight="light" className="w-3.5 h-3.5" /> Flagged keywords: {post.flaggedKeywords.join(', ')}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              {post.upvotes > 0 ? `▲ ${post.upvotes} upvotes · ${post.comments} replies` : 'Reported by users'}
                            </span>
                            {!post.isApproved && (
                              <div className="flex gap-2">
                                <button onClick={() => handleApproveForum(post.id)} className="flex items-center gap-1 bg-color2 border border-color4 hover:bg-color3 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition active:scale-95">
                                  <Check weight="light" className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button onClick={() => handleDeleteForum(post.id)} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition active:scale-95">
                                  <Trash weight="light" className="w-3.5 h-3.5" /> Remove & warn
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── LGU ADMIN: SERVICE BUILDER (placeholder) ────────────── */}
          {!isSuper && activeTab === 'service-builder' && (
            <div className="bg-color2 border border-color4 rounded-xl p-8 shadow-sm text-center space-y-3">
              <Gear weight="light" className="w-12 h-12 text-color1 mx-auto" />
              <h3 className="font-bold text-slate-800">No-code Service Builder</h3>
              <p className="text-slate-400 text-sm">Drag & drop form designer for creating citizen application forms. Available in the full production build.</p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {['Short text', 'Long text', 'Date', 'Dropdown', 'Checkbox', 'File upload', 'GPS', 'Photo'].map(f => (
                  <span key={f} className="px-3 py-1.5 bg-color5 border border-color4 text-slate-600 text-xs font-semibold rounded-lg">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── LGU ADMIN: OFFICE ASSIGNMENTS ───────────────────────── */}
          {!isSuper && activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="bg-color2 border border-color4 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-color5 border-b border-color4 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="p-3 text-left">Category</th><th className="p-3 text-left">Responsible Office</th><th className="p-3 text-left">Notify</th><th className="p-3 text-left">SLA (RA 11032)</th><th className="p-3 text-left">Status</th><th className="p-3 text-left"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-color4">
                    {officeRules.map((rule, i) => (
                      <tr key={i} className="hover:bg-color5/40 transition">
                        <td className="p-3 font-semibold text-slate-800">{rule.category}</td>
                        <td className="p-3 text-slate-600">{rule.office}</td>
                        <td className="p-3 text-slate-500">{rule.notify}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{rule.sla}</span></td>
                        <td className="p-3"><StatusBadge status="Active" /></td>
                        <td className="p-3"><button className="text-slate-400 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"><Pencil weight="light" className="w-3 h-3" />Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-color2 border border-color4 rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm mb-2">How this works</h4>
                <p className="text-xs text-slate-500 leading-relaxed">When a citizen submits a report, AGAPP reads its <b className="text-slate-700">category</b> and automatically forwards it to the assigned office together with an SLA countdown. Unclassified or low-confidence reports fall into the <b className="text-slate-700">Manual Triage</b> queue on the Reports page. No complex rule editor — the LGU only maintains this single list.</p>
              </div>
            </div>
          )}

          {/* ── AUDIT LOG ───────────────────────────────────────────── */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 bg-color2 border border-color4 rounded-lg px-3 py-2 flex-1 min-w-60">
                  <MagnifyingGlass weight="light" className="w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Search by user, action, or resource…" className="bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400 w-full" />
                </div>
                {['Last 24h', '7 days', '30 days'].map(f => (
                  <button key={f} onClick={() => setAuditFilter(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${auditFilter === f ? 'bg-color1 text-slate-800' : 'bg-color2 border border-color4 text-slate-600 hover:bg-color3'}`}>
                    {f}
                  </button>
                ))}
              </div>

              <div className="bg-color2 border border-color4 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-color5 border-b border-color4 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="p-3 text-left">Timestamp</th><th className="p-3 text-left">Actor</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Resource</th><th className="p-3 text-left">IP</th>
                  </tr></thead>
                  <tbody className="divide-y divide-color4">
                    {auditLogs.length > 0 ? auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-color5/40">
                        <td className="p-3 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-semibold text-slate-800">{log.userEmail}</td>
                        <td className="p-3"><StatusBadge status={log.action === 'UPDATE' ? 'Approved' : log.action === 'DELETE' ? 'Rejected' : 'Under Review'} /></td>
                        <td className="p-3 text-slate-600">{log.details}</td>
                        <td className="p-3 font-mono text-slate-400">{log.ipAddress}</td>
                      </tr>
                    )) : (
                      [{ t: '2026-04-30 09:14', actor: user.email, action: 'UPDATE', res: `SR-1042 · status → In review`, ip: '10.2.1.14' },
                       { t: '2026-04-30 09:02', actor: 'jose.santos@liliw', action: 'VIEW', res: 'RPT-00481', ip: '10.2.1.15' },
                       { t: '2026-04-30 08:48', actor: user.email, action: 'PUBLISH', res: 'News #112', ip: '10.2.1.14' },
                       { t: '2026-04-30 08:21', actor: 'admin@liliw', action: 'DELETE', res: 'Forum post #903', ip: '10.2.1.10' },
                       { t: '2026-04-30 07:55', actor: user.email, action: 'CREATE', res: 'Routing rule #5', ip: '10.2.1.14' },
                      ].map((log, i) => (
                        <tr key={i} className="hover:bg-color5/40">
                          <td className="p-3 font-mono text-slate-500">{log.t}</td>
                          <td className="p-3 font-semibold text-slate-800">{log.actor}</td>
                          <td className="p-3"><StatusBadge status={log.action === 'UPDATE' || log.action === 'CREATE' ? 'Approved' : log.action === 'DELETE' ? 'Rejected' : 'Under Review'} /></td>
                          <td className="p-3 text-slate-600">{log.res}</td>
                          <td className="p-3 font-mono text-slate-400">{log.ip}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL: PROVISION LGU ───────────────────────────────────── */}
      {showLguModal && (
        <div className="fixed inset-0 bg-[#1a1a1a]/70 flex items-center justify-center p-4 z-50">
          <div className="bg-color2 rounded-xl shadow-xl border border-color4 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-color4 pb-3">
              <h4 className="font-bold text-slate-800">Onboard new LGU</h4>
              <button onClick={() => setShowLguModal(false)} className="text-slate-400 hover:text-slate-600"><X weight="light" className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateLgu} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">LGU / Municipality Name</label>
                <input type="text" value={newLgu.name} onChange={e => setNewLgu({ ...newLgu, name: e.target.value })} placeholder="e.g. Municipality of Liliw" className="w-full border border-color4 bg-color5 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-color1" required />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Province</label>
                <input type="text" value={newLgu.province} onChange={e => setNewLgu({ ...newLgu, province: e.target.value })} placeholder="e.g. Laguna" className="w-full border border-color4 bg-color5 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-color1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-slate-500 font-semibold mb-1">Primary Color</label><input type="color" value={newLgu.primaryColor} onChange={e => setNewLgu({ ...newLgu, primaryColor: e.target.value })} className="w-full h-10 border border-color4 rounded-lg p-1" /></div>
                <div><label className="block text-slate-500 font-semibold mb-1">Secondary Color</label><input type="color" value={newLgu.secondaryColor} onChange={e => setNewLgu({ ...newLgu, secondaryColor: e.target.value })} className="w-full h-10 border border-color4 rounded-lg p-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-slate-500 font-semibold mb-1">Latitude</label><input type="number" step="0.0001" value={newLgu.latitude} onChange={e => setNewLgu({ ...newLgu, latitude: parseFloat(e.target.value) })} className="w-full border border-color4 rounded-lg p-2.5" required /></div>
                <div><label className="block text-slate-500 font-semibold mb-1">Longitude</label><input type="number" step="0.0001" value={newLgu.longitude} onChange={e => setNewLgu({ ...newLgu, longitude: parseFloat(e.target.value) })} className="w-full border border-color4 rounded-lg p-2.5" required /></div>
              </div>
              <button type="submit" className="w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2.5 rounded-lg shadow transition active:scale-95">Provision Tenant Database</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
