create table if not exists login_attempts (
  id bigserial primary key,
  identifier_hash text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_lookup
  on login_attempts (identifier_hash, action, created_at);
