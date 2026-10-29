-- OrbitOS: one deterministic size for a workspace record.
--
-- Storage use is the size of a record as written (its JSON text plus its key),
-- the same number whether it is measured when saved or later added up, so the
-- total an admin sees always equals the sum of the per-module breakdown.
-- (pg_column_size varies between an in-memory and a stored row.)

create function private.workspace_record_bytes(p_kind text, p_id text, p_data jsonb)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select (octet_length(p_data::text) + octet_length(p_id) + octet_length(p_kind))::bigint;
$$;

create or replace function private.track_workspace_usage()
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
           bytes = greatest(bytes - private.workspace_record_bytes(old.kind, old.id, old.data), 0),
           last_write_at = now()
     where owner_id = old.owner_id;
    return old;
  end if;

  owner := new.owner_id;
  if tg_op = 'INSERT' then
    delta_bytes := private.workspace_record_bytes(new.kind, new.id, new.data);
    delta_records := 1;
  else
    delta_bytes := private.workspace_record_bytes(new.kind, new.id, new.data)
                 - private.workspace_record_bytes(old.kind, old.id, old.data);
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

create or replace function public.workspace_usage_breakdown(p_owner uuid)
returns table (kind text, records bigint, bytes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.kind, count(*)::bigint, coalesce(sum(private.workspace_record_bytes(r.kind, r.id, r.data)), 0)::bigint
    from public.workspace_records r
   where r.owner_id = p_owner
     and (select private.current_app_role()) in ('super_admin', 'admin')
   group by r.kind
   order by 3 desc, 1;
$$;

-- Re-measure anything saved under the old measure.
update public.workspace_usage u
   set records = coalesce(m.records, 0),
       bytes = coalesce(m.bytes, 0)
  from (
    select o.owner_id,
           (select count(*) from public.workspace_records r where r.owner_id = o.owner_id) as records,
           (select sum(private.workspace_record_bytes(r.kind, r.id, r.data)) from public.workspace_records r where r.owner_id = o.owner_id) as bytes
      from public.workspace_usage o
  ) m
 where u.owner_id = m.owner_id;
