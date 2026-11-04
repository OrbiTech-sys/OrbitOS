-- OrbitOS: accounts are created by an administrator, and the database enforces it.
--
-- "Allow new users to sign up" is a dashboard setting that is easy to leave on, and the
-- sign-up endpoint is reachable by anyone who has the project's public URL and publishable
-- key. So every new auth user must carry an app_metadata flag that only the secret key can
-- set, or the transaction that creates it fails and no account exists.
--
-- The check runs at commit because Supabase Auth inserts the user first and adds its
-- app_metadata later in the same transaction. Turning the dashboard setting off as well is
-- still worthwhile: a refused sign-up may already have queued a (now useless) confirmation email.

create or replace function private.handle_new_user()
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

create function private.require_admin_created_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from auth.users u
    where u.id = new.id
      and u.raw_app_meta_data ->> 'created_by_admin' is distinct from 'true'
  ) then
    raise exception 'Public sign-up is disabled' using errcode = 'P0001';
  end if;
  return null;
end;
$$;

revoke all on function private.require_admin_created_user() from public, anon, authenticated;
grant execute on function private.require_admin_created_user() to supabase_auth_admin;

create constraint trigger on_auth_user_created_require_admin
  after insert on auth.users
  deferrable initially deferred
  for each row execute function private.require_admin_created_user();
