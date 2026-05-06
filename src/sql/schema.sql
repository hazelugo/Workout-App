create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  program_adopted boolean not null default false,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  started_at timestamptz not null default now(),
  phase int not null check (phase between 1 and 3),
  week int not null check (week between 1 and 8),
  day_name text not null,
  track text not null check (track in ('home', 'gym')),
  completed_at timestamptz
);

create unique index one_active_session on public.workout_sessions (user_id)
  where completed_at is null;

create table public.set_logs (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.workout_sessions on delete cascade not null,
  exercise_name text not null,
  set_number int not null,
  reps_programmed int not null,
  reps_done int,
  weight_kg numeric,
  completed boolean not null default false
);

create table public.custom_days (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  day_name text not null,
  exercises jsonb not null default '[]',
  created_at timestamptz default now(),
  unique(user_id, day_name)
);

alter table public.profiles enable row level security;
alter table public.custom_days enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;

create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

create policy "custom_days: own rows" on public.custom_days
  for all using (auth.uid() = user_id);

create policy "sessions: own rows" on public.workout_sessions
  for all using (auth.uid() = user_id);

create policy "set_logs: own via session" on public.set_logs
  for all using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = set_logs.session_id
        and s.user_id = auth.uid()
    )
  );
