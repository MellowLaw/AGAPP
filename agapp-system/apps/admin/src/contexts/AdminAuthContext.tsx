'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminModule } from '@/lib/modules';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'LGU_ADMIN' | 'LGU_PERSONNEL' | string;
  lgu_id: string | null;
  assigned_office: string | null;
  module_permissions: AdminModule[];
}

export type EffectiveAdminRole = 'super-admin' | 'lgu-admin' | 'lgu-personnel';

interface AdminAuthContextType {
  profile: AdminProfile | null;
  effectiveRole: EffectiveAdminRole;
  assignedOffice: string | null;
  modules: AdminModule[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const CACHE_KEY = 'agapp_admin_session_profile_v1';

function getCachedProfile(): AdminProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
        return parsed;
      }
    }
  } catch {
    // Ignore cache read failures
  }
  return null;
}

function saveCachedProfile(p: AdminProfile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (p) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(p));
    } else {
      sessionStorage.removeItem(CACHE_KEY);
    }
  } catch {
    // Ignore cache write failures
  }
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  profile: null,
  effectiveRole: 'lgu-admin',
  assignedOffice: null,
  modules: [],
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<AdminProfile | null>(() => getCachedProfile());
  const [loading, setLoading] = useState<boolean>(() => !getCachedProfile());

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        saveCachedProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, lgu_id, assigned_office, module_permissions')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Failed to fetch user profile in AdminAuthContext:', error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const loaded: AdminProfile = {
          id: data.id,
          name: data.name || user.user_metadata?.name || 'Admin User',
          email: data.email || user.email || '',
          role: data.role || 'LGU_ADMIN',
          lgu_id: data.lgu_id || null,
          assigned_office: data.assigned_office || null,
          module_permissions: Array.isArray(data.module_permissions) ? data.module_permissions : [],
        };
        setProfile(loaded);
        saveCachedProfile(loaded);
      } else {
        setProfile(null);
        saveCachedProfile(null);
      }
    } catch (err) {
      console.warn('Unexpected error in AdminAuthContext fetchProfile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        saveCachedProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        fetchProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      saveCachedProfile(null);
      setProfile(null);
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error signing out in AdminAuthContext:', err);
    }
  }, []);

  const effectiveRole: EffectiveAdminRole =
    profile?.role === 'SUPER_ADMIN'
      ? 'super-admin'
      : profile?.role === 'LGU_PERSONNEL'
      ? 'lgu-personnel'
      : 'lgu-admin';

  return (
    <AdminAuthContext.Provider
      value={{
        profile,
        effectiveRole,
        assignedOffice: profile?.assigned_office ?? null,
        modules: profile?.module_permissions ?? [],
        loading,
        refreshProfile: fetchProfile,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
