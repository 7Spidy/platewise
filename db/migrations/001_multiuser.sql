-- Run via: node scripts/run-migration.js

-- 1. New tables
create extension if not exists pgcrypto;

create table if not exists users (
  id                      uuid primary key default gen_random_uuid(),
  email                   text not null unique,
  password_hash           text,
  name                    text,
  role                    text not null default 'user' check (role in ('user', 'admin')),
  gender                  text check (gender in ('male', 'female', 'other')),
  age                     int,
  height_cm               numeric,
  weight_kg               numeric,
  unit_pref               text not null default 'metric' check (unit_pref in ('metric', 'imperial')),
  activity_level          text check (activity_level in ('sedentary', 'light', 'moderate', 'very')),
  goal                    text check (goal in ('lose', 'maintain', 'gain')),
  bonus_scans             int not null default 0,
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  last_active_at          timestamptz
);

create table if not exists waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists invite_tokens (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists api_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  meal_log_id    uuid,
  input_tokens   int not null,
  output_tokens  int not null,
  cost_usd       numeric(12, 8) not null,
  cost_inr       numeric(12, 4) not null,
  created_at     timestamptz not null default now()
);

create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('scan', 'general')),
  meal_log_id uuid,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- user_settings per-user targets
create table if not exists user_settings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references users(id) on delete cascade,
  calorie_target   int not null default 2200,
  macro_carbs_g    int not null default 200,
  macro_protein_g  int not null default 180,
  macro_fat_g      int not null default 70,
  manually_edited  boolean not null default false,
  updated_at       timestamptz not null default now()
);

-- 2. Add nullable user_id to existing tables
alter table meal_logs add column if not exists user_id uuid references users(id) on delete cascade;
alter table saved_meals add column if not exists user_id uuid references users(id) on delete cascade;
alter table saved_ingredients add column if not exists user_id uuid references users(id) on delete cascade;
alter table settings add column if not exists user_id uuid references users(id) on delete cascade;

-- 3. Insert admin user (password_hash intentionally unusable — use Forgot Password to set a real one)
insert into users (email, role, password_hash)
values ('avi.bangera2@gmail.com', 'admin', '$2b$12$unusablehashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
on conflict (email) do nothing;

-- 4. Backfill user_id for existing rows
do $$
declare admin_id uuid;
begin
  select id into admin_id from users where email = 'avi.bangera2@gmail.com';
  update meal_logs set user_id = admin_id where user_id is null;
  update saved_meals set user_id = admin_id where user_id is null;
  update saved_ingredients set user_id = admin_id where user_id is null;
  update settings set user_id = admin_id where user_id is null;
  -- Create user_settings row for admin from existing settings
  insert into user_settings (user_id, calorie_target, macro_carbs_g, macro_protein_g, macro_fat_g)
  select admin_id, target_calories, target_carbs_g, target_protein_g, target_fat_g
  from settings where id = 1
  on conflict (user_id) do nothing;
end $$;

-- 5. Make user_id NOT NULL and add indexes
alter table meal_logs alter column user_id set not null;
alter table saved_meals alter column user_id set not null;
alter table saved_ingredients alter column user_id set not null;
alter table settings alter column user_id set not null;

create index if not exists meal_logs_user_id_idx on meal_logs (user_id);
create index if not exists saved_meals_user_id_idx on saved_meals (user_id);
create index if not exists saved_ingredients_user_id_idx on saved_ingredients (user_id);
create index if not exists api_usage_user_id_idx on api_usage (user_id);
create index if not exists api_usage_created_at_idx on api_usage (created_at desc);
create index if not exists feedback_user_id_idx on feedback (user_id);
