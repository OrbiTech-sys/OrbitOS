-- OrbitOS: member workspaces.
--
-- Every user has a private workspace (CRM, sales, orders, inventory, finance,
-- projects, team, settings). Each record is one row of validated JSON owned by
-- the user, readable and writable only by them while their account is active.
-- Admins never see record contents: they see storage usage (workspace_usage),
-- kept current by a trigger that also enforces a per-member quota.

alter table public.profiles
  add column storage_quota_bytes bigint not null default 52428800 check (storage_quota_bytes > 0);

-- True while the caller's account exists and is not deactivated.
create function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and deactivated_at is null
  );
$$;

revoke all on function private.is_active_user() from public, anon;
grant execute on function private.is_active_user() to authenticated;

create table public.workspace_records (
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'team', 'contact', 'product', 'order', 'quotation', 'invoice',
    'expense', 'project', 'task', 'activity', 'meta'
  )),
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,64}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 32768),
  updated_at timestamptz not null default now(),
  primary key (owner_id, kind, id)
);

comment on table public.workspace_records is 'One row per workspace record. Shapes are validated by the app (lib/workspace/schemas.ts); size and kind here.';

alter table public.workspace_records enable row level security;
revoke all on table public.workspace_records from anon, authenticated;
grant select, insert, update, delete on table public.workspace_records to authenticated;

create policy "workspace_records_own_while_active"
  on public.workspace_records for all to authenticated
  using (owner_id = (select auth.uid()) and (select private.is_active_user()))
  with check (owner_id = (select auth.uid()) and (select private.is_active_user()));

-- Storage per member: what admins see, and what the quota is checked against.
create table public.workspace_usage (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  records integer not null default 0,
  bytes bigint not null default 0,
  last_write_at timestamptz
);

alter table public.workspace_usage enable row level security;
revoke all on table public.workspace_usage from anon, authenticated;
grant select on table public.workspace_usage to authenticated;

create policy "workspace_usage_own_or_admin"
  on public.workspace_usage for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (select private.current_app_role()) in ('super_admin', 'admin')
  );

-- AFTER row trigger: runs only for rows actually written (an upsert that turns
-- into an update is counted once), sees the running total within a statement,
-- and rolls the whole write back when it would exceed the quota.
create function private.track_workspace_usage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  delta_bytes bigint;
  delta_records integer;
  total_bytes bigint;
  total_records integer;
  quota bigint;
begin
  if tg_op = 'DELETE' then
    -- Plain update: during account deletion the usage row may already be gone.
    update public.workspace_usage
       set records = greatest(records - 1, 0),
           bytes = greatest(bytes - pg_column_size(old), 0),
           last_write_at = now()
     where owner_id = old.owner_id;
    return old;
  end if;

  owner := new.owner_id;
  if tg_op = 'INSERT' then
    delta_bytes := pg_column_size(new);
    delta_records := 1;
  else
    delta_bytes := pg_column_size(new) - pg_column_size(old);
    delta_records := 0;
  end if;

  insert into public.workspace_usage as u (owner_id, records, bytes, last_write_at)
  values (owner, delta_records, greatest(delta_bytes, 0), now())
  on conflict (owner_id) do update
    set records = u.records + delta_records,
        bytes = greatest(u.bytes + delta_bytes, 0),
        last_write_at = now()
  returning u.records, u.bytes into total_records, total_bytes;

  if delta_bytes > 0 or delta_records > 0 then
    select storage_quota_bytes into quota from public.profiles where id = owner;
    if total_bytes > coalesce(quota, 52428800) or total_records > 50000 then
      raise exception 'Workspace storage limit reached' using errcode = 'P0001', hint = 'quota';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.track_workspace_usage() from public, anon, authenticated;
grant execute on function private.track_workspace_usage() to supabase_auth_admin;

create trigger workspace_records_track_usage
  after insert or update or delete on public.workspace_records
  for each row execute function private.track_workspace_usage();

-- Applies one batch of changes atomically, as the caller (RLS applies).
-- Deletes run first so a batch can free space before it writes.
create function public.workspace_apply(p_upserts jsonb default '[]'::jsonb, p_deletes jsonb default '[]'::jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_upserts) <> 'array' or jsonb_typeof(p_deletes) <> 'array' then
    raise exception 'Changes must be arrays' using errcode = '22023';
  end if;
  if jsonb_array_length(p_upserts) + jsonb_array_length(p_deletes) > 500 then
    raise exception 'Too many changes in one request' using errcode = '22023';
  end if;

  delete from public.workspace_records r
   using jsonb_to_recordset(p_deletes) as d(kind text, id text)
   where r.owner_id = (select auth.uid()) and r.kind = d.kind and r.id = d.id;

  insert into public.workspace_records (owner_id, kind, id, data)
  select (select auth.uid()), u.kind, u.id, u.data
    from jsonb_to_recordset(p_upserts) as u(kind text, id text, data jsonb)
  on conflict (owner_id, kind, id) do update
    set data = excluded.data, updated_at = now()
    where public.workspace_records.data is distinct from excluded.data;
end;
$$;

revoke all on function public.workspace_apply(jsonb, jsonb) from public, anon;
grant execute on function public.workspace_apply(jsonb, jsonb) to authenticated;
