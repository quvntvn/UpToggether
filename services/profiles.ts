import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<ProfileRow, 'username' | 'display_name' | 'avatar_url' | 'timezone' | 'onboarding_completed'>>,
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function searchProfilesByUsername(query: string, limit = 10): Promise<ProfileRow[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', `${trimmed}%`)
    .limit(limit);

  if (error) {
    throw error;
  }
  return data ?? [];
}
