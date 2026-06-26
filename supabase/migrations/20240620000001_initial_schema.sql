-- ============================================================
-- HAMA Database Schema — Initial Migration (Idempotent Policies)
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text,
  avatar_url    text,
  role          text not null default 'seeker' check (role in ('seeker','landlord','seller','service_provider','hamisha_squad','admin')),
  phone         text,
  phone_verified boolean not null default false,
  verification_level text not null default 'unverified' check (verification_level in ('unverified','email','phone','id','business','full')),

  -- timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Ensure columns exist (in case table was created by Supabase defaults)
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'seeker';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.profiles add column if not exists verification_level text not null default 'unverified';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Enable RLS
alter table public.profiles enable row level security;

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'https://i.pravatar.cc/150?u=' || new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'seeker')
  );
  return new;
end;
$$;

-- Trigger the function on user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. PROFILES RLS POLICIES (Idempotent)
-- ============================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

DROP POLICY IF EXISTS "Users cannot change own role" ON public.profiles;
create policy "Users cannot change own role"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    (auth.uid() = id) and
    (role = (select role from public.profiles where id = auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 3. AUDIT LOGS TABLE
-- ============================================================

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  user_id     uuid references public.profiles(id) on delete set null,
  email       text,
  ip_address  text,
  metadata    jsonb default '{}'::jsonb,
  severity    text not null default 'info' check (severity in ('info','warning','critical')),
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Audit logs RLS (Idempotent)
DROP POLICY IF EXISTS "Anyone authenticated can insert audit logs" ON public.audit_logs;
create policy "Anyone authenticated can insert audit logs"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Hamisha Squad can read audit logs" ON public.audit_logs;
create policy "Hamisha Squad can read audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('hamisha_squad', 'admin')
    )
  );

-- Index for fast audit queries
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_event_type on public.audit_logs(event_type);
create index if not exists idx_audit_logs_severity on public.audit_logs(severity);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ============================================================
-- 4. LANDLORD VERIFICATION TABLE
-- ============================================================

create table if not exists public.landlord_verifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  phone_verified    boolean not null default false,
  email_verified    boolean not null default false,
  national_id_verified boolean not null default false,
  business_verified boolean not null default false,
  documents_url     text[] default '{}',
  verified_at       timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Ensure only one verification record per user
  unique(user_id)
);

-- Enable RLS
alter table public.landlord_verifications enable row level security;

-- Landlord verification RLS (Idempotent)
DROP POLICY IF EXISTS "Users can read own verification" ON public.landlord_verifications;
create policy "Users can read own verification"
  on public.landlord_verifications for select
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all verifications" ON public.landlord_verifications;
create policy "Admins can read all verifications"
  on public.landlord_verifications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert own verification" ON public.landlord_verifications;
create policy "Users can insert own verification"
  on public.landlord_verifications for insert
  with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can update verification" ON public.landlord_verifications;
create policy "Only admins can update verification"
  on public.landlord_verifications for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 5. SIGNED URL FUNCTION (for private content)
-- ============================================================

create or replace function public.get_signed_url(
  bucket_name text,
  object_path text,
  expiry_seconds int default 3600
)
returns text
language plpgsql
security definer
as $$
declare
  signed_url text;
begin
  -- Verify the user owns the object or is admin
  if not exists (
    select 1 from storage.objects
    where bucket_id = bucket_name
      and name = object_path
      and (owner = auth.uid() or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      ))
  ) then
    raise insufficient_privilege using message = 'Not authorized to access this file';
  end if;

  select storage.sign_url(bucket_name, object_path, expiry_seconds) into signed_url;
  return signed_url;
end;
$$;

-- ============================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);

-- ============================================================
-- 7. HELPER FUNCTION: Get user role
-- ============================================================

create or replace function public.get_user_role(user_id uuid)
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = user_id;
$$;

-- ============================================================
-- 8. RATE LIMITING FUNCTION (optional, server-side)
-- ============================================================

create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts int default 5,
  p_window_minutes int default 15
)
returns boolean
language plpgsql
security definer
as $$
declare
  attempt_count int;
begin
  select count(*)
  into attempt_count
  from public.audit_logs
  where user_id = p_user_id
    and event_type = p_action
    and created_at > now() - (p_window_minutes || ' minutes')::interval;

  return attempt_count < p_max_attempts;
end;
$$;
