-- Add ALL missing columns to the properties table at once
alter table public.properties add column if not exists size_sqm numeric(8,2);
alter table public.properties add column if not exists rating numeric(3,2) not null default 0;
alter table public.properties add column if not exists review_count integer not null default 0;
alter table public.properties add column if not exists furnished boolean not null default false;
alter table public.properties add column if not exists landlord_id uuid;
alter table public.properties add column if not exists title text;
alter table public.properties add column if not exists description text;
alter table public.properties add column if not exists price numeric(12,2);
alter table public.properties add column if not exists bedrooms integer not null default 0;
alter table public.properties add column if not exists bathrooms integer not null default 0;
alter table public.properties add column if not exists latitude numeric(10,7);
alter table public.properties add column if not exists longitude numeric(10,7);
alter table public.properties add column if not exists created_at timestamptz not null default now();
alter table public.properties add column if not exists updated_at timestamptz not null default now();
