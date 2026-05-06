# Supabase backend

This folder holds the SQL schema for the UpTogether Supabase project.
The migrations are intentionally hand-written and meant to be applied
in numerical order.

## Layout

```
supabase/
  migrations/
    0001_profiles.sql
    0002_friendships.sql
    0003_groups.sql
    0004_wake_events.sql
```

Each file is independent: drop it into the **SQL Editor** of your
Supabase project and run it. Apply them in order — later files reference
helpers (e.g. `public.set_updated_at`, `public.is_group_member`)
defined earlier.

## Apply manually (no CLI)

1. Open https://supabase.com/dashboard/project/<project-ref>/sql/new
2. Paste `0001_profiles.sql` → Run.
3. Repeat for `0002_friendships.sql`, `0003_groups.sql`, `0004_wake_events.sql`.

## Apply with the Supabase CLI (optional)

```sh
# One-time
supabase login
supabase link --project-ref <project-ref>

# Push every migration in supabase/migrations/
supabase db push
```

## Environment variables

The mobile client reads two `EXPO_PUBLIC_*` variables from `.env.local`
at the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public JWT, starts with eyJ...>
```

The `anon` key is safe to ship in the client — Row Level Security
restricts what it can see. **Never** put the `service_role` key in any
file that ends up in the bundle.

## Schema overview

| Table             | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `profiles`        | Public-facing identity, auto-created on auth.users insert. |
| `friendships`     | Single-row-per-pair friendship with status.             |
| `groups`          | Wake-up squads with shared alarm time/days.             |
| `group_members`   | Membership join table; owner is auto-added on insert.   |
| `wake_events`     | Append-only history of completed wake-ups.              |
| `wake_reactions`  | Friends/group members react to a wake event.            |

All tables have RLS enabled. Visibility rules are documented inline in
each migration.

## Regenerating TypeScript types

`types/database.ts` is currently hand-written to match the schema. Once
the schema stabilises, replace it with the generator output:

```sh
supabase gen types typescript --project-id <project-ref> --schema public > types/database.ts
```
