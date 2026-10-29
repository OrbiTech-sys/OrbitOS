-- OrbitOS: what admins may see about a member's workspace.
--
-- Admins see how much storage a member uses, never what the records contain.
-- This returns only counts and sizes per module, and only to active admins.

create function public.workspace_usage_breakdown(p_owner uuid)
returns table (kind text, records bigint, bytes bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.kind, count(*)::bigint, coalesce(sum(pg_column_size(r.*)), 0)::bigint
    from public.workspace_records r
   where r.owner_id = p_owner
     and (select private.current_app_role()) in ('super_admin', 'admin')
   group by r.kind
   order by 3 desc, 1;
$$;

revoke all on function public.workspace_usage_breakdown(uuid) from public, anon;
grant execute on function public.workspace_usage_breakdown(uuid) to authenticated;
