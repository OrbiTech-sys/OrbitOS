-- OrbitOS: the public website's content.
--
-- Each row holds one section of the website (navigation, product modules, pricing, ...)
-- as validated JSON. Anyone may read it, because it is what the public site shows and
-- holds nothing private. Only an active super admin may change it, and the database
-- decides that, not the app. A missing row means "use the built-in default", so deleting
-- a row is how a section is reset. The app validates shapes (lib/content/schema.ts).

create table public.site_content (
  key text primary key check (key ~ '^[a-z_]{1,40}$'),
  data jsonb not null check (jsonb_typeof(data) in ('object', 'array') and pg_column_size(data) <= 1048576),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.site_content is 'One row per website section. Public read; writes by active super admins only.';

alter table public.site_content enable row level security;
revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.site_content to authenticated;

create policy "site_content_public_read"
  on public.site_content for select to anon, authenticated
  using (true);

create policy "site_content_super_admin_insert"
  on public.site_content for insert to authenticated
  with check ((select private.current_app_role()) = 'super_admin');

create policy "site_content_super_admin_update"
  on public.site_content for update to authenticated
  using ((select private.current_app_role()) = 'super_admin')
  with check ((select private.current_app_role()) = 'super_admin');

create policy "site_content_super_admin_delete"
  on public.site_content for delete to authenticated
  using ((select private.current_app_role()) = 'super_admin');

create trigger site_content_touch_updated_at
  before update on public.site_content
  for each row execute function private.touch_updated_at();
