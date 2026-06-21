-- Run this once against your Vercel Postgres database, after 001_meal_logs.sql
-- (Vercel dashboard → Storage → your Postgres instance → Query tab works fine for a one-off)

-- Per-ingredient breakdown for a logged meal (used by AI Review + History edit)
alter table meal_logs add column if not exists ingredients jsonb;

-- Individual saved ingredients (Saved Foods → Ingredients tab)
create table if not exists saved_ingredients (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  default_unit  text,
  calories      numeric not null default 0,
  protein_g     numeric not null default 0,
  carbs_g       numeric not null default 0,
  fat_g         numeric not null default 0,
  fiber_g       numeric default 0,
  sodium_mg     numeric default 0,
  sugar_g       numeric default 0
);

-- Saved full meal combos (Saved Foods → Meals tab; also powers the Dashboard Quick-Add strip)
create table if not exists saved_meals (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  photo_url     text,
  ingredients   jsonb,
  calories      numeric not null default 0,
  protein_g     numeric not null default 0,
  carbs_g       numeric not null default 0,
  fat_g         numeric not null default 0,
  fiber_g       numeric default 0,
  sodium_mg     numeric default 0,
  sugar_g       numeric default 0,
  use_count     integer not null default 0,
  last_used_at  timestamptz
);

-- Single-row settings table (daily targets shown on the Dashboard rings)
create table if not exists settings (
  id                integer primary key default 1,
  target_calories   integer not null default 2200,
  target_protein_g  integer not null default 180,
  target_carbs_g    integer not null default 200,
  target_fat_g      integer not null default 70,
  updated_at        timestamptz default now()
);
insert into settings (id) values (1) on conflict (id) do nothing;

create index if not exists saved_meals_last_used_idx on saved_meals (last_used_at desc);
