-- OrbitOS: authentication foundation.
--
-- public.profiles mirrors auth.users one-to-one and carries the application role.
-- Everything is deny-by-default:
--   * RLS is enabled and the anon role has no privileges at all.
--   * Signed-in users read their own row and may edit only their display name.
--   * super_admin / admin can read every profile.
--   * Roles are never taken from user-controlled metadata and cannot be changed
--     through the API; they are assigned by the seed script or by SQL.
-- Helper functions live in the `private` schema, which PostgREST does not expose.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;

create type public.app_role as enum ('super_admin', 'admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text check (char_length(full_name) <= 120),
  role public.app_role not null default 'member',
  -- Set for accounts created with a temporary password; cleared automatically
  -- by on_auth_user_updated the moment the password actually changes.
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user. Role and password flags are not writable through the API.';

alter table public.profiles enable row level security;

-- Supabase grants every new public table to anon and authenticated; narrow that.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- SECURITY DEFINER so the profiles policy can look up the caller's role
-- without recursing into itself.
create function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

revoke all on function private.current_app_role() from public, anon;
grant execute on function private.current_app_role() to authenticated;

-- One permissive policy per action (several permissive policies are each
-- evaluated per row). The sub-selects let Postgres evaluate them once per query.
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.current_app_role()) in ('super_admin', 'admin')
  );

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Keep updated_at honest.
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public, anon, authenticated;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- Every new auth user gets a member profile. The role is deliberately not read
-- from raw_user_meta_data, which the user controls at sign-up.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Keep the profile email in sync and clear the temporary-password flag only
-- when the stored password hash really changes.
create function private.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set email = coalesce(new.email, email),
         must_change_password = case
           when new.encrypted_password is distinct from old.encrypted_password then false
           else must_change_password
         end
   where id = new.id;
  return new;
end;
$$;

revoke all on function private.handle_user_updated() from public, anon, authenticated;
grant execute on function private.handle_user_updated() to supabase_auth_admin;

create trigger on_auth_user_updated
  after update of email, encrypted_password on auth.users
  for each row
  when (
    old.email is distinct from new.email
    or old.encrypted_password is distinct from new.encrypted_password
  )
  execute function private.handle_user_updated();
