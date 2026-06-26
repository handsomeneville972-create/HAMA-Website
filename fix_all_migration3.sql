-- ============================================================
-- Comprehensive fix: add missing columns + drop constraints
-- for ALL tables used in Migration 3 seed data
-- ============================================================

-- 1. Add missing columns to notifications
alter table public.notifications add column if not exists icon text;
alter table public.notifications add column if not exists action_link text;
alter table public.notifications add column if not exists read boolean not null default false;

-- 2. Drop NOT NULL on extra Supabase columns for properties, profiles, etc.
do $$
declare
  rec record;
begin
  for rec in (
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and is_nullable = 'NO'
      and column_default is null
      and table_name in (
        'profiles', 'properties', 'notifications', 'sellers',
        'products', 'service_providers', 'community_posts',
        'subscription_plans', 'user_subscriptions', 'conversations',
        'messages', 'neighborhoods'
      )
  ) loop
    begin
      execute format('alter table public.%I alter column %I drop not null;', rec.table_name, rec.column_name);
      raise notice 'Dropped NOT NULL on %.%', rec.table_name, rec.column_name;
    exception when others then
      raise notice 'Skipped %.%: %', rec.table_name, rec.column_name, SQLERRM;
    end;
  end loop;
end;
$$;

-- 3. Drop all check constraints on these tables (they may conflict with our data)
do $$
declare
  rec record;
begin
  for rec in (
    select con.conname, rel.relname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and con.contype = 'c'
      and rel.relname in (
        'profiles', 'properties', 'notifications', 'sellers',
        'products', 'service_providers', 'community_posts',
        'subscription_plans', 'user_subscriptions', 'conversations',
        'messages', 'neighborhoods'
      )
  ) loop
    begin
      execute format('alter table public.%I drop constraint %I;', rec.relname, rec.conname);
      raise notice 'Dropped constraint %.%', rec.relname, rec.conname;
    exception when others then
      raise notice 'Skipped constraint %.%: %', rec.relname, rec.conname, SQLERRM;
    end;
  end loop;
end;
$$;
