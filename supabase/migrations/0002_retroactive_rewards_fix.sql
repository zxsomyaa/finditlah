-- ============================================================
-- FindItLah Rewards — retroactive fix
--
-- Run this once, after 0001_rewards_system.sql, in the Supabase
-- SQL Editor. Safe to re-run.
--
-- 1. Force-regenerates any still-missing referral codes.
-- 2. Backfills points for items posted/resolved BEFORE the
--    rewards system existed, so past activity isn't stuck at 0.
-- ============================================================

-- 1. Re-backfill any referral codes that are still null
update public.profiles
set referral_code = substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 8)
where referral_code is null;

-- 2. Retroactively log point events for existing items
insert into public.point_events (user_id, action, points, ref_id)
select user_id, 'post_found', 20, id
from public.items
where type = 'found' and user_id is not null
on conflict (user_id, action, ref_id) do nothing;

insert into public.point_events (user_id, action, points, ref_id)
select user_id, 'report_lost', 10, id
from public.items
where type = 'lost' and user_id is not null
on conflict (user_id, action, ref_id) do nothing;

insert into public.point_events (user_id, action, points, ref_id)
select user_id, 'reunite', 50, id
from public.items
where status = 'resolved' and user_id is not null
on conflict (user_id, action, ref_id) do nothing;

-- Recalculate points totals from the point_events ledger (the
-- source of truth), rather than incrementing blindly — this makes
-- the whole script idempotent, safe to run more than once.
update public.profiles p
set points = coalesce((
  select sum(points) from public.point_events pe where pe.user_id = p.id
), 0);
