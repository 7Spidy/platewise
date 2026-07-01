-- Run this once in the Vercel dashboard Query tab, before deploying the Export Data feature
alter table users add column if not exists last_export_at timestamptz;
