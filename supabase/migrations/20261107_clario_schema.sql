-- ==============================================================================
-- Clario Enterprise Platform: Supabase Database Schema & Row-Level Security (RLS)
-- Execution target: Supabase Project SQL Editor (Project ID: zfyoyoyqwffkpdqddock)
-- ==============================================================================

-- 1. PROFILES TABLE (Linked 1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role text default 'Customer Retention Lead',
  bio text default 'Managing customer churn risk and revenue optimization with Clario.',
  phone text,
  username text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Drop existing policies if any to prevent conflicts
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

-- RLS Policies: Authenticated users can only manage their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- 2. AUTOMATIC PROFILE TRIGGER ON USER REGISTRATION
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. USER DATASETS TABLE (Associated with individual user account)
create table if not exists public.user_datasets (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  row_count integer not null default 0,
  columns text[] default '{}',
  file_name text,
  missing_values_count integer default 0,
  active boolean default false,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_datasets enable row level security;

drop policy if exists "Users can view own datasets" on public.user_datasets;
drop policy if exists "Users can insert own datasets" on public.user_datasets;
drop policy if exists "Users can update own datasets" on public.user_datasets;
drop policy if exists "Users can delete own datasets" on public.user_datasets;

create policy "Users can view own datasets"
  on public.user_datasets for select
  using (auth.uid() = user_id);

create policy "Users can insert own datasets"
  on public.user_datasets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own datasets"
  on public.user_datasets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own datasets"
  on public.user_datasets for delete
  using (auth.uid() = user_id);

-- 4. SAVED PREDICTIONS TABLE (Associated with individual user account)
create table if not exists public.saved_predictions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id text,
  customer_name text not null,
  probability numeric not null,
  risk_tier text not null,
  tenure integer not null,
  monthly_charges numeric not null,
  total_charges numeric not null,
  contract text,
  payment_method text,
  internet_service text,
  tech_support text,
  online_security text,
  paperless_billing text,
  dependents text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.saved_predictions enable row level security;

drop policy if exists "Users can view own predictions" on public.saved_predictions;
drop policy if exists "Users can insert own predictions" on public.saved_predictions;
drop policy if exists "Users can update own predictions" on public.saved_predictions;
drop policy if exists "Users can delete own predictions" on public.saved_predictions;

create policy "Users can view own predictions"
  on public.saved_predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert own predictions"
  on public.saved_predictions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own predictions"
  on public.saved_predictions for delete
  using (auth.uid() = user_id);
