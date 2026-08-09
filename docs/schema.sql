-- ATS Engine — complete database schema (Supabase / Postgres).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent DDL).
-- No seed / demo rows: every row in this app is created by real users.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('employer', 'candidate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('Open','Draft','Closed','Paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_stage as enum ('Applied','Screening','Interview','Offer','Rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.app_role not null,
  full_name text,
  headline text,
  location text,
  years_exp int default 0,
  target_roles text[] default '{}',
  skills text[] default '{}',
  links jsonb default '[]'::jsonb,
  resume_text text,
  resume_json jsonb,
  onboarded boolean default false,
  created_at timestamptz default now()
);
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table if not exists public.jobs (
  id text primary key,
  employer_id uuid,
  title text not null,
  department text,
  location text,
  type text default 'Full-time',
  posted_at timestamptz default now(),
  status public.job_status default 'Open',
  applicants int default 0,
  new_count int default 0,
  match_avg int default 0,
  salary text,
  description text,
  tags text[] default '{}'
);
grant all on public.jobs to service_role;
grant select on public.jobs to anon;
alter table public.jobs enable row level security;
drop policy if exists "public read jobs" on public.jobs;
create policy "public read jobs" on public.jobs for select to anon using (true);

create table if not exists public.candidates (
  id text primary key,
  name text, title text, company text, location text,
  years int default 0, match_score int default 0,
  skills text[] default '{}', strengths text[] default '{}', gaps text[] default '{}',
  status text default 'New', applied_for text, ai_insight text,
  portfolio jsonb default '[]'::jsonb, initials text, email text
);
grant all on public.candidates to service_role;
alter table public.candidates enable row level security;

create table if not exists public.applications (
  id text primary key, candidate_id uuid, job_id text,
  job_title text, company text, logo text, applied_on text,
  stage public.application_stage default 'Applied',
  progress int default 0, match_score int default 0, next_step text
);
alter table public.applications add column if not exists job_id text;
grant all on public.applications to service_role;
alter table public.applications enable row level security;

create table if not exists public.job_matches (
  id text primary key, candidate_id uuid,
  title text, company text, location text, salary text,
  match_score int default 0, posted_ago text,
  skills text[] default '{}', reason text, logo text
);
grant all on public.job_matches to service_role;
alter table public.job_matches enable row level security;

create table if not exists public.notifications (
  id text primary key, user_id uuid,
  title text, time text, type text, created_at timestamptz default now()
);
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

create table if not exists public.skill_radar (
  candidate_id uuid, skill text, you int, target int,
  primary key (candidate_id, skill)
);
grant all on public.skill_radar to service_role;
alter table public.skill_radar enable row level security;

create table if not exists public.roadmap (
  id text primary key, candidate_id uuid,
  week text, title text, detail text, done boolean default false, ord int default 0
);
grant all on public.roadmap to service_role;
alter table public.roadmap enable row level security;

create table if not exists public.analytics_metrics (
  label text primary key, value text, delta text, positive boolean
);
grant all on public.analytics_metrics to service_role;
grant select on public.analytics_metrics to anon;
alter table public.analytics_metrics enable row level security;
drop policy if exists "public read analytics" on public.analytics_metrics;
create policy "public read analytics" on public.analytics_metrics for select to anon using (true);

create table if not exists public.funnel (stage text primary key, count int, ord int);
grant all on public.funnel to service_role;
alter table public.funnel enable row level security;

create table if not exists public.hiring_trend (
  month text primary key, hires int, applications int, ord int
);
grant all on public.hiring_trend to service_role;
alter table public.hiring_trend enable row level security;

create table if not exists public.assistant_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text default 'New chat',
  created_at timestamptz default now()
);
grant all on public.assistant_threads to service_role;
alter table public.assistant_threads enable row level security;

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.assistant_threads(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);
grant all on public.assistant_messages to service_role;
alter table public.assistant_messages enable row level security;

-- ---------------------------------------------------------------------------
-- Interviews + question bank (employer interviews page, candidate mock loop)
-- ---------------------------------------------------------------------------
create table if not exists public.interviews (
  id text primary key,
  candidate_name text,
  role text,
  type text,
  round text,
  scheduled_at timestamptz
);
alter table public.interviews enable row level security;
grant all on public.interviews to service_role;

create table if not exists public.interview_questions (
  id bigserial primary key,
  category text not null check (category in ('behavioral','technical','system')),
  question text not null,
  role text,
  ord int default 0
);
alter table public.interview_questions enable row level security;
grant all on public.interview_questions to service_role;

-- ---------------------------------------------------------------------------
-- Auto-apply agent (candidate)
-- ---------------------------------------------------------------------------
create table if not exists public.auto_apply_settings (
  user_id uuid primary key,
  enabled boolean not null default false,
  min_score int not null default 85,
  daily_limit int not null default 5,
  updated_at timestamptz default now()
);
alter table public.auto_apply_settings enable row level security;
grant all on public.auto_apply_settings to service_role;

create table if not exists public.auto_apply_log (
  id text primary key,
  user_id uuid not null,
  job_title text,
  company text,
  match_score int,
  status text not null default 'applied',
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists auto_apply_log_user_idx
  on public.auto_apply_log (user_id, created_at desc);
alter table public.auto_apply_log enable row level security;
grant all on public.auto_apply_log to service_role;

-- Auto-apply writes applications on behalf of a candidate.
alter table public.applications add column if not exists user_id uuid;

-- ---------------------------------------------------------------------------
-- Job Hunt agent (candidate) — replaces the older auto_apply_* tables
-- ---------------------------------------------------------------------------
create table if not exists public.job_hunt_settings (
  user_id uuid primary key,
  enabled boolean not null default false,
  mode text not null default 'review',          -- 'review' | 'auto'
  min_score int not null default 75,
  daily_limit int not null default 5,
  titles text[] not null default '{}',
  locations text[] not null default '{}',
  remote_only boolean not null default false,
  use_resume boolean not null default true,
  use_portfolio boolean not null default true,
  use_github boolean not null default true,
  github_url text default '',
  portfolio_url text default '',
  updated_at timestamptz default now()
);
alter table public.job_hunt_settings enable row level security;
grant all on public.job_hunt_settings to service_role;

create table if not exists public.job_hunt_proposals (
  id text primary key,
  user_id uuid not null,
  job_id text,
  job_title text,
  company text,
  location text,
  match_score int,
  reason text,
  status text not null default 'pending',        -- pending | applied | denied
  created_at timestamptz not null default now()
);
create index if not exists job_hunt_proposals_user_idx
  on public.job_hunt_proposals (user_id, status, match_score desc);
alter table public.job_hunt_proposals enable row level security;
grant all on public.job_hunt_proposals to service_role;

create table if not exists public.job_hunt_log (
  id text primary key,
  user_id uuid not null,
  job_title text,
  company text,
  match_score int,
  status text not null default 'applied',        -- applied | denied | skipped
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists job_hunt_log_user_idx
  on public.job_hunt_log (user_id, created_at desc);
alter table public.job_hunt_log enable row level security;
grant all on public.job_hunt_log to service_role;

-- ---------------------------------------------------------------------------
-- Backfill for existing installs
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

-- ---------------------------------------------------------------------------
-- Access model
-- ---------------------------------------------------------------------------
-- The app never talks to PostgREST from the browser. Every read/write goes
-- through TanStack server functions using the service-role key, so RLS stays
-- ON with no permissive policies except the two public ones above
-- (jobs + analytics_metrics, used by the public careers / share pages).
--
-- If you later expose tables directly to the browser, add per-user policies:
--   create policy "own rows" on public.applications
--     for all to authenticated using (user_id = auth.uid())
--     with check (user_id = auth.uid());
-- and grant select/insert/update/delete on that table to authenticated.
