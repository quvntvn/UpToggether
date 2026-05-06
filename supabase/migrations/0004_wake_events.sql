-- Wake events are emitted when a user successfully completes a wake-up flow
-- (presses STOP on the alarm). Friends and group members can react to them.

create table public.wake_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  -- Local schedule id from the device, useful for de-duplication.
  local_schedule_id text,
  scheduled_for timestamptz not null,
  woke_up_at timestamptz not null default now(),
  reaction_seconds integer not null check (reaction_seconds >= 0),
  created_at timestamptz not null default now()
);

create index wake_events_user_idx on public.wake_events (user_id, woke_up_at desc);
create index wake_events_group_idx on public.wake_events (group_id, woke_up_at desc) where group_id is not null;

alter table public.wake_events enable row level security;

-- A user can read their own events, plus events of any friend and any group member.
create policy "users can read their own wake events"
  on public.wake_events for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can read wake events of accepted friends"
  on public.wake_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = wake_events.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = wake_events.user_id)
        )
    )
  );

create policy "users can read wake events from their groups"
  on public.wake_events for select
  to authenticated
  using (
    group_id is not null
    and public.is_group_member(group_id, auth.uid())
  );

-- Users can only insert wake events as themselves.
create policy "users can insert their own wake events"
  on public.wake_events for insert
  to authenticated
  with check (user_id = auth.uid());

-- Wake events are immutable history; no update/delete policy.

create type public.wake_reaction_kind as enum ('fire', 'clap', 'eye_roll', 'heart');

create table public.wake_reactions (
  id uuid primary key default gen_random_uuid(),
  wake_event_id uuid not null references public.wake_events(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.wake_reaction_kind not null,
  created_at timestamptz not null default now(),
  unique (wake_event_id, from_user_id, kind)
);

create index wake_reactions_event_idx on public.wake_reactions (wake_event_id);

alter table public.wake_reactions enable row level security;

-- A user can read reactions on any wake_event they themselves are allowed to read.
-- Supabase RLS does not auto-cascade, so we duplicate the visibility rule.
create policy "users can read reactions on visible wake events"
  on public.wake_reactions for select
  to authenticated
  using (
    exists (
      select 1
      from public.wake_events e
      where e.id = wake_reactions.wake_event_id
        and (
          e.user_id = auth.uid()
          or exists (
            select 1
            from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.addressee_id = e.user_id)
                or (f.addressee_id = auth.uid() and f.requester_id = e.user_id)
              )
          )
          or (e.group_id is not null and public.is_group_member(e.group_id, auth.uid()))
        )
    )
  );

-- Users can react to any wake event they can see.
create policy "users can react to visible wake events"
  on public.wake_reactions for insert
  to authenticated
  with check (
    from_user_id = auth.uid()
    and exists (
      select 1
      from public.wake_events e
      where e.id = wake_reactions.wake_event_id
        and (
          e.user_id = auth.uid()
          or exists (
            select 1
            from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.addressee_id = e.user_id)
                or (f.addressee_id = auth.uid() and f.requester_id = e.user_id)
              )
          )
          or (e.group_id is not null and public.is_group_member(e.group_id, auth.uid()))
        )
    )
  );

-- Users can remove their own reaction.
create policy "users can delete their own reaction"
  on public.wake_reactions for delete
  to authenticated
  using (from_user_id = auth.uid());
