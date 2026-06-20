-- Run this once against your Vercel Postgres database
-- (Vercel dashboard → Storage → your Postgres instance → Query tab works fine for a one-off)

create extension if not exists pgcrypto;

create table if not exists meal_logs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  serving       text,
  calories      int not null,
  carbs_g       int,
  protein_g     int,
  fat_g         int,
  fiber_g       numeric,
  sugar_g       numeric,
  sodium_mg     numeric,
  health_score  int,
  fact          text,
  tips          jsonb,
  mismatch      boolean default false,
  photo_url     text,
  meal_type     text  -- nullable, optional breakfast/lunch/dinner/snack tag, unused by the UI for now
);

create index if not exists meal_logs_created_at_idx on meal_logs (created_at desc);
