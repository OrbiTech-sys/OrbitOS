-- OrbitOS: user management.
--
-- * Account deactivation (profiles.deactivated_at). Deactivated users lose every
--   elevated permission at once, even while an issued access token is still valid.
-- * An append-only audit log of admin actions, readable by super admins only.
-- * A guard that always keeps at least one active super admin.
-- Users are created, changed and removed by Server Actions using the secret key,
-- after the action has verified the caller; nothing here is writable by users.

alter table public.profiles add column deactivated_at timestamptz;

-- Same signature, so existing grants and policies keep using it.
create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = (select auth.uid()) and deactivated_at is null;
$$;

-- Never lose the last active super admin, whatever path the change comes from
-- (Server Action, SQL editor, or deleting the auth user, which cascades here).
create function private.keep_one_super_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'super_admin' or old.deactivated_at is not null then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' then
    if new.role = 'super_admin' and new.deactivated_at is null then
      return new;
    end if;
  end if;
  if not exists (
    select 1 from public.profiles
    where role = 'super_admin' and deactivated_at is null and id <> old.id
  ) then
    raise exception 'OrbitOS needs at least one active super admin' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function private.keep_one_super_admin() from public, anon, authenticated;
grant execute on function private.keep_one_super_admin() to supabase_auth_admin;

create trigger profiles_keep_one_super_admin
  before update of role, deactivated_at or delete on public.profiles
  for each row execute function private.keep_one_super_admin();

-- Who did what to whom. No foreign keys, so entries outlive deleted accounts.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  actor_email text not null,
  action text not null,
  target_id uuid,
  target_email text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
revoke all on table public.audit_log from anon, authenticated;
grant select on table public.audit_log to authenticated;

create policy "audit_log_select_super_admin"
  on public.audit_log for select to authenticated
  using ((select private.current_app_role()) = 'super_admin');

-- Append-only, including for the secret key (triggers apply even when RLS is bypassed).
create function private.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only' using errcode = 'P0001';
end;
$$;

revoke all on function private.audit_log_append_only() from public, anon, authenticated;

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function private.audit_log_append_only();
