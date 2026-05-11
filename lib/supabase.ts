import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Add them to .env.local at the project root. Auth and social features will be disabled until then.',
  );
}

// During Expo Router web prerender (Node) there is no `window`, so the
// AsyncStorage web shim — which reaches for `window.localStorage` —
// crashes Metro. Fall back to an in-memory store in that exact case;
// real native runtimes and real browsers keep using AsyncStorage.
const isWebSSR = Platform.OS === 'web' && typeof window === 'undefined';

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
})();

const storage = isWebSSR ? memoryStorage : AsyncStorage;

// We always create the client so type-checks and imports work at boot time.
// When env vars are missing the client points at a placeholder origin and
// every network call will fail loudly; callers gate access via isSupabaseConfigured.
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage,
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: false,
    },
  },
);

export type SupabaseClient = typeof supabase;
