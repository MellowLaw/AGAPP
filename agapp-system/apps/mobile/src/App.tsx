import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { 
  House as HomeIcon, Bell, User as UserIcon, MapPin, Phone as PhoneCall, 
  Chat as MessageSquare, FileText, Bank as Landmark, Camera, Warning as AlertTriangle, PaperPlaneRight as Send, CheckCircle as CheckCircle2,
  ArrowLeft, MagnifyingGlass as Search, Question as HelpCircle, Star,
  Newspaper, CaretRight as ChevronRight, X
} from '@phosphor-icons/react';
import { supabase } from './supabase';

const apiFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  return res.json();
};

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function App() {
  // Mobile frame wrapper state
  const [selectedLgu, setSelectedLgu] = useState<any>(null);
  const [citizen, setCitizen] = useState<any>(null);
  const [screen, setScreen] = useState('login'); // login, signup, lgu-select, home, services, apply-service, submit-report, tracking, map, emergency, forum, chatbot, settings
  
  // Theme & Language
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'FIL'>('EN');
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch latest published news announcement for selected LGU
  useEffect(() => {
    const loadNews = async () => {
      if (!selectedLgu) return;
      try {
        const { data, error } = await supabase
          .from('news_announcements')
          .select('*')
          .eq('lgu_id', selectedLgu.id)
          .eq('status', 'published')
          .or('scheduled_for.is.null,scheduled_for.lte.now()')
          .order('created_at', { ascending: false })
          .limit(1);
        if (!error && data && data.length > 0) {
          setLatestNews({ title: data[0].title, content: data[0].content });
        } else {
          setLatestNews(null);
        }
      } catch (e) {
        setLatestNews(null);
      }
    };
    loadNews();
  }, [selectedLgu]);

  // Input states
  const [email, setEmail] = useState('lawrence@email.com');
  const [consentLocation, setConsentLocation] = useState(true);
  const [consentPush, setConsentPush] = useState(true);
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const [password, setPassword] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [lguSearch, setLguSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Dynamic list states (local mirror for fallback)
  const [lgus, setLgus] = useState<any[]>([
    {
      id: 'liliw-laguna',
      name: 'Municipality of Liliw',
      logo: 'https://placehold.co/100x100/A2B59F/1A1A1A?text=LILIW',
      bannerUrl: 'https://placehold.co/800x200/A2B59F/1a1a1a?text=Welcome+to+Liliw%2C+Laguna',
      primaryColor: '#A2B59F',
      secondaryColor: '#D9CDB8',
      latitude: 13.9297,
      longitude: 121.4644,
      featureFlags: { chatbot: true, potholeDetection: true, forum: true }
    },
    {
      id: 'nagcarlan-laguna',
      name: 'Municipality of Nagcarlan',
      logo: 'https://placehold.co/100x100/9FADB5/1A1A1A?text=NAGC',
      bannerUrl: 'https://placehold.co/800x200/9FADB5/1a1a1a?text=Welcome+to+Nagcarlan',
      primaryColor: '#9FADB5',
      secondaryColor: '#CAD3D9',
      latitude: 13.9214,
      longitude: 121.4157,
      featureFlags: { chatbot: false, potholeDetection: true, forum: false }
    }
  ]);
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  
  // Form input states
  const [selectedService, setSelectedService] = useState<any>(null);
  const [formFields, setFormFields] = useState<any>({});
  
  // Submit Report states
  const [reportCategory, setReportCategory] = useState('pothole');
  const [reportDesc, setReportDesc] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [snappedPhoto, setSnappedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null); // For real file uploads
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [mlResult, setMlResult] = useState<any>(null);
  const [gpsCoords] = useState({ lat: 13.9301, lng: 121.4651 });
  const [selectedBarangay, setSelectedBarangay] = useState('Poblacion');

  // Forum states
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [newPostText, setNewPostText] = useState('');

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'bot', text: 'Hello! I am your AGAPP LGU Assistant. Ask me anything about document procedures, office hours, or garbage collection schedules!', time: new Date().toLocaleTimeString() }
  ]);
  const [botInput, setBotInput] = useState('');

  // Latest news announcement for home banner
  const [latestNews, setLatestNews] = useState<{ title: string; content: string } | null>(null);

  // Tracking detailed view
  const [selectedItemHistory, setSelectedItemHistory] = useState<any>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Derived markers for map view based on report coordinates
  const reportMarkers = (() => {
    const withCoords = reports.filter(r => typeof r.latitude === 'number' && typeof r.longitude === 'number');
    if (withCoords.length === 0) return [] as { id: string; top: string; left: string; category: string; status: string }[];

    const lats = withCoords.map((r: any) => r.latitude as number);
    const lngs = withCoords.map((r: any) => r.longitude as number);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const hasLatSpread = maxLat !== minLat;
    const hasLngSpread = maxLng !== minLng;
    const latRange = hasLatSpread ? maxLat - minLat : 1;
    const lngRange = hasLngSpread ? maxLng - minLng : 1;

    return withCoords.map((r: any) => {
      const normalizedY = hasLatSpread ? (maxLat - r.latitude) / latRange : 0.5;
      const normalizedX = hasLngSpread ? (r.longitude - minLng) / lngRange : 0.5;
      const top = 5 + 90 * normalizedY;
      const left = 5 + 90 * normalizedX;
      return {
        id: (r.id as string) ?? (r.reference_number as string) ?? String(r.created_at),
        top: `${top}%`,
        left: `${left}%`,
        category: (r.category as string) ?? 'Report',
        status: (r.status as string) ?? 'Submitted',
      };
    });
  })();

  // Fetch initial configs from Supabase LGUs
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('lgus')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setLgus(
            data.map((l: any) => ({
              id: l.id,
              name: l.name,
              logo: l.logo,
              bannerUrl: l.banner_url,
              primaryColor: l.primary_color,
              secondaryColor: l.secondary_color,
              latitude: l.latitude,
              longitude: l.longitude,
              featureFlags: l.feature_flags || { chatbot: true, potholeDetection: true, forum: true },
            }))
          );
        }
      } catch (e) {
        console.warn('Failed to load LGUs from Supabase, using local seeds.');
      }
    };
    loadConfigs();
  }, []);

  // Fetch user data once LGU and login is complete (Supabase)
  const loadUserData = async () => {
    if (!citizen || !selectedLgu) return;
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('lgu_id', selectedLgu.id)
        .eq('citizen_id', citizen.id)
        .order('created_at', { ascending: false });
      if (!reportError && reportData) {
        setReports(reportData);
      }

      const { data: serviceData, error: serviceError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('lgu_id', selectedLgu.id)
        .eq('citizen_id', citizen.id)
        .order('created_at', { ascending: false });
      if (!serviceError && serviceData) {
        setRequests(serviceData);
      }

      const { data: forumData, error: forumError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('lgu_id', selectedLgu.id)
        .order('created_at', { ascending: false });
      if (!forumError && forumData) {
        setForumPosts(forumData);
      }
    } catch (e) {
      console.warn('Failed to load citizen data from Supabase.');
    }
  };

  useEffect(() => {
    loadUserData();
  }, [citizen, screen]);

  // Auth: Supabase email + password
  const handleSignup = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error || !data.user) {
        setAuthError(error?.message || 'Sign up failed');
        setAuthLoading(false);
        return;
      }

      // Create or upsert user profile row
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        name: data.user.user_metadata?.full_name || email,
        role: 'CITIZEN',
      });
      if (profileError) {
        console.warn('Failed to create user profile', profileError);
      }

      setCitizen({ id: data.user.id, email, name: data.user.user_metadata?.full_name || email, role: 'CITIZEN' });
      setScreen('lgu-select');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) {
        setAuthError(error?.message || 'Login failed');
        setAuthLoading(false);
        return;
      }

      // Load profile row
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setCitizen({ id: data.user.id, email, name: data.user.user_metadata?.full_name || email, role: 'CITIZEN' });
      } else {
        setCitizen(profile);
      }
      setScreen('lgu-select');
    } finally {
      setAuthLoading(false);
    }
  };

  // Submit report to LGU (Supabase)
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizen || !selectedLgu) return;

    const payload = {
      lgu_id: selectedLgu.id,
      citizen_id: citizen.id,
      citizen_name: citizen.name,
      category: reportCategory,
      description: reportDesc,
      photo_url: snappedPhoto,
      latitude: gpsCoords.lat,
      longitude: gpsCoords.lng,
      barangay: selectedBarangay,
      status: 'Submitted',
      ml_confidence: mlResult?.mlConfidence || 1.0,
      ml_verified: mlResult?.mlVerified ?? true,
      is_low_credibility: mlResult?.isLowCredibility ?? false,
    };

    const { error } = await supabase
      .from('reports')
      .insert(payload);

    if (error) {
      Alert.alert('Error', error.message || 'Submission failed');
      return;
    }

    await loadUserData();
    setScreen('tracking');
    setSnappedPhoto(null);
    setMlResult(null);
    setReportDesc('');
  };

  // Trigger simulated ML photo detection
  const handleSnapPhoto = async (type: 'pothole' | 'clean') => {
    setCameraOpen(false);
    const photo = type === 'pothole' 
      ? 'https://placehold.co/400x300/57534e/ffffff?text=Pothole+Detected' 
      : 'https://placehold.co/400x300/1e293b/ffffff?text=Living+Room+Chair+Invalid';
    
    setSnappedPhoto(photo);

    try {
      const res = await fetch(`${API_BASE}/reports/verify-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: type === 'pothole' ? 'valid-pothole' : 'invalid-image', category: reportCategory })
      });
      if (res.ok) {
        const data = await res.json();
        setMlResult(data);
      }
    } catch (e) {
      if (type === 'pothole') {
        setMlResult({ mlConfidence: 0.95, mlVerified: true, isLowCredibility: false });
      } else {
        setMlResult({ mlConfidence: 0.18, mlVerified: false, isLowCredibility: true });
      }
    }
  };

  // Handle real file upload from device (for prototype web version)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    setPhotoFile(file);
    setIsUploading(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setSnappedPhoto(base64String); // Show preview

      // Upload to Supabase via API
      try {
        const res = await fetch(`${API_BASE}/upload/photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64String,
            reportId: `temp-${Date.now()}`,
            category: reportCategory
          })
        });
        
        const data = await res.json();
        
        if (data.success && data.url) {
          setUploadedPhotoUrl(data.url);
          setSnappedPhoto(data.url); // Use the uploaded URL
          
          // Run ML verification on uploaded photo
          const verifyRes = await fetch(`${API_BASE}/reports/verify-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoUrl: data.url, category: reportCategory })
          });
          
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            setMlResult(verifyData);
          }
        }
      } catch (err) {
        console.log('Upload failed, using local preview:', err);
        // Keep using base64 preview if upload fails
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply for a service (Civil Registrar / BPLO)
  const handleApplyService = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      lguId: selectedLgu.id,
      citizenId: citizen.id,
      citizenName: citizen.name,
      serviceType: selectedService.name,
      formDetails: formFields
    };

    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setScreen('tracking');
      }
    } catch (e) {
      const mockRef = `REQ-2026-${String(requests.length + 1).padStart(4, '0')}`;
      const newReq = {
        id: `req-${Date.now()}`,
        referenceNumber: mockRef,
        ...payload,
        officeName: selectedService.office,
        status: 'Submitted',
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mockRef}`,
        createdAt: new Date().toISOString(),
        statusHistory: [{ status: 'Submitted', updatedBy: citizen.id, timestamp: new Date().toISOString() }]
      };
      setRequests([newReq, ...requests]);
      setScreen('tracking');
    }
    // reset
    setFormFields({});
    setSelectedService(null);
  };

  // Submit forum post
  const handleSubmitForumPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    if (!citizen || !selectedLgu) return;

    const { error } = await supabase.from('forum_posts').insert({
      lgu_id: selectedLgu.id,
      citizen_id: citizen.id,
      citizen_name: citizen.name,
      content: newPostText,
    });

    if (error) {
      Alert.alert('Error', error.message || 'Failed to submit post');
      return;
    }

    await loadUserData();
    setNewPostText('');
  };

  // Ask Chatbot FAQ RAG query
  const handleChatbotAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;

    const userMsg = { sender: 'user', text: botInput, time: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);
    const currentQuery = botInput;
    setBotInput('');

    try {
      const res = await fetch(`${API_BASE}/chatbot/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          text: data.answer,
          source: data.source,
          offerTicket: data.offerTicket,
          time: new Date().toLocaleTimeString()
        }]);
      }
    } catch (e) {
      // Mock search logic locally
      setTimeout(() => {
        let answer = "I'm sorry, I couldn't find a direct answer in the LGU Knowledge Base. Would you like to file a support ticket to the Help Desk?";
        let source = "RAG System Fallback";
        let offerTicket = true;

        if (currentQuery.toLowerCase().includes('bplo') || currentQuery.toLowerCase().includes('business')) {
          answer = "To renew a business permit in Liliw, Laguna: 1) Go to the BPLO counter at the Liliw Municipal Hall, 2) Submit your barangay clearance, sanitary permit, and fire safety certificate, 3) Pay local taxes at the Municipal Treasurer, and 4) Collect permit plate.";
          source = "BPLO Citizen Charter Section 3";
          offerTicket = false;
        } else if (currentQuery.toLowerCase().includes('birth') || currentQuery.toLowerCase().includes('civil')) {
          answer = "Requesting birth records requires a valid ID and a ₱150 fee. AGAPP generates a priority QR code that you present at the Civil Registrar counter for instant release.";
          source = "Civil Registrar Guide 2026";
          offerTicket = false;
        }

        setChatMessages(prev => [...prev, {
          sender: 'bot',
          text: answer,
          source,
          offerTicket,
          time: new Date().toLocaleTimeString()
        }]);
      }, 500);
    }
  };

  // Submit Rating Feedback
  const handleRateResolution = async (id: string, isReport: boolean) => {
    try {
      const endpoint = isReport ? `${API_BASE}/reports/${id}/rate` : `${API_BASE}/services/${id}/rate`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingVal, feedback: ratingFeedback })
      });
      if (res.ok) {
        loadUserData();
        setSelectedItemHistory(null);
        setRatingFeedback('');
      }
    } catch (e) {
      if (isReport) {
        setReports(reports.map(r => r.id === id ? { ...r, rating: ratingVal, feedback: ratingFeedback } : r));
      }
      setSelectedItemHistory(null);
      setRatingFeedback('');
    }
  };

  return (
    <div className="w-[360px] h-[720px] bg-slate-950 rounded-[40px] border-[10px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col ring-4 ring-slate-800/50">
      
      {/* Notch / Speaker bar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-50 flex items-center justify-center">
        <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
      </div>

      {/* Simulated Time and Status bar */}
      <div className="bg-slate-950 text-white text-[10px] px-6 pt-7 pb-1.5 flex justify-between items-center z-40">
        <span className="font-semibold">09:58 AM</span>
        <div className="flex items-center gap-1">
          <span className="text-[8px] bg-slate-800 border border-slate-700 px-1 rounded font-bold">5G</span>
          <div className="w-4 h-2 border border-white rounded-sm flex p-0.5"><div className="bg-white flex-1 rounded-sm"></div></div>
        </div>
      </div>

      {/* Viewport Screen */}
      <div className={`flex-1 overflow-y-auto flex flex-col ${isDarkMode ? 'dark bg-[#1A1A1A] text-[#e8e7e5]' : 'bg-[#e8e7e5] text-[#1A1A1A]'}`}>
        {appLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#1A1A1A] text-[#e8e7e5] p-6">
            <div className="text-center space-y-4">
              <h1 className="logo-font text-5xl text-white">
                A<span className="animate-pulse" style={{ color: selectedLgu?.primaryColor || '#F497A2' }}>g</span>app.
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">
                {selectedLgu ? selectedLgu.name : 'Automated Governance'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* SCREEN: LOGIN / SIGNUP */}
        {screen === 'login' && (
          <div className="flex-1 flex flex-col justify-between bg-color5">
            {/* Title Bar Header */}
            <div className="bg-color2 border-b border-color4 px-4 py-3 flex items-center justify-center relative">
              <span className="font-bold text-sm text-slate-800">Sign in</span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="my-auto space-y-5 text-center">
                {/* AGAPP Premium Logo */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-[#1A1A1A] px-5 py-2.5 rounded-2xl shadow-md border border-color4">
                    <h1 className="logo-font text-3xl text-white">
                      A<span className="text-color1 animate-pulse">g</span>app.
                    </h1>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-semibold">National digital platform for citizens of the Philippines.</p>
                </div>
                
                <div className="space-y-3.5 pt-1 text-left text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      className="w-full bg-color2 border border-color4 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-color1 transition"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wider text-[9px]">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      className="w-full bg-color2 border border-color4 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-color1 transition"
                      placeholder="••••••••"
                    />
                  </div>

                  {authError && (
                    <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-1">
                      {authError}
                    </div>
                  )}

                  {/* Privacy Notice Checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                      <input 
                        type="checkbox" 
                        checked={privacyAccepted}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrivacyAccepted(e.target.checked)}
                        className="mt-0.5 rounded text-color1 focus:ring-color1"
                      />
                      <span className="text-[10px] text-slate-500 leading-snug">
                        I accept the <span className="text-color1 font-bold hover:underline">Privacy Notice</span> and consent to location sharing for road damage reporting under RA 10173.
                      </span>
                    </label>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button 
                  onClick={handleLogin}
                  disabled={!privacyAccepted || authLoading}
                  className={`w-full font-semibold py-2.5 rounded-xl shadow transition active:scale-95 text-xs ${privacyAccepted && !authLoading ? 'bg-color1 hover:bg-color4 text-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  {authLoading ? 'Signing in…' : 'Sign in'}
                </button>

                <button 
                  onClick={handleSignup}
                  disabled={!privacyAccepted || authLoading}
                  className="w-full font-semibold py-2.5 rounded-xl border border-color4 bg-white text-xs text-slate-700 hover:bg-color2 active:scale-95 transition"
                >
                  Create new account
                </button>

                <div className="text-[9px] text-center text-slate-400">
                  You can change to phone/PIN login later once SMS is enabled.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN: LGU SELECTOR */}
        {screen === 'lgu-select' && (
          <div className="flex-1 flex flex-col justify-between bg-color5">
            <div className="bg-color2 border-b border-color4 px-4 py-3 flex items-center justify-center relative">
              <span className="font-bold text-sm text-slate-800">Select Portal</span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Select Local Jurisdiction</h3>
                  <p className="text-slate-500 text-[10px] leading-normal">Choose the municipality where you reside to access E-Services and file damage reports.</p>
                </div>
                
                {/* Search input */}
                <div className="flex items-center gap-2 bg-color2 border border-color4 rounded-xl px-3 py-2 text-xs">
                  <Search weight="light" className="w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by city, municipality, or province…" 
                    value={lguSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLguSearch(e.target.value)}
                    className="bg-transparent outline-none text-slate-700 placeholder-slate-400 w-full"
                  />
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
                  {lgus
                    .filter(l => l.name.toLowerCase().includes(lguSearch.toLowerCase()) || (l.province && l.province.toLowerCase().includes(lguSearch.toLowerCase())))
                    .map(lgu => (
                      <button 
                        key={lgu.id}
                        onClick={() => {
                          setSelectedLgu(lgu);
                          setAppLoading(true);
                          setTimeout(() => {
                            setAppLoading(false);
                            setScreen('home');
                          }, 1200);
                        }}
                        className="w-full bg-color2 border border-color4 rounded-xl p-3 flex items-center gap-3.5 hover:border-color1 hover:shadow-sm text-left active:scale-[0.98] transition"
                      >
                        <img src={lgu.logo} alt="Seal" className="w-10 h-10 rounded-full border border-color4 ring-1 ring-color1/20 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs text-slate-800 truncate">{lgu.name}</h4>
                            <span className="text-[7.5px] bg-color3 text-slate-700 font-bold border border-color1 px-1 rounded">Pilot</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium">{lgu.province || 'Laguna'}</p>
                        </div>
                      </button>
                    ))}
                  {lgus.filter(l => l.name.toLowerCase().includes(lguSearch.toLowerCase()) || (l.province && l.province.toLowerCase().includes(lguSearch.toLowerCase()))).length === 0 && (
                    <p className="text-slate-400 text-center py-6 text-[10px]">No pilot LGU found for "{lguSearch}"</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN: HOME */}
        {screen === 'home' && selectedLgu && (
          <div className="flex flex-col flex-1 pb-16">
            {/* Hamburger + Bell Icon Header */}
            <div className="p-4 bg-color2 border-b border-color4 flex items-center justify-between shadow-sm">
              <button onClick={() => Alert.alert('Menu', 'Menu opened')} className="text-slate-600 hover:text-slate-800">
                <div className="w-4 h-3 flex flex-col justify-between">
                  <div className="h-0.5 w-full bg-slate-600 rounded"></div>
                  <div className="h-0.5 w-3/4 bg-slate-600 rounded"></div>
                  <div className="h-0.5 w-full bg-slate-600 rounded"></div>
                </div>
              </button>
              <div className="flex flex-col items-center text-center">
                <span className="font-extrabold text-xs tracking-wide text-slate-800">{selectedLgu.name}</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{selectedLgu.province || 'Laguna'}</span>
              </div>
              <button onClick={() => Alert.alert('Notifications', 'Opening notifications...')} className="text-slate-600 hover:text-slate-800 relative">
                <Bell weight="light" className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
            </div>

            {/* News Updates Banner */}
            <div className="m-4 rounded-xl overflow-hidden shadow-sm relative h-28 border border-color4">
              <img src={selectedLgu.bannerUrl || 'https://placehold.co/800x200/f0b2c7/ffffff'} alt="LGU banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-800/40 p-3 flex flex-col justify-end text-white">
                <span className="bg-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit uppercase mb-1">{latestNews ? 'Announcement' : 'Update'}</span>
                <p className="font-bold text-[10px] line-clamp-2">
                  {latestNews ? latestNews.title : 'Welcome to your LGU digital portal. Check back here for important announcements.'}
                </p>
              </div>
            </div>

            {/* 8 Feature Tiles Grid */}
            <div className="grid grid-cols-4 gap-3 px-4 py-2">
              <button 
                onClick={() => setScreen('services')}
                className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
              >
                <div className="p-2 bg-color3 text-slate-700 rounded-lg"><FileText weight="light" className="w-4 h-4" /></div>
                <span className="text-[9px] font-bold text-slate-700">Services</span>
              </button>

              <button 
                onClick={() => setScreen('submit-report')}
                className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
              >
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Camera weight="light" className="w-4 h-4" /></div>
                <span className="text-[9px] font-bold text-slate-700">Report</span>
              </button>

              <button 
                onClick={() => setScreen('tracking')}
                className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
              >
                <div className="p-2 bg-color3 text-slate-700 rounded-lg"><CheckCircle2 weight="light" className="w-4 h-4" /></div>
                <span className="text-[9px] font-bold text-slate-700">Track</span>
              </button>

              <button 
                onClick={() => setScreen('map')}
                className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
              >
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><MapPin weight="light" className="w-4 h-4" /></div>
                <span className="text-[9px] font-bold text-slate-700">Map</span>
              </button>

              <button 
                onClick={() => setScreen('emergency')}
                className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
              >
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><PhoneCall weight="light" className="w-4 h-4" /></div>
                <span className="text-[9px] font-bold text-slate-700">Hotlines</span>
              </button>

              {selectedLgu.featureFlags.forum && (
                <button 
                  onClick={() => setScreen('forum')}
                  className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
                >
                  <div className="p-2 bg-color3 text-slate-700 rounded-lg"><MessageSquare weight="light" className="w-4 h-4" /></div>
                  <span className="text-[9px] font-bold text-slate-700">Forum</span>
                </button>
              )}

              {selectedLgu.featureFlags.chatbot && (
                <button 
                  onClick={() => setScreen('chatbot')}
                  className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
                >
                  <div className="p-2 bg-color3 text-slate-700 rounded-lg"><HelpCircle weight="light" className="w-4 h-4" /></div>
                  <span className="text-[9px] font-bold text-slate-700">Helpdesk</span>
                </button>
              )}

              <button 
                onClick={() => setScreen('news')}
                className="bg-color2 border border-color4 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center active:scale-95 transition hover:border-color1"
              >
                <div className="p-2 bg-color3 text-slate-700 rounded-lg"><Newspaper weight="light" className="w-4 h-4" /></div>
                <span className="text-[9px] font-bold text-slate-700">News</span>
              </button>
            </div>

            {/* Latest Announcement Card */}
            <div className="mx-4 my-2 p-3 bg-color2 border border-color4 rounded-xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="bg-color3 text-[9px] text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-color1">Latest Announcement</span>
                <span className="text-[8px] text-slate-400 font-bold">2h ago</span>
              </div>
              <h5 className="font-bold text-xs text-slate-800 leading-snug">Water service interruption in Brgy. Rizal from 1PM to 5PM today.</h5>
              <p className="text-[9.5px] text-slate-500 leading-normal line-clamp-2">Please store enough water for basic needs. Engineering crew is scheduled to repair a pipeline leakage near Rizal Elementary School.</p>
              <button onClick={() => setScreen('news')} className="text-[9px] text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1">Read full advisory <ChevronRight weight="light" className="w-3 h-3 text-color1" /></button>
            </div>

            {/* Quick emergency SOS strip */}
            <div className="m-4 p-3 bg-red-600 rounded-xl text-white flex items-center justify-between shadow-sm">
              <div>
                <h5 className="font-bold text-[10px] uppercase tracking-wide">Emergency SOS Assist</h5>
                <p className="text-[8px] text-white/80">Sends GPS & alerts MDRRMO desk</p>
              </div>
              <button 
                onClick={() => Alert.alert('SOS Triggered', 'Location payload dispatched to MDRRMO desk.')}
                className="bg-white text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm active:scale-90 transition"
              >
                Trigger SOS
              </button>
            </div>

            <div className="flex justify-center my-0.5">
              <button onClick={() => setScreen('lgu-select')} className="text-[9px] text-slate-400 hover:underline">Switch LGU Portal</button>
            </div>
          </div>
        )}

        {/* SCREEN: SERVICE CATALOGUE */}
        {screen === 'services' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm text-slate-800">E-Services Portal</h3>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {['All', 'Civil Reg.', 'Permits', 'Health'].map(f => (
                <button key={f} onClick={() => setServiceFilter(f)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition flex-shrink-0 ${serviceFilter === f ? 'bg-color1 text-slate-800 border border-color4' : 'bg-color2 border border-color4 text-slate-500 hover:bg-color3'}`}>
                  {f}
                </button>
              ))}
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[360px]">
              {[
                { name: 'Birth Certificate Request', category: 'Civil Reg.', office: 'Civil Registrar', fee: '₱150', time: '1-3 Working Days', desc: 'Secure an official copy of your Birth Certificate.' },
                { name: 'Marriage Certificate Copy', category: 'Civil Reg.', office: 'Civil Registrar', fee: '₱150', time: '1-3 Working Days', desc: 'Request Certified True Copy of Marriage Contract.' },
                { name: 'Business Permit Renewal', category: 'Permits', office: 'BPLO', fee: 'Assessed locally', time: '3 Working Days', desc: 'Annual renewal of municipal business operational permit.' },
                { name: 'Sanitary & Health Permit', category: 'Health', office: 'City Health Office', fee: '₱50', time: '1 Working Day', desc: 'Obtain sanitary clearance and health card for employees.' }
              ]
                .filter(s => serviceFilter === 'All' || s.category === serviceFilter)
                .map((svc, i) => (
                  <div key={i} className="bg-color2 border border-color4 rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{svc.name}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Dept: {svc.office}</p>
                      </div>
                      <span className="bg-color3 text-slate-700 font-bold text-[8px] px-1.5 py-0.5 rounded border border-color1 flex-shrink-0">RA 11032 Simple</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">{svc.desc}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 bg-color5 p-2 rounded border border-color4">
                      <span>Fee: <b>{svc.fee}</b></span>
                      <span>Processing: <b>{svc.time}</b></span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedService(svc);
                        setScreen('apply-service');
                      }}
                      className="w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2 rounded-lg text-xs transition active:scale-95"
                    >
                      Apply Document
                    </button>
                  </div>
                ))}
            </div>

            {/* Citizen's Guide Card */}
            <div className="bg-color3 border border-color1 rounded-xl p-3.5 space-y-2 mt-auto">
              <div className="flex items-center gap-2"><FileText weight="light" className="w-4 h-4 text-slate-700" /><h4 className="font-bold text-xs text-slate-800">Citizen's Charter (RA 11032)</h4></div>
              <p className="text-[10px] text-slate-500 leading-normal">Under the Ease of Doing Business Act, simple transactions must be completed within 3 working days, complex in 7, and highly technical in 20. If you experience delays, report it to our Help Desk.</p>
            </div>
          </div>
        )}

        {/* SCREEN: GUIDED APPLICATION FORM */}
        {screen === 'apply-service' && selectedService && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('services')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm text-slate-800">Apply: {selectedService.name}</h3>
            </div>

            <form onSubmit={handleApplyService} className="space-y-4 text-xs">
              {selectedService.name.includes('Birth') ? (
                <>
                   <div>
                     <label className="block text-slate-500 font-semibold mb-1">Full Name of Child</label>
                     <input 
                       type="text" 
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormFields({ ...formFields, fullName: e.target.value })}
                       className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-slate-500 font-semibold mb-1">Date of Birth</label>
                     <input 
                       type="date" 
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormFields({ ...formFields, birthDate: e.target.value })}
                       className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-slate-500 font-semibold mb-1">Place of Birth</label>
                     <input 
                       type="text" 
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormFields({ ...formFields, placeOfBirth: e.target.value })}
                       className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       required
                     />
                   </div>
                </>
              ) : (
                <>
                   <div>
                     <label className="block text-slate-500 font-semibold mb-1">Business Name</label>
                     <input 
                       type="text" 
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormFields({ ...formFields, businessName: e.target.value })}
                       className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-slate-500 font-semibold mb-1">Owner Full Name</label>
                     <input 
                       type="text" 
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormFields({ ...formFields, ownerName: e.target.value })}
                       className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                       required
                     />
                   </div>
                </>
              )}

              <button 
                type="submit"
                className="w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2.5 rounded-lg shadow transition active:scale-95"
              >
                Submit Request & Generate QR
              </button>
            </form>
          </div>
        )}

        {/* SCREEN: SUBMIT REPORT (YOLO INTEGRATION MOCK) */}
        {screen === 'submit-report' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm text-slate-800">Submit Issue Report</h3>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
               <div>
                 <label className="block text-slate-500 font-semibold mb-1">Report Category</label>
                 <select 
                   value={reportCategory}
                   onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportCategory(e.target.value)}
                   className="w-full border border-slate-200 rounded-lg p-2"
                 >
                  <option value="pothole">Pothole & Road Damage</option>
                  <option value="clogged_drainage">Clogged Drainage</option>
                  <option value="stray_animal">Stray / Missing Pets</option>
                  <option value="lost_found">Lost and Found</option>
                </select>
              </div>

               <div>
                 <label className="block text-slate-500 font-semibold mb-1">Barangay Location</label>
                 <select 
                   value={selectedBarangay}
                   onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBarangay(e.target.value)}
                   className="w-full border border-slate-200 rounded-lg p-2"
                 >
                  <option value="Concepcion Pequeña">Concepcion Pequeña</option>
                  <option value="Bagumbayan Sur">Bagumbayan Sur</option>
                  <option value="San Francisco">San Francisco</option>
                  <option value="Liboton">Liboton</option>
                </select>
              </div>

              {/* Photo Input with Real Upload + Simulated YOLO Check */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Evidence Photo Capture</label>
                {snappedPhoto ? (
                  <div className="space-y-2">
                    <div className="h-32 rounded-lg overflow-hidden border border-slate-200 relative">
                      <img src={snappedPhoto} alt="Evidence" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setSnappedPhoto(null); setMlResult(null); setUploadedPhotoUrl(null); setPhotoFile(null); }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
                      >
                        <X weight="light" className="w-3 h-3" />
                      </button>
                    </div>

                    {/* YOLO Indicator */}
                    {mlResult && (
                      <div className={`p-2.5 rounded-lg border flex items-center justify-between ${mlResult.isLowCredibility ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle weight="light" className="w-4 h-4 flex-shrink-0" />
                          <span className="font-bold uppercase tracking-wider text-[8px]">{mlResult.isLowCredibility ? 'YOLO Alert: Non-damage detected' : 'YOLO Check: Valid Road Damage'}</span>
                        </div>
                        <span className="font-extrabold text-[10px]">{Math.round(mlResult.mlConfidence * 100)}%</span>
                      </div>
                    )}

                    {/* Upload Status */}
                    {isUploading && (
                      <div className="p-2.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-100">
                        <span className="font-bold text-[10px]">📤 Uploading to Supabase Storage...</span>
                      </div>
                    )}
                    {uploadedPhotoUrl && (
                      <div className="p-2.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-100">
                        <span className="font-bold text-[10px]">✅ Uploaded to Supabase Storage</span>
                      </div>
                    )}

                    {/* Simulated GPS map preview */}
                    <div className="border border-color4 rounded-xl overflow-hidden h-20 bg-sky-50 relative mt-2">
                      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]"></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col text-[9px] text-slate-500 bg-sky-50/60 font-semibold gap-0.5">
                        <MapPin weight="light" className="w-4 h-4 text-red-500 animate-bounce" />
                        <span>GPS Locked: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</span>
                        <span className="text-[8px] text-slate-400 font-normal">Accuracy radius: 3 meters</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Real File Upload Option */}
                    <label className="w-full h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-1 cursor-pointer hover:border-color1 hover:text-slate-600 transition bg-slate-50">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Camera weight="light" className="w-6 h-6" />
                      <span className="text-[10px] font-medium">📷 Upload Real Photo</span>
                      <span className="text-[8px]">(Stored in Supabase Storage)</span>
                    </label>
                    
                    {/* Simulation Option */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-2 bg-white text-[10px] text-slate-400">or simulate</span>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="w-full h-16 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 gap-2 hover:bg-slate-50 transition"
                    >
                      <span className="text-[11px]">🎮 Open Demo Camera</span>
                    </button>
                  </div>
                )}
              </div>

               <div>
                 <label className="block text-slate-500 font-semibold mb-1">Additional description (Optional)</label>
                 <textarea 
                   value={reportDesc}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportDesc(e.target.value)}
                   className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                   rows={2}
                   placeholder="Details like landmark, etc."
                 />
               </div>

              <button 
                type="submit"
                className={`w-full font-semibold py-2.5 rounded-lg shadow transition active:scale-95 ${snappedPhoto ? 'bg-color1 hover:bg-color4 text-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                disabled={!snappedPhoto}
              >
                Submit Geotagged Report
              </button>
            </form>
          </div>
        )}

        {/* SCREEN: MOCK CAMERA CAMERA */}
        {cameraOpen && (
          <div className="fixed inset-0 bg-black flex flex-col justify-between p-6 z-50">
            <div className="flex justify-between items-center text-white">
              <span className="text-xs font-semibold uppercase tracking-wider">YOLOv8 On-Device Detector Viewfinder</span>
              <button onClick={() => setCameraOpen(false)} className="text-white"><X weight="light" className="w-6 h-6" /></button>
            </div>
            
            {/* Viewfinder grid lines */}
            <div className="h-96 border border-white/20 rounded-lg relative flex items-center justify-center text-white/50 text-xs">
              <div className="absolute inset-0 border-b border-t border-white/10 flex flex-col justify-between py-12">
                <div className="border-b border-white/10 w-full h-0"></div>
                <div className="border-b border-white/10 w-full h-0"></div>
              </div>
              <p>Simulating camera focus...</p>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-center text-slate-400">Capture test subjects to test model accuracy:</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSnapPhoto('pothole')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-xs"
                >
                  Snap Pothole Image
                </button>
                <button 
                  onClick={() => handleSnapPhoto('clean')}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-xs"
                >
                  Snap Random Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN: TRACKING BOARD */}
        {screen === 'tracking' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm text-slate-800">My Submissions Tracker</h3>
            </div>

            {/* List */}
            <div className="space-y-3">
              {/* Reports */}
              {reports.map(r => (
                <div 
                  key={r.id}
                  onClick={() => setSelectedItemHistory({ item: r, isReport: true })}
                  className="bg-color2 border border-color4 rounded-xl p-3.5 shadow-sm space-y-2 text-xs hover:border-color1 active:scale-95 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{r.referenceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      r.status === 'Submitted' ? 'bg-amber-100 text-amber-800' :
                      r.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                      r.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                      r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-slate-500 font-semibold capitalize text-[10px]">Type: Issue Report ({r.category})</p>
                  <p className="text-slate-600 line-clamp-1 mt-1">{r.description || 'No description'}</p>

                  {/* Inline vertical stepper */}
                  <div className="mt-2.5 pt-2 border-t border-color4/60 space-y-2">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Status Timeline</p>
                    <div className="space-y-2 pl-3 border-l-2 border-color1 relative">
                      {(r.statusHistory || [{ status: 'Submitted', timestamp: r.createdAt }]).map((hist: any, hIdx: number) => (
                        <div key={hIdx} className="relative text-[9px]">
                          <div className="absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-800 ring-2 ring-white"></div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{hist.status}</span>
                            <span className="text-[8px] text-slate-400">{new Date(hist.timestamp).toLocaleDateString()}</span>
                          </div>
                          {hist.notes && <p className="text-[8.5px] text-slate-400 mt-0.5">{hist.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Requests */}
              {requests.map(req => (
                <div 
                  key={req.id}
                  className="bg-color2 border border-color4 rounded-xl p-3.5 shadow-sm space-y-2 text-xs hover:border-color1 active:scale-95 transition"
                >
                  <div 
                    onClick={() => setSelectedItemHistory({ item: req, isReport: false })}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">{req.referenceNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        req.status === 'Submitted' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                        req.status === 'Released' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-semibold text-[10px]">Type: Document Request ({req.serviceType})</p>
                    <p className="text-slate-400 text-[9px] mt-1">Tap to view details and download form.</p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2 border-t border-color4/60">
                    <a 
                      href={`${API_BASE}/services/${req.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2 rounded-lg text-[10px] transition"
                    >
                      <FileText weight="fill" className="w-3.5 h-3.5" />
                      Download Form
                    </a>
                    <button
                      onClick={() => setSelectedItemHistory({ item: req, isReport: false })}
                      className="flex-1 bg-color3 hover:bg-color4 text-slate-700 font-semibold py-2 rounded-lg text-[10px] transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN: MAP VIEW */}
        {screen === 'map' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm text-slate-800">Town Map Landmarks</h3>
            </div>
            {/* Map Simulator */}
            <div className="flex-1 bg-sky-50 rounded-xl border border-slate-200 overflow-hidden relative min-h-[300px]">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px]"></div>
              {/* Landmark Pins */}
              <div className="absolute top-10 left-12 p-1.5 bg-green-700 text-white rounded text-[8px] font-bold shadow flex items-center gap-1">
                <Landmark weight="light" className="w-3 h-3" /> Liliw Municipal Hall
              </div>
              <div className="absolute top-36 left-48 p-1.5 bg-red-600 text-white rounded text-[8px] font-bold shadow flex items-center gap-1">
                <PhoneCall weight="light" className="w-3 h-3" /> Liliw District Hospital
              </div>
              <div className="absolute bottom-20 left-20 p-1.5 bg-emerald-600 text-white rounded text-[8px] font-bold shadow flex items-center gap-1">
                <MapPin weight="light" className="w-3 h-3" /> Liliw Town Plaza
              </div>
              {/* Dynamic report pins from Supabase data */}
              {reportMarkers.map(pin => (
                <div
                  key={pin.id}
                  style={{ top: pin.top, left: pin.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
                >
                  <div className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow" />
                  <span className="text-[7px] font-semibold text-slate-800 bg-white/80 px-1 py-0.5 rounded">
                    {pin.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN: EMERGENCY HOTLINES */}
        {screen === 'emergency' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm text-slate-800">Emergency Hotlines</h3>
            </div>

            {/* Emergency Red Banner */}
            <div className="bg-red-600 text-white rounded-xl p-3 shadow-sm space-y-1 mb-2">
              <h4 className="font-extrabold text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle weight="light" className="w-3.5 h-3.5 animate-pulse" /> IN CASE OF EMERGENCY
              </h4>
              <p className="text-[9.5px] text-white/80 leading-normal">Tap any hotline below to initiate a voice call. Your live GPS coordinates will be shared with the dispatcher center automatically.</p>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Liliw Municipal PNP Station', num: '049-501-1234' },
                { name: 'Bureau of Fire Protection — Liliw', num: '049-501-5678' },
                { name: 'MDRRMO Rescue Desk', num: '049-501-9999' },
                { name: 'Liliw District Hospital', num: '049-501-4321' }
              ].map((hot, idx) => (
                <div key={idx} className="bg-color2 border border-color4 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">{hot.name}</h5>
                    <span className="text-[10px] text-slate-500">{hot.num}</span>
                  </div>
                  <a 
                    href={`tel:${hot.num}`}
                    onClick={(e) => { e.preventDefault(); Alert.alert('Call', `Placing simulated outgoing call to ${hot.name} (${hot.num}).`); }}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <PhoneCall weight="light" className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN: COMMUNITY FORUM */}
        {screen === 'forum' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm text-slate-800">Citizen Community Forum</h3>
            </div>

             <form onSubmit={handleSubmitForumPost} className="flex gap-2 text-xs">
               <input 
                 type="text" 
                 value={newPostText}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPostText(e.target.value)}
                 placeholder="Share concerns or questions..."
                 className="flex-1 border border-color4 bg-color2 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-color1"
               />
              <button type="submit" className="p-2.5 bg-color1 hover:bg-color4 text-slate-800 rounded-xl active:scale-95 transition"><Send weight="light" className="w-4 h-4" /></button>
            </form>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {forumPosts.map(post => (
                <div key={post.id} className="bg-color2 border border-color4 rounded-xl p-3 space-y-1 text-xs shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{post.citizenName}</span>
                    <span className="text-[9px] text-slate-400">{new Date(post.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 mt-1">{post.content}</p>
                  
                  {!post.isApproved && (
                    <div className="text-[9px] font-bold text-red-500 flex items-center gap-1.5 mt-1">
                      <AlertTriangle weight="light" className="w-3.5 h-3.5" /> Flagged (Putang Ina) - Awaiting Moderation review.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN: CHATBOT HELPDESK */}
        {screen === 'chatbot' && (
          <div className="flex flex-col flex-1 pb-16 h-full justify-between">
            {/* Header */}
            <div className="p-4 bg-color2 border-b border-color4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded text-slate-700"><ArrowLeft weight="light" className="w-4 h-4" /></button>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">LGU RAG Chatbot</h4>
                  <span className="text-[8px] text-emerald-600 font-semibold">Knowledge Base Active</span>
                </div>
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-color5">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] text-xs shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-color1 text-slate-800' 
                      : 'bg-color2 border border-color4 text-slate-800'
                  }`}>
                    <p>{msg.text}</p>
                    {msg.source && (
                      <span className="block mt-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Source: {msg.source}</span>
                    )}
                  </div>
                  {msg.offerTicket && (
                    <button 
                      onClick={() => {
                        Alert.alert('Support Ticket', 'Support Ticket filed in LGU Admin Helpdesk!');
                        setChatMessages(prev => [...prev, { sender: 'bot', text: 'Support Ticket registered successfully. Code: TKT-2026-904', time: new Date().toLocaleTimeString() }]);
                      }}
                      className="mt-2 text-[10px] font-bold text-slate-700 bg-color3 border border-color1 px-3 py-1.5 rounded-lg active:scale-95 transition"
                    >
                      File Helpdesk Ticket
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input form */}
             <form onSubmit={handleChatbotAsk} className="p-3 bg-color2 border-t border-color4 flex gap-2 text-xs">
               <input 
                 type="text" 
                 value={botInput}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBotInput(e.target.value)}
                 placeholder="Ask permit guide, garbage schedules..."
                 className="flex-1 border border-color4 bg-color5 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-color1"
               />
              <button type="submit" className="p-2.5 bg-color1 hover:bg-color4 text-slate-800 rounded-xl active:scale-95 transition"><Send weight="light" className="w-4 h-4" /></button>
            </form>
          </div>
        )}

        {/* SCREEN: SETTINGS */}
        {screen === 'settings' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
              <h3 className="font-bold text-sm">Account Preferences</h3>
            </div>

            <div className="bg-color2 border border-color4 rounded-xl p-4 space-y-4 text-xs">
              {/* Display Theme — premium pill toggle */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">Display Theme</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{isDarkMode ? 'Dark mode on' : 'Light mode on'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`toggle-track ${isDarkMode ? 'on' : 'off'}`}
                  aria-label="Toggle dark mode"
                >
                  <div className="toggle-knob" />
                </button>
              </div>

              <div className="flex justify-between items-center border-t border-color4 pt-3">
                <span className="font-semibold">Interface Language</span>
                <button 
                  onClick={() => setLanguage(language === 'EN' ? 'FIL' : 'EN')}
                  className="bg-color5 border border-color4 font-bold px-3 py-1.5 rounded-full text-[11px] active:scale-95 transition hover:bg-color3"
                >
                  {language === 'EN' ? '🇬🇧 English' : '🇵🇭 Filipino'}
                </button>
              </div>

              {/* Privacy & Consent Section */}
              <div className="pt-3 border-t border-color4 space-y-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Privacy &amp; Consent (DPA)</p>
                
                {[
                  { label: 'Share precise GPS location', value: consentLocation, setter: setConsentLocation },
                  { label: 'Receive Push Notifications', value: consentPush, setter: setConsentPush },
                  { label: 'Anonymous Analytics tracking', value: consentAnalytics, setter: setConsentAnalytics },
                  { label: 'Marketing advisory emails', value: consentMarketing, setter: setConsentMarketing }
                ].map((c, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-slate-600 flex-1 pr-3">{c.label}</span>
                    <button
                      type="button"
                      onClick={() => c.setter(!c.value)}
                      className={`toggle-track ${c.value ? 'on' : 'off'}`}
                      aria-label={c.label}
                    >
                      <div className="toggle-knob" />
                    </button>
                  </div>
                ))}

                <button type="button" onClick={() => setScreen('tracking')}
                  className="w-full bg-color3 border border-color1 text-slate-700 font-semibold py-2.5 rounded-xl text-center hover:bg-color1 transition mt-1"
                >
                  📋 View My Submissions Tracker
                </button>

                <div className="pt-2 border-t border-color4 space-y-2 text-[10px]">
                  <button type="button" onClick={() => Alert.alert('DSAR Request', 'Your data payload is being compiled and will be sent to your registered email.')} 
                    className="w-full text-left font-semibold hover:underline flex items-center gap-1.5 py-1">
                    📥 Download My Data (DSAR Request)
                  </button>
                  <button type="button" onClick={() => Alert.alert('Erasure Request', 'Erasure request submitted under RA 10173. An LGU DPO will review your request within 15 days.')} 
                    className="w-full text-left text-red-500 font-semibold hover:underline flex items-center gap-1.5 py-1">
                    ⚠️ Request Account &amp; Data Erasure
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-color4">
                <button 
                  onClick={() => {
                    setCitizen(null);
                    setScreen('login');
                  }}
                  className="w-full bg-red-50 text-red-600 font-semibold py-2.5 rounded-xl text-center border border-red-100 hover:bg-red-100 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN: DEDICATED NEWS SCREEN */}
        {screen === 'news' && (
          <div className="p-4 space-y-4 flex flex-col flex-1 pb-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setScreen('home')} className="p-1 hover:bg-color3 rounded"><ArrowLeft weight="light" className="w-4 h-4" /></button>
                <h3 className="font-bold text-sm text-slate-800">LGU Announcements</h3>
              </div>
              <span className="text-[9px] bg-color3 text-slate-700 border border-color1 font-bold px-2 py-0.5 rounded">Live Feed</span>
            </div>

            {/* News Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {['All', 'Advisory', 'Events', 'Health'].map(f => (
                <button key={f} onClick={() => alert(`Filter news by ${f}`)}
                  className="px-3 py-1 rounded-full text-[10px] font-bold transition bg-color2 border border-color4 text-slate-500 hover:bg-color3">
                  {f}
                </button>
              ))}
            </div>

            {/* News Cards */}
            <div className="space-y-3 overflow-y-auto pr-1">
              {[
                { title: 'Water service interruption in Brgy. Rizal', category: 'Advisory', date: 'Today · 10:00 AM', text: 'Pipeline repair works will cause temporary water service interruption from 1:00 PM to 5:00 PM today. Affected residents are advised to store enough water.', color: 'border-color4 bg-color3/20' },
                { title: 'BPLO permit renewal extended until end of month', category: 'Advisory', date: 'Yesterday', text: 'Mayor Ricardo Diaz has signed the executive order extending the business permit renewal period to give more time to micro-enterprises. No penalties will be applied until June 1.', color: 'border-color4 bg-color3/20' },
                { title: 'Liliw Tsinelas Festival 2026 Parade Route', category: 'Events', date: '3 days ago', text: 'Join us for the annual Tsinelas Festival! Please expect heavy traffic along the national highway. Check the rerouting plan on the municipal website.', color: 'border-color4 bg-color3/20' }
              ].map((n, idx) => (
                <div key={idx} className={`border rounded-xl p-3.5 space-y-1.5 shadow-sm ${n.color}`}>
                  <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="uppercase text-slate-400">{n.category}</span>
                    <span className="text-slate-400">{n.date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 leading-snug">{n.title}</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: SUBMISSION DETAILS & SATISFACTION FEEDBACK (CSAT) */}
        {selectedItemHistory && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-color2 rounded-2xl shadow-xl max-w-sm w-full p-5 text-xs text-slate-800 space-y-4 max-h-[90%] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-color4 pb-3">
                <h4 className="font-bold text-sm text-slate-800">Submission Tracker</h4>
                <button onClick={() => setSelectedItemHistory(null)} className="text-slate-400"><X weight="light" className="w-5 h-5" /></button>
              </div>

              <div className="space-y-2 bg-color5 p-3 rounded-lg border border-color4">
                <div className="flex justify-between border-b border-color4 pb-1.5">
                  <span className="text-slate-500 font-medium">Ref Number:</span>
                  <span className="text-slate-800 font-bold">{selectedItemHistory.item.referenceNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                  <span className="text-slate-500 font-medium">LGU Jurisdiction:</span>
                  <span className="text-slate-800 font-semibold">{selectedLgu?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                  <span className="text-slate-500 font-medium">Status Code:</span>
                  <span className="text-slate-800 font-bold">{selectedItemHistory.item.status}</span>
                </div>
                {selectedItemHistory.item.assignedOffice && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Assigned Office:</span>
                    <span className="text-slate-800 font-bold">{selectedItemHistory.item.assignedOffice}</span>
                  </div>
                )}
              </div>

              {/* Status History Steps */}
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Status History Log</p>
                <div className="space-y-3 pl-3 border-l-2 border-slate-200">
                  {(selectedItemHistory.item.statusHistory || [
                    { status: 'Submitted', timestamp: selectedItemHistory.item.createdAt, notes: 'Document application submitted' }
                  ]).map((hist: any, hIdx: number) => (
                    <div key={hIdx} className="relative">
                      <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-white"></div>
                      <h5 className="font-bold text-slate-800 text-[10px]">{hist.status}</h5>
                      <p className="text-slate-500 text-[9px]">{hist.notes || 'Status transition logged'}</p>
                      <span className="text-[8px] text-slate-400 font-semibold">{new Date(hist.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code & PDF Download for Service Requests */}
              {!selectedItemHistory.isReport && selectedItemHistory.item.qrCodeUrl && (
                <div className="bg-color3 border border-color1 p-4 rounded-lg space-y-3">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-center">Present at Municipal Hall Counter</p>
                  
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <img 
                      src={selectedItemHistory.item.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-24 h-24 border-2 border-slate-200 rounded-lg"
                    />
                  </div>
                  
                  <p className="text-[9px] text-slate-500 text-center">
                    Ref: <span className="font-mono font-bold text-slate-700">{selectedItemHistory.item.referenceNumber}</span>
                  </p>
                  
                  {/* Download PDF Button */}
                  <a 
                    href={`${API_BASE}/services/${selectedItemHistory.item.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-color1 hover:bg-color4 text-slate-800 font-semibold py-2.5 rounded-lg text-xs transition"
                  >
                    <FileText weight="fill" className="w-4 h-4" />
                    Download Application Form (PDF)
                  </a>
                  
                  <p className="text-[8px] text-slate-400 text-center">
                    Download and print this form. Present at {selectedItemHistory.item.officeName || 'Municipal Hall'} with payment.
                  </p>
                </div>
              )}

              {/* Document released attachment copy */}
              {selectedItemHistory.item.status === 'Released' && selectedItemHistory.item.attachmentUrl && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg text-center font-bold">
                  <a href={selectedItemHistory.item.attachmentUrl} target="_blank" rel="noreferrer" className="underline block">
                    ✓ Download Released Document (PDF)
                  </a>
                </div>
              )}

              {/* Rating Feedbacks: CSAT */}
              {selectedItemHistory.item.status === 'Resolved' && (
                <div className="border-t border-slate-100 pt-3.5 space-y-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                  <h5 className="font-bold text-indigo-950 text-[10px] uppercase font-outfit tracking-wider">Resolution Feedback Survey</h5>
                  
                  {selectedItemHistory.item.rating ? (
                    <div className="text-center space-y-1">
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(st => (
                          <Star weight="light" key={st} className={`w-4 h-4 ${st <= selectedItemHistory.item.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      <p className="text-slate-600 italic">"{selectedItemHistory.item.feedback}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1 text-[9px]">Rate LGU Service Resolution Speed</label>
                        <div className="flex gap-1.5 justify-center py-1">
                          {[1, 2, 3, 4, 5].map(st => (
                            <button 
                              key={st} 
                              type="button" 
                              onClick={() => setRatingVal(st)}
                              className="text-slate-300 hover:text-amber-500"
                            >
                              <Star weight="light" className={`w-5 h-5 ${st <= ratingVal ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                       <div>
                         <label className="block text-slate-500 font-semibold mb-1 text-[9px]">Tell us how we did (Optional)</label>
                         <textarea 
                           value={ratingFeedback}
                           onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRatingFeedback(e.target.value)}
                           className="w-full border border-slate-200 rounded-lg p-2"
                           rows={2}
                           placeholder="Write comments..."
                         />
                       </div>
                      <button 
                        onClick={() => handleRateResolution(selectedItemHistory.item.id, selectedItemHistory.isReport)}
                        className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-xs"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )}
  </div>

      {/* Navigation footer buttons */}
      {selectedLgu && screen !== 'login' && screen !== 'lgu-select' && (
        <div className="absolute bottom-5 left-0 right-0 h-12 bg-color2 border-t border-color4 flex justify-around items-center z-40 text-slate-400">
          <button 
            onClick={() => setScreen('home')}
            className={`flex flex-col items-center gap-0.5 transition ${screen === 'home' ? 'text-slate-800 font-bold' : 'hover:text-slate-600 font-semibold'}`}
          >
            <div className={`p-1.5 rounded-full transition ${screen === 'home' ? 'bg-color1 text-slate-800' : ''}`}>
              <HomeIcon weight="light" className="w-4 h-4" />
            </div>
            <span className="text-[8px]">Home</span>
          </button>
          <button 
            onClick={() => setScreen('services')}
            className={`flex flex-col items-center gap-0.5 transition ${screen === 'services' || screen === 'apply-service' ? 'text-slate-800 font-bold' : 'hover:text-slate-600 font-semibold'}`}
          >
            <div className={`p-1.5 rounded-full transition ${screen === 'services' || screen === 'apply-service' ? 'bg-color1 text-slate-800' : ''}`}>
              <FileText weight="light" className="w-4 h-4" />
            </div>
            <span className="text-[8px]">Services</span>
          </button>
          <button 
            onClick={() => setScreen('submit-report')}
            className={`flex flex-col items-center gap-0.5 transition ${screen === 'submit-report' ? 'text-slate-800 font-bold' : 'hover:text-slate-600 font-semibold'}`}
          >
            <div className={`p-1.5 rounded-full transition ${screen === 'submit-report' ? 'bg-color1 text-slate-800' : ''}`}>
              <Camera weight="light" className="w-4 h-4" />
            </div>
            <span className="text-[8px]">Report</span>
          </button>
          <button 
            onClick={() => setScreen('forum')}
            className={`flex flex-col items-center gap-0.5 transition ${screen === 'forum' ? 'text-slate-800 font-bold' : 'hover:text-slate-600 font-semibold'}`}
          >
            <div className={`p-1.5 rounded-full transition ${screen === 'forum' ? 'bg-color1 text-slate-800' : ''}`}>
              <MessageSquare weight="light" className="w-4 h-4" />
            </div>
            <span className="text-[8px]">Forum</span>
          </button>
          <button 
            onClick={() => setScreen('settings')}
            className={`flex flex-col items-center gap-0.5 transition ${screen === 'settings' ? 'text-slate-800 font-bold' : 'hover:text-slate-600 font-semibold'}`}
          >
            <div className={`p-1.5 rounded-full transition ${screen === 'settings' ? 'bg-color1 text-slate-800' : ''}`}>
              <UserIcon weight="light" className="w-4 h-4" />
            </div>
            <span className="text-[8px]">Profile</span>
          </button>
        </div>
      )}

      {/* Simulated Home Button Indicator */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-800 rounded-full z-50"></div>

    </div>
  );
}
