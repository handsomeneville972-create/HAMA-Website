-- ============================================================
-- HAMA Database Schema — Data Tables Migration
--
-- Creates all the core data tables for the HAMA platform:
--   - Sellers & Products (marketplace)
--   - Service Providers
--   - Properties & Reviews
--   - Neighborhoods
--   - Community Posts
--   - Subscriptions & User Subscriptions
--   - Notifications
--   - Conversations & Messages
--   - User Favorites
--   - Product Reviews
-- ============================================================

-- ============================================================
-- 1. SELLERS
-- ============================================================
create table if not exists public.sellers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  name          text not null,
  description   text,
  logo_url      text,
  banner_url    text,
  location      text,
  contact       text,
  rating        numeric(3,2) not null default 0,
  review_count  integer not null default 0,
  followers     integer not null default 0,
  joined_date   date not null default current_date,
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.sellers enable row level security;

create policy "Anyone can view sellers"
  on public.sellers for select
  using (true);

create policy "Sellers can update their own profile"
  on public.sellers for update
  using (auth.uid() = user_id);

create policy "Sellers can insert their own profile"
  on public.sellers for insert
  with check (auth.uid() = user_id);

create index if not exists idx_sellers_user_id on public.sellers(user_id);
create index if not exists idx_sellers_rating on public.sellers(rating desc);

-- ============================================================
-- 2. PRODUCT CATEGORIES (reference/lookup table)
-- ============================================================
create table if not exists public.product_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  icon          text,
  display_order integer not null default 0
);

alter table public.product_categories enable row level security;
create policy "Anyone can view product categories"
  on public.product_categories for select using (true);

-- ============================================================
-- 3. PRODUCT SUBCATEGORIES
-- ============================================================
create table if not exists public.product_subcategories (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.product_categories(id) on delete cascade,
  name          text not null,
  unique(category_id, name)
);

alter table public.product_subcategories enable row level security;
create policy "Anyone can view product subcategories"
  on public.product_subcategories for select using (true);

-- ============================================================
-- 4. PRODUCTS
-- ============================================================
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid references public.sellers(id) on delete cascade not null,
  name            text not null,
  description     text,
  price           numeric(12,2) not null,
  original_price  numeric(12,2),
  category        text,
  subcategory     text,
  condition       text not null default 'New' check (condition in ('New','Like New','Good','Fair')),
  rating          numeric(3,2) not null default 0,
  review_count    integer not null default 0,
  location        text,
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Anyone can view products"
  on public.products for select using (true);

create policy "Sellers can insert products"
  on public.products for insert
  with check (
    exists (select 1 from public.sellers where id = seller_id and user_id = auth.uid())
  );

create policy "Sellers can update their own products"
  on public.products for update
  using (
    exists (select 1 from public.sellers where id = seller_id and user_id = auth.uid())
  );

create policy "Sellers can delete their own products"
  on public.products for delete
  using (
    exists (select 1 from public.sellers where id = seller_id and user_id = auth.uid())
  );

create index if not exists idx_products_seller_id on public.products(seller_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_featured on public.products(featured) where featured = true;
create index if not exists idx_products_created_at on public.products(created_at desc);

-- ============================================================
-- 5. PRODUCT IMAGES
-- ============================================================
create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references public.products(id) on delete cascade not null,
  image_url     text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.product_images enable row level security;
create policy "Anyone can view product images"
  on public.product_images for select using (true);

create policy "Sellers can manage product images"
  on public.product_images for insert with check (
    exists (select 1 from public.sellers s join public.products p on p.seller_id = s.id where p.id = product_id and s.user_id = auth.uid())
  );

create index if not exists idx_product_images_product_id on public.product_images(product_id);

-- ============================================================
-- 6. PRODUCT REVIEWS
-- ============================================================
create table if not exists public.product_reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references public.products(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  rating        integer not null check (rating >= 1 and rating <= 5),
  content       text,
  created_at    timestamptz not null default now(),
  unique(product_id, user_id)
);

alter table public.product_reviews enable row level security;

create policy "Anyone can view product reviews"
  on public.product_reviews for select using (true);

create policy "Authenticated users can create reviews"
  on public.product_reviews for insert
  with check (auth.uid() = user_id);

create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);

-- ============================================================
-- 7. SERVICE CATEGORIES (reference)
-- ============================================================
create table if not exists public.service_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  icon          text,
  display_order integer not null default 0
);

alter table public.service_categories enable row level security;
create policy "Anyone can view service categories"
  on public.service_categories for select using (true);

-- ============================================================
-- 8. SERVICE SUBCATEGORIES
-- ============================================================
create table if not exists public.service_subcategories (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.service_categories(id) on delete cascade,
  name          text not null,
  unique(category_id, name)
);

alter table public.service_subcategories enable row level security;
create policy "Anyone can view service subcategories"
  on public.service_subcategories for select using (true);

-- ============================================================
-- 9. SERVICE PROVIDERS
-- ============================================================
create table if not exists public.service_providers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
  name            text not null,
  logo_url        text,
  banner_url      text,
  description     text,
  category        text,
  subcategory     text,
  location        text,
  rating          numeric(3,2) not null default 0,
  review_count    integer not null default 0,
  verified        boolean not null default false,
  pricing         text,
  response_time   text,
  availability    text,
  phone           text,
  email           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.service_providers enable row level security;

create policy "Anyone can view service providers"
  on public.service_providers for select using (true);

create policy "Providers can update their own profile"
  on public.service_providers for update
  using (auth.uid() = user_id);

create index if not exists idx_service_providers_category on public.service_providers(category);
create index if not exists idx_service_providers_rating on public.service_providers(rating desc);

-- ============================================================
-- 10. SERVICE PROVIDER REVIEWS
-- ============================================================
create table if not exists public.service_reviews (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid references public.service_providers(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  rating            integer not null check (rating >= 1 and rating <= 5),
  content           text,
  created_at        timestamptz not null default now(),
  unique(provider_id, user_id)
);

alter table public.service_reviews enable row level security;
create policy "Anyone can view service reviews"
  on public.service_reviews for select using (true);
create policy "Users can create service reviews"
  on public.service_reviews for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 11. NEIGHBORHOODS
-- ============================================================
create table if not exists public.neighborhoods (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  city              text not null default 'Nairobi',
  description       text,
  image_url         text,
  rating            numeric(3,2) not null default 0,
  security_rating   numeric(3,2) not null default 0,
  amenities_rating  numeric(3,2) not null default 0,
  transport_rating  numeric(3,2) not null default 0,
  avg_rent          numeric(10,2),
  property_count    integer not null default 0,
  review_count      integer not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.neighborhoods enable row level security;
create policy "Anyone can view neighborhoods"
  on public.neighborhoods for select using (true);

-- ============================================================
-- 12. PROPERTIES
-- ============================================================
create table if not exists public.properties (
  id              uuid primary key default gen_random_uuid(),
  landlord_id     uuid references public.profiles(id) on delete cascade not null,
  title           text not null,
  description     text,
  price           numeric(12,2) not null,
  bedrooms        integer not null default 0,
  bathrooms       integer not null default 0,
  size_sqm        numeric(8,2),
  location        text,
  latitude        numeric(10,7),
  longitude       numeric(10,7),
  rating          numeric(3,2) not null default 0,
  review_count    integer not null default 0,
  furnished       boolean not null default false,
  available       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "Anyone can view properties"
  on public.properties for select using (true);

create policy "Landlords can manage their own properties"
  on public.properties for insert
  with check (auth.uid() = landlord_id);

create policy "Landlords can update their own properties"
  on public.properties for update
  using (auth.uid() = landlord_id);

create policy "Landlords can delete their own properties"
  on public.properties for delete
  using (auth.uid() = landlord_id);

-- Ensure columns exist (in case table was created in a prior partial run)
alter table public.properties add column if not exists available boolean not null default true;
alter table public.properties add column if not exists location text;

create index if not exists idx_properties_landlord_id on public.properties(landlord_id);
create index if not exists idx_properties_price on public.properties(price);
create index if not exists idx_properties_available on public.properties(available) where available = true;
create index if not exists idx_properties_location on public.properties(location);
create index if not exists idx_properties_created_at on public.properties(created_at desc);

-- ============================================================
-- 13. PROPERTY IMAGES
-- ============================================================
create table if not exists public.property_images (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid references public.properties(id) on delete cascade not null,
  image_url       text not null,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.property_images enable row level security;
create policy "Anyone can view property images"
  on public.property_images for select using (true);

create index if not exists idx_property_images_property_id on public.property_images(property_id);

-- ============================================================
-- 14. PROPERTY AMENITIES
-- ============================================================
create table if not exists public.property_amenities (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid references public.properties(id) on delete cascade not null,
  name            text not null,
  created_at      timestamptz not null default now()
);

alter table public.property_amenities enable row level security;
create policy "Anyone can view property amenities"
  on public.property_amenities for select using (true);

create index if not exists idx_property_amenities_property_id on public.property_amenities(property_id);

-- ============================================================
-- 15. PROPERTY REVIEWS (with multi-dimension ratings)
-- ============================================================
create table if not exists public.property_reviews (
  id                  uuid primary key default gen_random_uuid(),
  property_id         uuid references public.properties(id) on delete cascade not null,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  rating              integer not null check (rating >= 1 and rating <= 5),
  security_rating     integer check (security_rating >= 1 and security_rating <= 5),
  cleanliness_rating  integer check (cleanliness_rating >= 1 and cleanliness_rating <= 5),
  accessibility_rating integer check (accessibility_rating >= 1 and accessibility_rating <= 5),
  amenities_rating    integer check (amenities_rating >= 1 and amenities_rating <= 5),
  value_rating        integer check (value_rating >= 1 and value_rating <= 5),
  content             text,
  helpful_count       integer not null default 0,
  created_at          timestamptz not null default now(),
  unique(property_id, user_id)
);

alter table public.property_reviews enable row level security;

create policy "Anyone can view property reviews"
  on public.property_reviews for select using (true);

create policy "Users can create property reviews"
  on public.property_reviews for insert
  with check (auth.uid() = user_id);

create index if not exists idx_property_reviews_property_id on public.property_reviews(property_id);

-- ============================================================
-- 16. COMMUNITY POSTS
-- ============================================================
create table if not exists public.community_posts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  type              text not null check (type in ('photo','video','tip','review','experience','neighborhood','advice')),
  content           text not null,
  image_url         text,
  video_url         text,
  likes_count       integer not null default 0,
  comments_count    integer not null default 0,
  shares_count      integer not null default 0,
  bookmarks_count   integer not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.community_posts enable row level security;

create policy "Anyone can view community posts"
  on public.community_posts for select using (true);

create policy "Users can create their own posts"
  on public.community_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.community_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.community_posts for delete
  using (auth.uid() = user_id);

create index if not exists idx_community_posts_user_id on public.community_posts(user_id);
create index if not exists idx_community_posts_type on public.community_posts(type);
create index if not exists idx_community_posts_created_at on public.community_posts(created_at desc);

-- ============================================================
-- 17. COMMUNITY POST TAGS
-- ============================================================
create table if not exists public.community_post_tags (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid references public.community_posts(id) on delete cascade not null,
  tag       text not null,
  unique(post_id, tag)
);

alter table public.community_post_tags enable row level security;
create policy "Anyone can view post tags"
  on public.community_post_tags for select using (true);
create index if not exists idx_community_post_tags_post_id on public.community_post_tags(post_id);

-- ============================================================
-- 18. COMMUNITY POST LIKES
-- ============================================================
create table if not exists public.community_post_likes (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid references public.community_posts(id) on delete cascade not null,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

alter table public.community_post_likes enable row level security;
create policy "Anyone can view likes"
  on public.community_post_likes for select using (true);
create policy "Users can like posts"
  on public.community_post_likes for insert
  with check (auth.uid() = user_id);
create policy "Users can unlike posts"
  on public.community_post_likes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 19. COMMUNITY POST BOOKMARKS
-- ============================================================
create table if not exists public.community_post_bookmarks (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid references public.community_posts(id) on delete cascade not null,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

alter table public.community_post_bookmarks enable row level security;
create policy "Anyone can view bookmarks"
  on public.community_post_bookmarks for select using (true);
create policy "Users can bookmark posts"
  on public.community_post_bookmarks for insert
  with check (auth.uid() = user_id);
create policy "Users can remove bookmarks"
  on public.community_post_bookmarks for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 20. POST COMMENTS
-- ============================================================
create table if not exists public.post_comments (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid references public.community_posts(id) on delete cascade not null,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  content   text not null,
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;
create policy "Anyone can view comments"
  on public.post_comments for select using (true);
create policy "Users can create comments"
  on public.post_comments for insert
  with check (auth.uid() = user_id);
create policy "Users can delete their own comments"
  on public.post_comments for delete
  using (auth.uid() = user_id);

create index if not exists idx_post_comments_post_id on public.post_comments(post_id);

-- ============================================================
-- 21. SUBSCRIPTION PLANS
-- ============================================================
create table if not exists public.subscription_plans (
  id            uuid primary key default gen_random_uuid(),
  user_type     text not null check (user_type in ('seeker','landlord','seller','service_provider')),
  tier          text not null check (tier in ('Free','Basic','Premium','Pro')),
  price         numeric(10,2) not null,
  currency      text not null default 'KSh',
  features      jsonb not null default '[]'::jsonb,
  highlighted   boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
create policy "Anyone can view subscription plans"
  on public.subscription_plans for select using (true);

-- ============================================================
-- 22. USER SUBSCRIPTIONS
-- ============================================================
create table if not exists public.user_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  plan_id       uuid references public.subscription_plans(id) on delete set null,
  status        text not null default 'active' check (status in ('active','cancelled','expired')),
  started_at    timestamptz not null default now(),
  expires_at    timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can create their own subscriptions"
  on public.user_subscriptions for insert
  with check (auth.uid() = user_id);

create index if not exists idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);

-- ============================================================
-- 23. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  type          text not null,
  title         text not null,
  message       text not null,
  icon          text,
  read          boolean not null default false,
  action_link   text,
  created_at    timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- ============================================================
-- 24. CONVERSATIONS (table only — cross-referencing policy added after participants table)
-- ============================================================
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Users can create conversations"
  on public.conversations for insert
  with check (true);

-- ============================================================
-- 25. CONVERSATION PARTICIPANTS
-- ============================================================
create table if not exists public.conversation_participants (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid references public.conversations(id) on delete cascade not null,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  joined_at         timestamptz not null default now(),
  unique(conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

create policy "Participants can view participants"
  on public.conversation_participants for select
  using (
    exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid())
  );

create policy "Users can join conversations"
  on public.conversation_participants for insert
  with check (auth.uid() = user_id);

create index if not exists idx_conversation_participants_conversation_id on public.conversation_participants(conversation_id);
create index if not exists idx_conversation_participants_user_id on public.conversation_participants(user_id);

-- Now that conversation_participants exists, add the cross-referencing policy on conversations
create policy "Participants can view conversations"
  on public.conversations for select
  using (
    exists (select 1 from public.conversation_participants where conversation_id = id and user_id = auth.uid())
  );

-- ============================================================
-- 26. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  text            text not null,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Ensure columns exist (in case table was created in a prior partial run)
alter table public.messages add column if not exists conversation_id uuid;
alter table public.messages add column if not exists sender_id uuid;
alter table public.messages add column if not exists text text;
alter table public.messages add column if not exists read boolean not null default false;

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (select 1 from public.conversation_participants where conversation_id = messages.conversation_id and user_id = auth.uid())
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (select 1 from public.conversation_participants where conversation_id = messages.conversation_id and user_id = auth.uid())
  );

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);

-- ============================================================
-- 27. USER FAVORITES (saved properties, products, posts)
-- ============================================================
create table if not exists public.user_favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  item_type   text not null check (item_type in ('property','product','post')),
  item_id     uuid not null,
  created_at  timestamptz not null default now(),
  unique(user_id, item_type, item_id)
);

alter table public.user_favorites enable row level security;

create policy "Users can view their own favorites"
  on public.user_favorites for select
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.user_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove favorites"
  on public.user_favorites for delete
  using (auth.uid() = user_id);

create index if not exists idx_user_favorites_user_id on public.user_favorites(user_id);
create index if not exists idx_user_favorites_item on public.user_favorites(item_type, item_id);

-- ============================================================
-- 28. PROFILE FAVORITES (aggregated view for easy querying)
-- Optional — can be replaced by querying user_favorites directly
-- ============================================================

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
create index if not exists idx_products_search on public.products using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
create index if not exists idx_properties_search on public.properties using gin(to_tsvector('english', title || ' ' || coalesce(description, '')));
create index if not exists idx_service_providers_search on public.service_providers using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
create index if not exists idx_community_posts_search on public.community_posts using gin(to_tsvector('english', content));

-- ============================================================
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- ============================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply auto-update triggers
create trigger update_sellers_updated_at
  before update on public.sellers
  for each row execute function public.update_updated_at_column();

create trigger update_products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at_column();

create trigger update_service_providers_updated_at
  before update on public.service_providers
  for each row execute function public.update_updated_at_column();

create trigger update_properties_updated_at
  before update on public.properties
  for each row execute function public.update_updated_at_column();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- INSERT PRODUCT CATEGORIES (seed data)
-- ============================================================
insert into public.product_categories (name, icon, display_order) values
  ('Furniture', 'sofa', 1),
  ('Appliances', 'tv', 2),
  ('Electronics', 'laptop', 3),
  ('Home Essentials', 'home', 4),
  ('Utilities', 'flash', 5),
  ('Student Starter Packs', 'school', 6)
on conflict (name) do nothing;

-- ============================================================
-- INSERT SERVICE CATEGORIES (seed data)
-- ============================================================
insert into public.service_categories (name, icon, display_order) values
  ('Relocation', 'car', 1),
  ('Home Maintenance', 'wrench', 2),
  ('Cleaning', 'sparkles', 3),
  ('Technology', 'cpu', 4),
  ('Construction', 'hard-hat', 5),
  ('Home Improvement', 'palette', 6),
  ('Household', 'people', 7)
on conflict (name) do nothing;
