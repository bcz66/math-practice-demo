-- CalcDaily Account & Cloud Storage v1
-- 在 Supabase Dashboard -> SQL Editor 中完整执行一次。
-- 设计原则：
-- 1) Supabase Auth 负责账号与密码。
-- 2) user_state 保存可直接恢复的学习状态快照。
-- 3) normalized tables 保存未来分析/推荐需要的结构化数据。
-- 4) 所有 public 表启用 RLS，用户只能访问自己的 user_id。

begin;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  difficulty_mode text not null default 'adaptive',
  training_mode text not null default 'balanced',
  daily_count integer not null default 10,
  manual_levels jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_settings_daily_count_check
    check (daily_count between 1 and 50)
);

create table if not exists public.module_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  ability double precision not null default 6,
  display_level integer not null default 6,
  confidence double precision not null default 0.15,
  effective_attempts double precision not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, module),
  constraint module_progress_module_check
    check (module in ('limit', 'derivative', 'integral'))
);

create table if not exists public.topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  topic text not null,
  ability double precision not null default 6,
  attempts integer not null default 0,
  correct integer not null default 0,
  confidence double precision not null default 0.15,
  updated_at timestamptz not null default now(),
  primary key (user_id, module, topic),
  constraint topic_progress_module_check
    check (module in ('limit', 'derivative', 'integral'))
);

create table if not exists public.attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  question_id text,
  module text,
  topic text,
  purpose text,
  question_json jsonb not null default '{}'::jsonb,
  user_answer text,
  correct boolean,
  needs_manual_check boolean not null default false,
  counts_toward_stats boolean not null default true,
  error_type text,
  requested_difficulty double precision,
  provisional_difficulty double precision,
  calibrated_difficulty double precision,
  difficulty_model_version text,
  difficulty_confidence double precision,
  difficulty_dimensions jsonb,
  ability_before double precision,
  ability_after double precision,
  predicted_correct_probability double precision,
  learning_rate double precision,
  ability_weight double precision,
  topic_ability_before double precision,
  topic_ability_after double precision,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.review_queue (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  review_key text,
  module text not null,
  topic text not null,
  question_json jsonb not null default '{}'::jsonb,
  wrong_count integer not null default 0,
  correct_streak integer not null default 0,
  high_freq boolean not null default true,
  next_review_at date,
  provisional_difficulty double precision,
  calibrated_difficulty double precision,
  difficulty_model_version text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  primary key (user_id, checkin_date)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.user_settings enable row level security;
alter table public.module_progress enable row level security;
alter table public.topic_progress enable row level security;
alter table public.attempts enable row level security;
alter table public.review_queue enable row level security;
alter table public.checkins enable row level security;

-- Browser guest requests should not touch cloud learning tables.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_state from anon, authenticated;
revoke all on table public.user_settings from anon, authenticated;
revoke all on table public.module_progress from anon, authenticated;
revoke all on table public.topic_progress from anon, authenticated;
revoke all on table public.attempts from anon, authenticated;
revoke all on table public.review_queue from anon, authenticated;
revoke all on table public.checkins from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_state to authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.module_progress to authenticated;
grant select, insert, update, delete on table public.topic_progress to authenticated;
grant select, insert, update, delete on table public.attempts to authenticated;
grant select, insert, update, delete on table public.review_queue to authenticated;
grant select, insert, update, delete on table public.checkins to authenticated;

-- Helpful indexes for RLS/user-history queries.
create index if not exists attempts_user_created_idx
  on public.attempts (user_id, created_at desc);

create index if not exists review_queue_user_due_idx
  on public.review_queue (user_id, next_review_at);

create index if not exists topic_progress_user_module_idx
  on public.topic_progress (user_id, module);

-- Policies: each signed-in user can only operate on rows whose user_id is their own.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'user_state',
    'user_settings',
    'module_progress',
    'topic_progress',
    'attempts',
    'review_queue',
    'checkins'
  ]
  loop
    execute format(
      'drop policy if exists "calc_user_select" on public.%I',
      table_name
    );
    execute format(
      'drop policy if exists "calc_user_insert" on public.%I',
      table_name
    );
    execute format(
      'drop policy if exists "calc_user_update" on public.%I',
      table_name
    );
    execute format(
      'drop policy if exists "calc_user_delete" on public.%I',
      table_name
    );

    execute format(
      'create policy "calc_user_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name
    );

    execute format(
      'create policy "calc_user_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name
    );

    execute format(
      'create policy "calc_user_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name
    );

    execute format(
      'create policy "calc_user_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name
    );
  end loop;
end $$;

commit;
