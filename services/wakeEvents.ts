import { supabase } from '@/lib/supabase';
import type {
  ProfileRow,
  WakeEventRow,
  WakeReactionKind,
  WakeReactionRow,
} from '@/types/database';

export type WakeEventWithProfile = WakeEventRow & {
  profile: ProfileRow;
  reactions?: WakeReactionRow[];
};

type EmitWakeEventInput = {
  userId: string;
  groupId?: string | null;
  localScheduleId?: string | null;
  scheduledFor: Date;
  wokeUpAt?: Date;
  reactionSeconds: number;
};

export async function emitWakeEvent({
  userId,
  groupId,
  localScheduleId,
  scheduledFor,
  wokeUpAt,
  reactionSeconds,
}: EmitWakeEventInput): Promise<WakeEventRow> {
  const { data, error } = await supabase
    .from('wake_events')
    .insert({
      user_id: userId,
      group_id: groupId ?? null,
      local_schedule_id: localScheduleId ?? null,
      scheduled_for: scheduledFor.toISOString(),
      woke_up_at: (wokeUpAt ?? new Date()).toISOString(),
      reaction_seconds: reactionSeconds,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

type ListWakeEventsOptions = {
  userId?: string;
  groupId?: string;
  since?: Date;
  limit?: number;
};

export async function listWakeEvents({ userId, groupId, since, limit = 50 }: ListWakeEventsOptions = {}): Promise<
  WakeEventWithProfile[]
> {
  let query = supabase
    .from('wake_events')
    .select(
      `
        *,
        profile:profiles(*),
        reactions:wake_reactions(*)
      `,
    )
    .order('woke_up_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  if (since) {
    query = query.gte('woke_up_at', since.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return (data ?? []) as unknown as WakeEventWithProfile[];
}

export async function reactToWakeEvent(
  wakeEventId: string,
  fromUserId: string,
  kind: WakeReactionKind,
): Promise<WakeReactionRow> {
  const { data, error } = await supabase
    .from('wake_reactions')
    .insert({
      wake_event_id: wakeEventId,
      from_user_id: fromUserId,
      kind,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function removeReaction(reactionId: string) {
  const { error } = await supabase.from('wake_reactions').delete().eq('id', reactionId);
  if (error) {
    throw error;
  }
}

/**
 * Subscribe to realtime inserts of wake_events visible to the current user.
 * RLS still applies to the underlying replication, so the callback only
 * receives events the caller is allowed to read.
 */
export function subscribeToWakeEvents(callback: (event: WakeEventRow) => void) {
  const channel = supabase
    .channel('wake-events')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'wake_events' },
      (payload) => {
        callback(payload.new as WakeEventRow);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
