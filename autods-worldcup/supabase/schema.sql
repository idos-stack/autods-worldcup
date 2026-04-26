-- ─────────────────────────────────────────────────────────────────────────────
-- AutoDS WorldCup 2026 — Supabase Schema
-- Run this in your Supabase project → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  email         text not null unique,
  full_name     text,
  nickname      text,
  home_country  text,   -- ISO 3166-1 alpha-2 country code, e.g. "IL"
  home_country_name text,
  is_admin      boolean not null default false,
  is_active     boolean not null default true,  -- false = removed from competition
  score_override integer,  -- if set, used instead of calculated score
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── MATCHES ─────────────────────────────────────────────────────────────────
create table public.matches (
  id              uuid primary key default uuid_generate_v4(),
  external_id     integer unique,        -- football-data.org match ID
  stage           text not null,         -- 'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'
  group_name      text,                  -- 'A'–'L' for group stage, null for knockout
  home_team_code  text,                  -- ISO 3166-1 alpha-2 or FIFA code
  home_team_name  text,
  away_team_code  text,
  away_team_name  text,
  kickoff_time    timestamptz not null,
  status          text not null default 'SCHEDULED',  -- 'SCHEDULED','LIVE','FINISHED','TIMED'
  home_score      integer,               -- full-time score
  away_score      integer,
  home_score_et   integer,               -- after extra time
  away_score_et   integer,
  winner_code     text,                  -- team code of the side that advanced (knockout only)
  matchday        integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── PREDICTIONS ─────────────────────────────────────────────────────────────
create table public.predictions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  match_id            uuid not null references public.matches(id) on delete cascade,
  predicted_home      integer,
  predicted_away      integer,
  predicted_winner    text,  -- team code (knockout only — who advances)
  points_outcome      integer default 0,
  points_exact        integer default 0,
  points_progression  integer default 0,
  points_total        integer default 0,
  scored              boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(user_id, match_id)
);

-- ─── WILDCARD QUESTIONS ──────────────────────────────────────────────────────
create table public.wildcard_questions (
  id          serial primary key,
  question    text not null,
  answer_type text not null,  -- 'COUNTRY', 'PLAYER_SCORER', 'PLAYER_ASSISTER', 'GROUP'
  sort_order  integer not null default 0
);

-- ─── WILDCARD ANSWERS ────────────────────────────────────────────────────────
create table public.wildcard_answers (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  question_id   integer not null references public.wildcard_questions(id) on delete cascade,
  answer        text,   -- country code, player name, group letter, or 'OTHER'
  answer_label  text,   -- human-readable label
  points        integer not null default 0,
  scored        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, question_id)
);

-- ─── WILDCARD CORRECT ANSWERS ────────────────────────────────────────────────
-- Populated automatically after the Final via sync
create table public.wildcard_results (
  question_id   integer primary key references public.wildcard_questions(id),
  correct_value text,   -- the canonical correct answer (or 'OTHER' if outside list)
  correct_label text,
  confirmed     boolean not null default false,
  confirmed_at  timestamptz
);

-- ─── LEADERBOARD SNAPSHOT ────────────────────────────────────────────────────
-- Updated every 15 minutes by the sync job
create table public.leaderboard_snapshots (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  rank          integer not null,
  prev_rank     integer,
  total_score   integer not null default 0,
  score_24h     integer not null default 0,
  snapshot_at   timestamptz not null default now()
);

-- ─── SYNC LOG ────────────────────────────────────────────────────────────────
create table public.sync_log (
  id          serial primary key,
  synced_at   timestamptz not null default now(),
  matches_updated integer default 0,
  predictions_scored integer default 0,
  status      text,
  error       text
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

-- profiles: users can read all, but only update their own
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- matches: everyone can read
alter table public.matches enable row level security;
create policy "matches_select" on public.matches for select using (true);

-- predictions: users can read all, insert/update only their own
alter table public.predictions enable row level security;
create policy "predictions_select" on public.predictions for select using (true);
create policy "predictions_insert" on public.predictions for insert with check (auth.uid() = user_id);
create policy "predictions_update" on public.predictions for update using (auth.uid() = user_id);

-- wildcard_questions/results: everyone can read
alter table public.wildcard_questions enable row level security;
create policy "wq_select" on public.wildcard_questions for select using (true);
alter table public.wildcard_results enable row level security;
create policy "wr_select" on public.wildcard_results for select using (true);

-- wildcard_answers: users can read all, insert/update only their own
alter table public.wildcard_answers enable row level security;
create policy "wa_select" on public.wildcard_answers for select using (true);
create policy "wa_insert" on public.wildcard_answers for insert with check (auth.uid() = user_id);
create policy "wa_update" on public.wildcard_answers for update using (auth.uid() = user_id);

-- leaderboard: everyone can read
alter table public.leaderboard_snapshots enable row level security;
create policy "lb_select" on public.leaderboard_snapshots for select using (true);

-- ─── SEED: WILDCARD QUESTIONS ────────────────────────────────────────────────
insert into public.wildcard_questions (id, question, answer_type, sort_order) values
(1, 'Which nation will WIN the World Cup?',                                  'COUNTRY',          1),
(2, 'Which nation will reach the Final but NOT lift the trophy? (runner-up)','COUNTRY',          2),
(3, 'Who will win the Golden Boot (Top Scorer)?',                            'PLAYER_SCORER',    3),
(4, 'Who will be the tournament''s Top Assister?',                           'PLAYER_ASSISTER',  4),
(5, 'Which group will have the highest goal tally?',                         'GROUP',            5),
(6, 'Which group will have the lowest goal tally?',                          'GROUP',            6),
(7, 'Which nation will finish as top scorer across the tournament?',         'COUNTRY',          7),
(8, 'Which nation will concede the most goals across the tournament?',       'COUNTRY',          8),
(9, 'Which nation will accumulate the most red cards?',                      'COUNTRY',          9);
