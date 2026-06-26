-- ============================================================
-- HAMA Database Schema — Feature Request Portal Migration
--
-- Creates tables for the Feature Request Portal:
--   - feature_requests            User-submitted feature ideas
--   - feature_request_votes       User votes on feature requests
--
-- Drop policies first for idempotent re-runs, then create tables,
-- enable RLS, create policies, add indexes, and create admin views.
-- ============================================================

-- ============================================================
-- 1. FEATURE REQUESTS
-- ============================================================
create table if not exists public.feature_requests (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  priority        text not null default 'medium' check (priority in ('low','medium','high','critical')),
  category        text not null check (category in ('ai','analytics','automation','business','marketplace','community','payments','mobile','other')),
  user_id         uuid references public.profiles(id) on delete set null,
  user_name       text,
  user_email      text,
  votes           integer not null default 0,
  status          text not null default 'planned' check (status in ('planned','in_development','testing','released','declined')),
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

alter table public.feature_requests enable row level security;

-- Policies
DROP POLICY IF EXISTS "Anyone authenticated can submit feature requests" ON public.feature_requests;
create policy "Anyone authenticated can submit feature requests"
  on public.feature_requests for insert
  with check (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view feature requests" ON public.feature_requests;
create policy "Anyone can view feature requests"
  on public.feature_requests for select
  using (true);

DROP POLICY IF EXISTS "Admins can update feature requests" ON public.feature_requests;
create policy "Admins can update feature requests"
  on public.feature_requests for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

DROP POLICY IF EXISTS "Hamisha Squad can manage feature requests" ON public.feature_requests;
create policy "Hamisha Squad can manage feature requests"
  on public.feature_requests for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('hamisha_squad', 'admin'))
  );

-- Indexes
create index if not exists idx_feature_requests_votes on public.feature_requests(votes desc);
create index if not exists idx_feature_requests_category on public.feature_requests(category);
create index if not exists idx_feature_requests_status on public.feature_requests(status);
create index if not exists idx_feature_requests_priority on public.feature_requests(priority);
create index if not exists idx_feature_requests_created_at on public.feature_requests(created_at desc);
create index if not exists idx_feature_requests_user_id on public.feature_requests(user_id);

-- ============================================================
-- 2. FEATURE REQUEST VOTES
-- ============================================================
create table if not exists public.feature_request_votes (
  id                uuid primary key default gen_random_uuid(),
  feature_request_id uuid not null references public.feature_requests(id) on delete cascade,
  user_id           uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),

  -- Each user can only vote once per request
  unique(feature_request_id, user_id)
);

alter table public.feature_request_votes enable row level security;

-- Policies
DROP POLICY IF EXISTS "Anyone authenticated can vote" ON public.feature_request_votes;
create policy "Anyone authenticated can vote"
  on public.feature_request_votes for insert
  with check (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can remove their own vote" ON public.feature_request_votes;
create policy "Users can remove their own vote"
  on public.feature_request_votes for delete
  using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view votes" ON public.feature_request_votes;
create policy "Anyone can view votes"
  on public.feature_request_votes for select
  using (true);

-- Indexes
create index if not exists idx_feature_request_votes_request_id on public.feature_request_votes(feature_request_id);
create index if not exists idx_feature_request_votes_user_id on public.feature_request_votes(user_id);

-- ============================================================
-- 3. AUTO-UPDATE VOTE COUNTS WITH TRIGGER
-- ============================================================
create or replace function public.update_feature_request_vote_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.feature_requests set votes = votes + 1, updated_at = now()
    where id = new.feature_request_id;
  elsif tg_op = 'DELETE' then
    update public.feature_requests set votes = greatest(0, votes - 1), updated_at = now()
    where id = old.feature_request_id;
  end if;
  return null;
end;
$$;

create trigger on_feature_request_vote_change
  after insert or delete on public.feature_request_votes
  for each row execute function public.update_feature_request_vote_count();

-- ============================================================
-- 4. ADMIN VIEW: Feature requests ranked by popularity
-- ============================================================
create or replace view public.view_feature_requests_popular as
select
  fr.*,
  p.display_name as submitter_name,
  count(frv.id) as total_votes
from public.feature_requests fr
left join public.feature_request_votes frv on frv.feature_request_id = fr.id
left join public.profiles p on p.id = fr.user_id
group by fr.id, p.display_name
order by count(frv.id) desc, fr.created_at desc;

-- ============================================================
-- 5. ADMIN VIEW: Feature requests by status
-- ============================================================
create or replace view public.view_feature_requests_by_status as
select
  status,
  count(*) as count,
  jsonb_agg(jsonb_build_object('id', id, 'title', title, 'votes', votes, 'created_at', created_at) order by votes desc) as requests
from public.feature_requests
group by status
order by
  case status
    when 'planned' then 1
    when 'in_development' then 2
    when 'testing' then 3
    when 'released' then 4
    when 'declined' then 5
  end;
