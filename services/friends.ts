import { supabase } from '@/lib/supabase';
import type { FriendshipRow, ProfileRow } from '@/types/database';

export type FriendshipWithProfile = FriendshipRow & {
  requester: ProfileRow;
  addressee: ProfileRow;
};

export async function sendFriendRequest(currentUserId: string, addresseeId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      requester_id: currentUserId,
      addressee_id: addresseeId,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function acceptFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function declineFriendRequest(friendshipId: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) {
    throw error;
  }
}

export async function removeFriendship(friendshipId: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) {
    throw error;
  }
}

export async function listFriendships(currentUserId: string): Promise<FriendshipWithProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `
        *,
        requester:profiles!friendships_requester_id_fkey(*),
        addressee:profiles!friendships_addressee_id_fkey(*)
      `,
    )
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

  if (error) {
    throw error;
  }
  return (data ?? []) as unknown as FriendshipWithProfile[];
}

export function getFriendProfile(friendship: FriendshipWithProfile, currentUserId: string): ProfileRow {
  return friendship.requester_id === currentUserId ? friendship.addressee : friendship.requester;
}
