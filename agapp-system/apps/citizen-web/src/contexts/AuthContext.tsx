'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useLgu } from './LguContext';

export interface CitizenProfile {
  id: string;
  name: string;
  full_name: string;
  email: string;
  role: string;
  lgu_id?: string;
  barangay?: string;
  avatar_url?: string | null;
  phone?: string | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  moderation_status?: 'active' | 'restricted' | 'banned';
  rejection_reason?: string;
  is_restricted?: boolean;
  is_banned?: boolean;
}

interface AuthContextType {
  user: any | null;
  profile: CitizenProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeLgu } = useLgu();

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const loadedProfile: CitizenProfile = {
          ...data,
          full_name: data.name || data.email?.split('@')[0] || 'Citizen',
          moderation_status: data.moderation_status || (data.is_banned ? 'banned' : data.is_restricted ? 'restricted' : 'active'),
        };
        setProfile(loadedProfile);

        // Security Lockout Enforcer: If banned, force /banned page
        if (loadedProfile.moderation_status === 'banned' && pathname !== '/banned') {
          router.push('/banned');
        }
      }
    } catch (err) {
      console.error('Error loading citizen user profile', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time Postgres changes subscription on the users row
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`realtime-user-row-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        () => {
          loadProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/auth/login');
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
