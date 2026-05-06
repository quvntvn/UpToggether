import { supabase } from '@/lib/supabase';
import type { GroupMemberRow, GroupRow, ProfileRow } from '@/types/database';

export type GroupMemberWithProfile = GroupMemberRow & {
  profile: ProfileRow;
};

export type GroupWithMembers = GroupRow & {
  members: GroupMemberWithProfile[];
};

type CreateGroupInput = {
  ownerId: string;
  name: string;
  alarmTime?: string;
  repeatDays?: number[];
};

export async function createGroup({ ownerId, name, alarmTime, repeatDays }: CreateGroupInput): Promise<GroupRow> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      owner_id: ownerId,
      name,
      alarm_time: alarmTime ?? '07:00:00',
      repeat_days: repeatDays ?? [1, 2, 3, 4, 5],
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateGroup(
  groupId: string,
  patch: Partial<Pick<GroupRow, 'name' | 'alarm_time' | 'repeat_days'>>,
): Promise<GroupRow> {
  const { data, error } = await supabase
    .from('groups')
    .update(patch)
    .eq('id', groupId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) {
    throw error;
  }
}

export async function listMyGroups(): Promise<GroupWithMembers[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(
      `
        *,
        members:group_members(*, profile:profiles(*))
      `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []) as unknown as GroupWithMembers[];
}

export async function addMemberToGroup(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'member' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function removeMemberFromGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

export async function leaveGroup(groupId: string, currentUserId: string) {
  return removeMemberFromGroup(groupId, currentUserId);
}
