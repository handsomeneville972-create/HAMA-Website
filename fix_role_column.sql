-- ============================================================
-- Fix role column: drop ALL policies on affected tables,
-- alter column type from enum to text, recreate everything
-- ============================================================

-- 1. Drop ALL policies on all tables that reference profiles.role
-- (PostgreSQL requires ALL refs to be cleared before altering the column)

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users cannot change own role" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

DROP POLICY IF EXISTS "Anyone authenticated can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Hamisha Squad can read audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Users can read own verification" ON public.landlord_verifications;
DROP POLICY IF EXISTS "Admins can read all verifications" ON public.landlord_verifications;
DROP POLICY IF EXISTS "Users can insert own verification" ON public.landlord_verifications;
DROP POLICY IF EXISTS "Only admins can update verification" ON public.landlord_verifications;

-- 2. Convert role from Supabase enum to text
alter table public.profiles alter column role type text using role::text;
alter table public.profiles alter column role set default 'seeker';

-- 3. Recreate ALL policies

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users cannot change own role"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    (auth.uid() = id) and
    (role = (select role from public.profiles where id = auth.uid()))
  );

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Audit logs
create policy "Anyone authenticated can insert audit logs"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can read audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Hamisha Squad can read audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('hamisha_squad', 'admin')
    )
  );

-- Landlord verifications
create policy "Users can read own verification"
  on public.landlord_verifications for select
  using (auth.uid() = user_id);

create policy "Admins can read all verifications"
  on public.landlord_verifications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can insert own verification"
  on public.landlord_verifications for insert
  with check (auth.uid() = user_id);

create policy "Only admins can update verification"
  on public.landlord_verifications for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
