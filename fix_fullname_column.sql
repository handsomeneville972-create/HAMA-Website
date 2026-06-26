-- Drop the full_name column from profiles (we use display_name instead)
-- The trigger handle_new_user() doesn't set full_name, causing NOT NULL violations
alter table public.profiles drop column if exists full_name;
