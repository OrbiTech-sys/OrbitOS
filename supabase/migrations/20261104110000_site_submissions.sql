-- OrbitOS: what visitors send through the website's contact and access-request forms.
--
-- This is personal data, so it is closed by default. Visitors cannot reach the table
-- at all: the Server Action validates and rate-limits a submission, then inserts it with
-- the secret key. Active admins and super admins may read it, mark it handled and delete it.

create table public.site_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'waitlist')),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  company text not null default '' check (char_length(company) <= 120),
  -- The topic of a message, or the business type of an access request.
  topic text not null default '' check (char_length(topic) <= 120),
  message text not null default '' check (char_length(message) <= 2000),
  team_size text not null default '' check (char_length(team_size) <= 20),
  -- A salted hash, used only to rate-limit. The address itself is never stored.
  ip_hash text check (char_length(ip_hash) <= 128),
  status text not null default 'new' check (status in ('new', 'handled')),
  handled_at timestamptz,
  handled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.site_submissions is 'Website form submissions. Inserted by the server only; readable by active admins.';

create index site_submissions_created_at_idx on public.site_submissions (created_at desc);
create index site_submissions_rate_limit_idx on public.site_submissions (ip_hash, created_at desc);

alter table public.site_submissions enable row level security;
revoke all on table public.site_submissions from anon, authenticated;
grant select, delete on table public.site_submissions to authenticated;
grant update (status, handled_at, handled_by) on table public.site_submissions to authenticated;

create policy "site_submissions_admin_read"
  on public.site_submissions for select to authenticated
  using ((select private.current_app_role()) in ('super_admin', 'admin'));

create policy "site_submissions_admin_update"
  on public.site_submissions for update to authenticated
  using ((select private.current_app_role()) in ('super_admin', 'admin'))
  with check ((select private.current_app_role()) in ('super_admin', 'admin'));

create policy "site_submissions_admin_delete"
  on public.site_submissions for delete to authenticated
  using ((select private.current_app_role()) in ('super_admin', 'admin'));

-- A deactivated account keeps only read access to its own profile: it can no longer rename itself.
alter policy "profiles_update_own"
  on public.profiles
  using (id = (select auth.uid()) and (select private.is_active_user()))
  with check (id = (select auth.uid()) and (select private.is_active_user()));
