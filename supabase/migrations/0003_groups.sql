-- Groups are wake-up squads: a name, an alarm time, the days it repeats,
-- and a membership table. Visibility is restricted to members only.

create type public.group_role as enum ('owner', 'member');

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  alarm_time time not null default '07:00:00',
  -- ISO weekday numbers: 0 = Sunday ... 6 = Saturday (matches JS Date#getDay()).
  repeat_days smallint[] not null default array[1,2,3,4,5]::smallint[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_repeat_days_valid check (
    repeat_days <@ array[0,1,2,3,4,5,6]::smallint[]
  )
);

create index groups_owner_idx on public.groups (owner_id);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

-- Helper used by RLS policies to avoid recursive evaluation when checking membership.
create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = target_user_id
  );
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Members can read their groups.
create policy "members can read their groups"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id, auth.uid()));

-- Anyone authenticated can create a group, but only as themselves (owner).
create policy "users can create groups they own"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- Only the owner can update the group settings.
create policy "owner can update their group"
  on public.groups for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Only the owner can delete the group.
create policy "owner can delete their group"
  on public.groups for delete
  to authenticated
  using (auth.uid() = owner_id);

-- group_members policies.
create policy "members can read their membership rows"
  on public.group_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id, auth.uid())
  );

-- The group owner can add/remove members; users can also remove themselves.
create policy "owner can add members"
  on public.group_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
        and g.owner_id = auth.uid()
    )
  );

create policy "owner can remove members or user can leave"
  on public.group_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
        and g.owner_id = auth.uid()
    )
  );

-- When a group is created, the owner is auto-added as a member with role 'owner'.
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

create trigger groups_add_owner_membership
  after insert on public.groups
  for each row execute function public.handle_new_group();
