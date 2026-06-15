'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldWarning, Warning, CheckCircle, Clock, Trash, FileText, 
  Database, Bell, Check, X, CaretRight, HardDrive, SignOut
} from '@phosphor-icons/react';

// Seed data matching database triggers
const INITIAL_REPORTS = [
  {
    id: 'rep-001', referenceNumber: 'RPT-00481',
    citizenName: 'Lawrence Alcantara', category: 'pothole',
    description: 'Malaking butas sa kalsada sa tapat ng Liliw Public Market. Mapanganib para sa mga motorsiklo.',
    photoUrl: 'https://placehold.co/400x300/78716c/ffffff?text=Pothole+on+Road',
    latitude: 13.9301, longitude: 121.4651, barangay: 'Poblacion',
    status: 'In Progress', mlConfidence: 0.94, mlVerified: true, isLowCredibility: false,
    assignedOffice: 'Municipal Engineering Office', slaTier: 'simple',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 'rep-002', referenceNumber: 'RPT-00480',
    citizenName: 'Maria Santos', category: 'clogged_drainage',
    description: 'Overflowing canal near Liliw Elementary School causing flooding during light rain.',
    photoUrl: 'https://placehold.co/400x300/44403c/ffffff?text=Clogged+Drainage',
    latitude: 13.9285, longitude: 121.4630, barangay: 'San Juan',
    status: 'Submitted', mlConfidence: 0.88, mlVerified: true, isLowCredibility: false,
    assignedOffice: 'Engineering Office', slaTier: 'simple',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString()
  }
];

const INITIAL_SERVICE_REQUESTS = [
  {
    id: 'req-001', referenceNumber: 'SR-1042',
    citizenName: 'Juan D. Dela Cruz', serviceType: 'Birth Certificate Request',
    officeName: 'Civil Registrar', status: 'Submitted',
    formDetails: { fullName: 'Juan D. Dela Cruz', purpose: 'Employment requirement', barangay: 'Poblacion' },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'req-002', referenceNumber: 'SR-1041',
    citizenName: 'Maria Santos', serviceType: 'Business Permit Renewal',
    officeName: 'BPLO', status: 'Under Review',
    formDetails: { businessName: 'Santos Sari-Sari Store', ownerName: 'Maria Santos' },
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

const INITIAL_FORUM_POSTS = [
  {
    id: 'forum-001', citizenName: 'Maria S.', initials: 'MS',
    content: 'Suggest dagdag na streetlights sa Brgy. San Juan. Madilim pagkatapos ng 7PM malapit sa elementary school.',
    isApproved: true, flaggedKeywords: [],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'forum-002', citizenName: 'Anonymous', initials: '?',
    content: 'Ang tagal naman ng civil registrar. Ilang araw na! putang ina this is annoying.',
    isApproved: false, flaggedKeywords: ['putang ina'], flagType: 'Profanity Filter Triggered (auto)',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

export default function LguAdminDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const lguParam = params?.get('lguName') || '';
  useEffect(() => {
    const base = '/lgu/dashboard';
    const href = lguParam ? `${base}?lguName=${encodeURIComponent(lguParam)}` : base;
    router.replace(href);
  }, [router, lguParam]);
  return null;
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [requests, setRequests] = useState(INITIAL_SERVICE_REQUESTS);
  const [posts, setPosts] = useState(INITIAL_FORUM_POSTS);

  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'services' | 'forum' | 'chatbot'>('reports');
  
  // Modal operations
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Knowledge Base FAQ adding
  const [faqs, setFaqs] = useState([
    { question: 'BPLO Renewal', answer: 'Submit barangay clearance & pay local taxes at Municipal Treasurer.', source: 'Section 3 Charter' }
  ]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const handleUpdateReportStatus = (id: string, newStatus: string) => {
    setReports(prev => prev.map(rep => {
      if (rep.id === id) {
        return { ...rep, status: newStatus };
      }
      return rep;
    }));
    setSelectedReport(null);
  };

  const handleUpdateServiceStatus = (id: string, newStatus: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, status: newStatus };
      }
      return req;
    }));
    setSelectedRequest(null);
  };

  const handleApprovePost = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, isApproved: true, flaggedKeywords: [] };
      }
      return p;
    }));
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) return;
    setFaqs(prev => [...prev, { question: newQuestion, answer: newAnswer, source: 'Admin Console' }]);
    setNewQuestion('');
    setNewAnswer('');
  };

  return (
    <div className="min-h-screen bg-[#e8e7e5] text-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-[#e8e7e5]">
      {/* Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-[#dbdad7] bg-white px-6 dark:border-[#333] dark:bg-[#222]">
        <div className="flex items-center gap-3">
          <ShieldWarning size={24} weight="light" className="text-[#F497A2]" />
          <span className="logo-font text-xl font-bold">Agapp LGU Liliw Admin</span>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 rounded-xl border border-[#dbdad7] px-4 h-10 text-sm font-semibold hover:bg-[#f4f3f0] dark:border-[#333] dark:hover:bg-[#2d2d2d]"
        >
          <SignOut size={16} />
          Sign Out
        </button>
      </header>

      {/* Workspace Menu */}
      <div className="flex justify-center border-b border-[#dbdad7] bg-white px-6 py-2 dark:border-[#333] dark:bg-[#222]">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              activeSubTab === 'reports' ? 'bg-[#1A1A1A] text-white' : 'text-[#5a5a5a] dark:text-[#a0a0a0] hover:bg-[#f4f3f0] dark:hover:bg-[#2d2d2d]'
            }`}
          >
            Citizen Reports ({reports.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('services')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              activeSubTab === 'services' ? 'bg-[#1A1A1A] text-white' : 'text-[#5a5a5a] dark:text-[#a0a0a0] hover:bg-[#f4f3f0] dark:hover:bg-[#2d2d2d]'
            }`}
          >
            Service Requests ({requests.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('forum')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              activeSubTab === 'forum' ? 'bg-[#1A1A1A] text-white' : 'text-[#5a5a5a] dark:text-[#a0a0a0] hover:bg-[#f4f3f0] dark:hover:bg-[#2d2d2d]'
            }`}
          >
            Forum Moderation
          </button>
          <button 
            onClick={() => setActiveSubTab('chatbot')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              activeSubTab === 'chatbot' ? 'bg-[#1A1A1A] text-white' : 'text-[#5a5a5a] dark:text-[#a0a0a0] hover:bg-[#f4f3f0] dark:hover:bg-[#2d2d2d]'
            }`}
          >
            Chatbot FAQ Embedder
          </button>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* TAB 1: REPORTS QUEUE */}
        {activeSubTab === 'reports' && (
          <div className="rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
            <h2 className="text-lg font-bold mb-4">Road Concerns & Citizen Reports Queue</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#dbdad7] text-[#8a8a8a] dark:border-[#333] dark:text-[#666]">
                    <th className="py-3 text-xs font-semibold uppercase">Reference</th>
                    <th className="py-3 text-xs font-semibold uppercase">Citizen</th>
                    <th className="py-3 text-xs font-semibold uppercase">Category</th>
                    <th className="py-3 text-xs font-semibold uppercase">ML Confidence</th>
                    <th className="py-3 text-xs font-semibold uppercase">Status</th>
                    <th className="py-3 text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbdad7] dark:divide-[#333]">
                  {reports.map(rep => (
                    <tr key={rep.id} className="align-middle">
                      <td className="py-4 font-mono text-sm">{rep.referenceNumber}</td>
                      <td className="py-4 text-sm">{rep.citizenName}</td>
                      <td className="py-4 text-sm uppercase font-semibold">{rep.category}</td>
                      <td className="py-4 text-sm">{(rep.mlConfidence * 100).toFixed(0)}% Verified</td>
                      <td className="py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          rep.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                        }`}>{rep.status}</span>
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => setSelectedReport(rep)}
                          className="text-xs font-semibold text-[#F497A2]"
                        >
                          Review & Dispatch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE REQUESTS APPLICATION */}
        {activeSubTab === 'services' && (
          <div className="rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
            <h2 className="text-lg font-bold mb-4">Guided Documents Application Verification</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#dbdad7] text-[#8a8a8a] dark:border-[#333] dark:text-[#666]">
                    <th className="py-3 text-xs font-semibold uppercase">Reference ID</th>
                    <th className="py-3 text-xs font-semibold uppercase">Citizen</th>
                    <th className="py-3 text-xs font-semibold uppercase">Service Type</th>
                    <th className="py-3 text-xs font-semibold uppercase">Status</th>
                    <th className="py-3 text-xs font-semibold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbdad7] dark:divide-[#333]">
                  {requests.map(req => (
                    <tr key={req.id} className="align-middle">
                      <td className="py-4 font-mono text-sm">{req.referenceNumber}</td>
                      <td className="py-4 text-sm">{req.citizenName}</td>
                      <td className="py-4 text-sm font-semibold">{req.serviceType}</td>
                      <td className="py-4">
                        <span className="inline-block rounded-full bg-blue-50 text-blue-800 px-3 py-1 text-xs font-semibold">{req.status}</span>
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="text-xs font-semibold text-[#F497A2]"
                        >
                          Review Form
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FORUM MODERATION */}
        {activeSubTab === 'forum' && (
          <div className="rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
            <h2 className="text-lg font-bold mb-4">Moderate Citizen Community Forum</h2>
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="rounded-xl border border-[#dbdad7] p-4 dark:border-[#333] dark:bg-[#1e1e1e]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">{post.citizenName}</span>
                      <span className="ml-2 text-xs text-[#8a8a8a] dark:text-[#666]">
                        {new Date(post.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {!post.isApproved && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/20 dark:text-red-300">
                        {post.flagType || 'Auto Flagged'}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm">{post.content}</p>
                  
                  {post.flaggedKeywords.length > 0 && (
                    <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                      Flagged Terms: {post.flaggedKeywords.join(', ')}
                    </p>
                  )}

                  <div className="mt-3 flex justify-end gap-2">
                    {!post.isApproved && (
                      <button 
                        onClick={() => handleApprovePost(post.id)}
                        className="flex items-center gap-1 rounded-lg border border-[#dbdad7] px-3 py-1.5 text-xs font-semibold hover:bg-[#f4f3f0] dark:border-[#333] dark:hover:bg-[#2d2d2d]"
                      >
                        <Check size={14} /> Approve
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="flex items-center gap-1 rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-red-600"
                    >
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CHATBOT KNOWLEDGE */}
        {activeSubTab === 'chatbot' && (
          <div className="rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
            <h2 className="text-lg font-bold mb-4">FAQ Knowledge Base Vector Embedder</h2>
            <form onSubmit={handleAddFaq} className="space-y-4 mb-6">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
                  Frequently Asked Question (FAQ)
                </label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="How can citizens request building clearances?"
                  className="w-full h-10 rounded-xl border border-[#dbdad7] px-3 text-sm outline-none focus:border-[#F497A2] dark:border-[#333] dark:bg-[#1e1e1e] dark:text-[#e8e7e5]"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
                  Official Charter Answer
                </label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Go to the BPLO department on the second floor and present a valid ID..."
                  className="w-full h-20 rounded-xl border border-[#dbdad7] p-3 text-sm outline-none focus:border-[#F497A2] dark:border-[#333] dark:bg-[#1e1e1e] dark:text-[#e8e7e5]"
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] text-white border border-white/10 px-4 h-10 text-xs font-semibold hover:bg-black transition-colors"
              >
                <Database size={16} /> Generate & Store Embeddings
              </button>
            </form>

            <h3 className="font-bold text-sm mb-3">Stored Knowledge Index</h3>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-xl border border-[#dbdad7] p-4 dark:border-[#333] dark:bg-[#1e1e1e]">
                  <p className="font-semibold text-sm">Q: {faq.question}</p>
                  <p className="mt-1 text-sm text-[#5a5a5a] dark:text-[#a0a0a0]">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Review Concern Modal */}
      {selectedReport && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-6 z-50">
          <div className="w-full max-w-md rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
            <h3 className="text-lg font-bold mb-2">Review Concern & Auto-Route</h3>
            <p className="text-xs text-[#8a8a8a] dark:text-[#666] mb-4">Ref: {selectedReport.referenceNumber}</p>
            
            <p className="text-sm font-semibold">Description:</p>
            <p className="text-sm text-[#5a5a5a] dark:text-[#a0a0a0] mb-4">{selectedReport.description}</p>
            
            <p className="text-sm font-semibold">Assigned Office (RA 11032 SLA):</p>
            <p className="text-sm text-purple-700 font-bold dark:text-purple-300 mb-4 uppercase">
              {selectedReport.assignedOffice} ({selectedReport.slaTier} SLA)
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="h-10 rounded-xl border border-[#dbdad7] px-4 text-xs font-semibold hover:bg-[#f4f3f0] dark:border-[#333] dark:hover:bg-[#2d2d2d]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateReportStatus(selectedReport.id, 'In Progress')}
                className="h-10 rounded-xl bg-[#1A1A1A] text-white border border-white/10 px-4 text-xs font-semibold hover:bg-black transition-colors"
              >
                Dispatch Repair Crew
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-6 z-50">
          <div className="w-full max-w-md rounded-2xl border border-[#dbdad7] bg-white p-6 dark:border-[#333] dark:bg-[#222]">
            <h3 className="text-lg font-bold mb-2">Review Document Application</h3>
            <p className="text-xs text-[#8a8a8a] dark:text-[#666] mb-4">Ref: {selectedRequest.referenceNumber}</p>
            
            <div className="space-y-2 mb-4">
              {Object.entries(selectedRequest.formDetails).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-[#dbdad7] py-1 dark:border-[#333] text-sm">
                  <span className="capitalize font-semibold text-[#8a8a8a] dark:text-[#666]">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span>{String(val)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="h-10 rounded-xl border border-[#dbdad7] px-4 text-xs font-semibold hover:bg-[#f4f3f0] dark:border-[#333] dark:hover:bg-[#2d2d2d]"
              >
                Close
              </button>
              <button
                onClick={() => handleUpdateServiceStatus(selectedRequest.id, 'Released')}
                className="h-10 rounded-xl bg-[#1A1A1A] text-white border border-white/10 px-4 text-xs font-semibold hover:bg-black transition-colors"
              >
                Approve & Release QR Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
