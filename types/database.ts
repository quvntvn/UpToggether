// Hand-written database types matching supabase/migrations/*.sql.
// Once the schema stabilises, regenerate with:
//   supabase gen types typescript --project-id <ref> --schema public > types/database.ts

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type GroupRole = 'owner' | 'member';
export type WakeReactionKind = 'fire' | 'clap' | 'eye_roll' | 'heart';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string;
          avatar_url: string | null;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_completed?: boolean;
        };
        Update: {
          username?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          timezone?: string;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
        };
        Update: {
          status?: FriendshipStatus;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          alarm_time: string; // 'HH:MM:SS'
          repeat_days: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          alarm_time?: string;
          repeat_days?: number[];
        };
        Update: {
          name?: string;
          alarm_time?: string;
          repeat_days?: number[];
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupRole;
        };
        Update: {
          role?: GroupRole;
        };
        Relationships: [];
      };
      wake_events: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          local_schedule_id: string | null;
          scheduled_for: string;
          woke_up_at: string;
          reaction_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          local_schedule_id?: string | null;
          scheduled_for: string;
          woke_up_at?: string;
          reaction_seconds: number;
        };
        Update: never;
        Relationships: [];
      };
      wake_reactions: {
        Row: {
          id: string;
          wake_event_id: string;
          from_user_id: string;
          kind: WakeReactionKind;
          created_at: string;
        };
        Insert: {
          id?: string;
          wake_event_id: string;
          from_user_id: string;
          kind: WakeReactionKind;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      friendship_status: FriendshipStatus;
      group_role: GroupRole;
      wake_reaction_kind: WakeReactionKind;
    };
    CompositeTypes: Record<never, never>;
  };
};

// Convenience aliases for service layer code.
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type FriendshipRow = Database['public']['Tables']['friendships']['Row'];
export type GroupRow = Database['public']['Tables']['groups']['Row'];
export type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];
export type WakeEventRow = Database['public']['Tables']['wake_events']['Row'];
export type WakeReactionRow = Database['public']['Tables']['wake_reactions']['Row'];
