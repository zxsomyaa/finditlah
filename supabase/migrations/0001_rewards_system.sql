-- ============================================================
-- FindItLah Rewards System
--
-- Run this once in the Supabase dashboard: Project > SQL Editor
-- > New query > paste this whole file > Run.
--
-- Safe to re-run: uses IF NOT EXISTS / DROP-then-CREATE guards.
-- ============================================================

-- 1. Extend profiles with rewards fields
alter table public.profiles
  add column if not exists points integer not null default 0,
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_referral_code_key'
  ) then
    alter table public.profiles
      add constraint profiles_referral_code_key unique (referral_code);
  end if;
end $$;

-- 2. Auto-generate a short referral code for every new profile
create or replace function public.set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_referral_code on public.profiles;
create trigger trg_set_referral_code
  before insert on public.profiles
  for each row execute function public.set_referral_code();

-- Backfill referral codes for any existing profiles
update public.profiles
set referral_code = substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 8)
where referral_code is null;

-- 3. Point events — audit log + idempotency guard so the same action
--    (e.g. resolving the same item twice) can never award points twice.
create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('post_found', 'report_lost', 'reunite', 'referral')),
  points integer not null,
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, action, ref_id)
);

alter table public.point_events enable row level security;

drop policy if exists "select own point events" on public.point_events;
create policy "select own point events"
  on public.point_events for select
  using (auth.uid() = user_id);

-- 4. award_points() — the ONLY way points get added for post/resolve
--    actions. Point values are fixed server-side so the client can't
--    fake amounts. Safe to call repeatedly for the same ref_id/action;
--    only the first call actually awards points.
create or replace function public.award_points(p_action text, p_ref_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  v_points := case p_action
    when 'post_found' then 20
    when 'report_lost' then 10
    when 'reunite' then 50
    else null
  end;

  if v_points is null then
    raise exception 'invalid action: %', p_action;
  end if;

  insert into public.point_events (user_id, action, points, ref_id)
  values (auth.uid(), p_action, v_points, p_ref_id)
  on conflict (user_id, action, ref_id) do nothing;

  if found then
    update public.profiles set points = points + v_points where id = auth.uid();
    return v_points;
  end if;

  return 0;
end;
$$;

-- 5. redeem_referral() — called by the NEW signee's own session right
--    after signup. Awards the REFERRER (not the caller), which is why
--    this needs security definer: the referrer isn't logged in here.
create or replace function public.redeem_referral(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
begin
  if p_code is null or p_code = '' then
    return;
  end if;

  select id into v_referrer_id
  from public.profiles
  where referral_code = p_code
    and id != auth.uid();

  if v_referrer_id is null then
    return;
  end if;

  update public.profiles
  set referred_by = v_referrer_id
  where id = auth.uid()
    and referred_by is null;

  insert into public.point_events (user_id, action, points, ref_id)
  values (v_referrer_id, 'referral', 20, auth.uid())
  on conflict (user_id, action, ref_id) do nothing;

  if found then
    update public.profiles set points = points + 20 where id = v_referrer_id;
  end if;
end;
$$;

-- 6. get_my_rewards() — one round trip for everything the Rewards page
--    needs. Founding-member rank and referral count are computed here
--    (server-side, bypassing RLS) since regular clients can only see
--    their own profile row.
create or replace function public.get_my_rewards()
returns table (
  points integer,
  referral_code text,
  is_founding_member boolean,
  referral_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.points,
    p.referral_code,
    (select count(*) from public.profiles p2 where p2.created_at <= p.created_at) <= 100 as is_founding_member,
    (select count(*)::integer from public.profiles r where r.referred_by = p.id) as referral_count
  from public.profiles p
  where p.id = auth.uid();
end;
$$;

grant execute on function public.award_points(text, uuid) to authenticated;
grant execute on function public.redeem_referral(text) to authenticated;
grant execute on function public.get_my_rewards() to authenticated;
