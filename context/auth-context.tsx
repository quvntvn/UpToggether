import type { Session, User } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentSession, onAuthStateChange, signOut as authSignOut } from '@/services/auth';
import { getProfile } from '@/services/profiles';
import type { ProfileRow } from '@/types/database';

type AuthContextValue = {
  isReady: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setIsReady(true);
      return () => {
        isMounted = false;
      };
    }

    async function bootstrap() {
      try {
        const initialSession = await getCurrentSession();
        if (!isMounted) return;
        setSession(initialSession);

        if (initialSession?.user) {
          const initialProfile = await getProfile(initialSession.user.id);
          if (!isMounted) return;
          setProfile(initialProfile);
        }
      } catch (error) {
        console.warn('Failed to bootstrap auth session.', error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void bootstrap();

    const unsubscribe = onAuthStateChange(async (nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);

      if (nextSession?.user) {
        try {
          const nextProfile = await getProfile(nextSession.user.id);
          if (isMounted) {
            setProfile(nextProfile);
          }
        } catch (error) {
          console.warn('Failed to load profile after auth change.', error);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      user: session?.user ?? null,
      profile,
      async refreshProfile() {
        if (!session?.user) {
          setProfile(null);
          return;
        }
        const next = await getProfile(session.user.id);
        setProfile(next);
      },
      async signOut() {
        await authSignOut();
        setSession(null);
        setProfile(null);
      },
    }),
    [isReady, session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
