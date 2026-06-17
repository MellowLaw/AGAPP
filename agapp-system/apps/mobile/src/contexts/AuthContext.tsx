import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/push';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  selectedLgu: any | null;
  setSelectedLgu: (lgu: any) => void;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [selectedLgu, setSelectedLguState] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Promise wrapper that rejects if the promise does not resolve within timeoutMs
  const withTimeout = <T,>(promise: PromiseLike<T>, timeoutMs = 2500): Promise<T> => {
    return Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      )
    ]);
  };

  const setSelectedLgu = async (lgu: any) => {
    setSelectedLguState(lgu);
    if (lgu) {
      await AsyncStorage.setItem('selectedLguId', lgu.id);
    } else {
      await AsyncStorage.removeItem('selectedLguId');
    }
  };

  const loadLguFromStorage = async () => {
    try {
      const savedLguId = await AsyncStorage.getItem('selectedLguId');
      if (savedLguId) {
        console.log('[AuthContext] Loading LGU details for saved LGU ID:', savedLguId);
        const { data } = await withTimeout(
          supabase.from('lgus').select('*').eq('id', savedLguId).single()
        );
        if (data) {
          console.log('[AuthContext] Loaded selected LGU:', data.name);
          setSelectedLguState(data);
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to load LGU details from storage/DB:', err);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, lgu_id')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setProfile(data);
        if (data.lgu_id && !selectedLgu) {
           const { data: lguData } = await supabase.from('lgus').select('*').eq('id', data.lgu_id).single();
           if (lguData) {
               setSelectedLguState(lguData);
               await AsyncStorage.setItem('selectedLguId', lguData.id);
           }
        }
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] initializeAuth: fetching session...');
        const { data: { session: initialSession } } = await withTimeout(supabase.auth.getSession(), 3000);
        console.log('[AuthContext] initializeAuth: session fetched =', !!initialSession);
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        await loadLguFromStorage();
        
        if (initialSession?.user) {
          console.log('[AuthContext] initializeAuth: fetching profile for user:', initialSession.user.id);
          const { data } = await withTimeout(
            supabase.from('users').select('*').eq('id', initialSession.user.id).single()
          );
          if (data) {
            console.log('[AuthContext] initializeAuth: profile loaded for:', data.name);
            setProfile(data);
            // register for push token in background (non-blocking)
            registerForPushNotificationsAsync().then((token) => {
              if (token && data.expo_push_token !== token) {
                supabase.from('users').update({ expo_push_token: token }).eq('id', initialSession.user.id)
                  .then(({ error }) => {
                    if (error) console.warn('Failed to update push token in DB:', error.message);
                  });
              }
            }).catch((err: any) => console.warn('Push registration failed:', err));
          }
        }
      } catch (err) {
        console.error('[AuthContext] Auth initialization timed out or errored:', err);
      } finally {
        console.log('[AuthContext] initializeAuth complete: setting isLoading = false');
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[AuthContext] onAuthStateChange event =', event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
         try {
           console.log('[AuthContext] onAuthStateChange: fetching profile...');
           const { data } = await withTimeout(
             supabase.from('users').select('*').eq('id', currentSession.user.id).single()
           );
           if (data) {
             console.log('[AuthContext] onAuthStateChange: profile loaded for:', data.name);
             setProfile(data);
             // register for push token in background (non-blocking)
             registerForPushNotificationsAsync().then((token) => {
               if (token && data.expo_push_token !== token) {
                 supabase.from('users').update({ expo_push_token: token }).eq('id', currentSession.user.id)
                   .then(({ error }) => {
                     if (error) console.warn('Failed to update push token in DB:', error.message);
                   });
               }
             }).catch((err: any) => console.warn('Push registration failed:', err));
           }
         } catch (err) {
           console.warn('[AuthContext] onAuthStateChange profile fetch timed out or failed:', err);
         }
      } else {
         setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setSelectedLguState(null);
    await AsyncStorage.removeItem('selectedLguId');
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, selectedLgu, setSelectedLgu, isLoading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
