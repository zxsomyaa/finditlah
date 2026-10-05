-- ============================================================
-- FindItLah: Thrift marketplace + public browsing
--
-- Run once in the Supabase dashboard: SQL Editor > New query >
-- paste this whole file > Run. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Let anyone (even logged out) browse active Lost & Found posts
-- ------------------------------------------------------------
drop policy if exists "Anyone can view active items" on public.items;
create policy "Anyone can view active items"
  on public.items for select
  to anon, authenticated
  using (status = 'active');

-- ------------------------------------------------------------
-- 2. Thrift listings (clothes and small items)
-- ------------------------------------------------------------
create table if not exists public.thrift_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  seller_name text,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  category text not null default 'others'
    check (category in ('tops','bottoms','dresses','outerwear','shoes','bags','accessories','books','gadgets','others')),
  price numeric(10,2) not null check (price > 0 and price <= 5000),
  condition text not null default 'good' check (condition in ('like_new','good','fair')),
  size text not null default '',
  location_name text not null default '',
  image_url text not null default '',
  status text not null default 'active' check (status in ('active','reserved','sold','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists thrift_listings_status_created_idx on public.thrift_listings (status, created_at desc);
create index if not exists thrift_listings_user_idx on public.thrift_listings (user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_thrift_listings_updated on public.thrift_listings;
create trigger trg_thrift_listings_updated
  before update on public.thrift_listings
  for each row execute function public.touch_updated_at();

alter table public.thrift_listings enable row level security;

drop policy if exists "Anyone can view listings" on public.thrift_listings;
create policy "Anyone can view listings"
  on public.thrift_listings for select
  to anon, authenticated
  using (status in ('active','reserved','sold') or user_id = auth.uid());

drop policy if exists "Sellers create their own listings" on public.thrift_listings;
create policy "Sellers create their own listings"
  on public.thrift_listings for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'active');

-- Sellers can edit, mark sold or remove their listings, but not while a paid
-- order is holding it ('reserved' is only set by the payment webhook).
drop policy if exists "Sellers update their own listings" on public.thrift_listings;
create policy "Sellers update their own listings"
  on public.thrift_listings for update
  to authenticated
  using (user_id = auth.uid() and status <> 'reserved')
  with check (user_id = auth.uid() and status in ('active','sold','removed'));

-- ------------------------------------------------------------
-- 3. Orders (created and updated only by the payment functions)
-- ------------------------------------------------------------
create table if not exists public.thrift_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.thrift_listings(id),
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  amount numeric(10,2) not null,
  currency text not null default 'sgd',
  delivery text not null default 'meetup' check (delivery in ('meetup','mail')),
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','received','cancelled','refunded')),
  payout_status text not null default 'not_due' check (payout_status in ('not_due','pending','paid_out')),
  stripe_session_id text unique,
  stripe_payment_intent text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  received_at timestamptz,
  paid_out_at timestamptz
);

create index if not exists thrift_orders_buyer_idx on public.thrift_orders (buyer_id, created_at desc);
create index if not exists thrift_orders_seller_idx on public.thrift_orders (seller_id, created_at desc);

alter table public.thrift_orders enable row level security;

drop policy if exists "Buyers and sellers see their orders" on public.thrift_orders;
create policy "Buyers and sellers see their orders"
  on public.thrift_orders for select
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
-- No insert/update policies on purpose: the Edge Functions use the service role.

-- Buyer confirms they received the item -> listing sold, seller payout due.
create or replace function public.confirm_order_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing uuid;
begin
  update public.thrift_orders
     set status = 'received', received_at = now(), payout_status = 'pending'
   where id = p_order_id and buyer_id = auth.uid() and status = 'paid'
  returning listing_id into v_listing;

  if v_listing is null then
    raise exception 'Order not found, or it is not paid yet';
  end if;

  update public.thrift_listings set status = 'sold' where id = v_listing;
end;
$$;

revoke all on function public.confirm_order_received(uuid) from public, anon;
grant execute on function public.confirm_order_received(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. Chats can be about a thrift listing as well as a Lost & Found item
-- ------------------------------------------------------------
alter table public.conversations
  add column if not exists listing_id uuid references public.thrift_listings(id) on delete set null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations'
      and column_name = 'item_id' and is_nullable = 'NO'
  ) then
    alter table public.conversations alter column item_id drop not null;
  end if;
end $$;

create index if not exists conversations_listing_idx on public.conversations (listing_id);
