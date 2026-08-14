'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { detectGuestLguFromGps } from '../lib/locationDetection';

export interface LguItem {
  id: string;
  name: string;
  province?: string;
  primary_color?: string;
  secondary_color?: string;
  icon_color?: string;
  dark_bg_color?: string;
  logo?: string;
  logo_url?: string;
  seal_url?: string;
  banner_url?: string;
  emergency_contacts?: any;
  boundary_geojson?: any;
  latitude?: number;
  longitude?: number;
}

export function getLguLogo(lgu?: LguItem | any): string {
  if (!lgu) return '/brand/liliw-seal.jpg';
  if (lgu.logo && typeof lgu.logo === 'string' && lgu.logo.trim().startsWith('http')) {
    return lgu.logo.trim();
  }
  if (lgu.seal_url && typeof lgu.seal_url === 'string' && lgu.seal_url.trim().startsWith('http')) {
    return lgu.seal_url.trim();
  }
  if (lgu.logo_url && typeof lgu.logo_url === 'string' && lgu.logo_url.trim().startsWith('http')) {
    return lgu.logo_url.trim();
  }
  if (lgu.id === 'liliw-laguna' || (lgu.name && lgu.name.toLowerCase().includes('liliw'))) {
    return '/brand/liliw-seal.jpg';
  }
  return '/brand/liliw-seal.jpg';
}

interface LguContextType {
  activeLgu: LguItem | null;
  setActiveLgu: (lgu: LguItem) => void;
  lgus: LguItem[];
  loading: boolean;
}

const LguContext = createContext<LguContextType>({
  activeLgu: null,
  setActiveLgu: () => {},
  lgus: [],
  loading: true,
});

export const DEFAULT_LGU: LguItem = {
  id: 'liliw-laguna',
  name: 'Municipality of Liliw',
  province: 'Laguna',
  primary_color: '#1E3A8A',
  secondary_color: '#F2E863',
  seal_url: '/brand/logo.png',
};

export function LguProvider({ children }: { children: React.ReactNode }) {
  const [lgus, setLgus] = useState<LguItem[]>([]);
  const [activeLgu, setActiveLguState] = useState<LguItem | null>(DEFAULT_LGU);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLgus() {
      try {
        const { data, error } = await supabase
          .from('lgus')
          .select('*')
          .order('name');
        if (data && data.length > 0) {
          setLgus(data);
          const savedId = typeof window !== 'undefined' ? localStorage.getItem('agapp_citizen_lgu') : null;
          if (savedId) {
            const found = data.find((l: LguItem) => l.id === savedId) || data[0];
            setActiveLguState(found);
          } else {
            // Auto-detect via GPS if permission available
            if (typeof window !== 'undefined' && 'geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const detected = await detectGuestLguFromGps(pos.coords.latitude, pos.coords.longitude);
                  if (detected) {
                    const match = data.find((l: LguItem) => l.id === detected.id) || detected;
                    setActiveLguState(match);
                  } else {
                    setActiveLguState(data[0]);
                  }
                },
                () => {
                  setActiveLguState(data[0]);
                },
                { timeout: 5000 }
              );
            } else {
              setActiveLguState(data[0]);
            }
          }
        } else {
          setLgus([DEFAULT_LGU]);
          setActiveLguState(DEFAULT_LGU);
        }
      } catch (err) {
        console.error('Error fetching LGUs', err);
        setLgus([DEFAULT_LGU]);
        setActiveLguState(DEFAULT_LGU);
      } finally {
        setLoading(false);
      }
    }
    loadLgus();
  }, []);

  const setActiveLgu = (lgu: LguItem) => {
    setActiveLguState(lgu);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agapp_citizen_lgu', lgu.id);
    }
  };

  return (
    <LguContext.Provider value={{ activeLgu, setActiveLgu, lgus, loading }}>
      {children}
    </LguContext.Provider>
  );
}

export const useLgu = () => useContext(LguContext);
