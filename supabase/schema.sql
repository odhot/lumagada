-- Lumagada production baseline for a multi-tenant marketplace.
-- Designed for Supabase/Postgres and tens of thousands of users/listings.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pengguna Lumagada',
  phone text,
  city text,
  district text,
  avatar_url text,
  verified boolean not null default false,
  seller_type text not null default 'regular' check(seller_type in ('regular','pro')),
  seller_verified boolean not null default false,
  seller_document_type text,
  seller_document_number text,
  seller_business_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  title text not null,
  description text not null default '',
  price bigint not null check(price >= 0),
  condition text not null default 'Bekas',
  city text not null,
  district text,
  latitude double precision,
  longitude double precision,
  contact_phone text,
  status text not null default 'active' check(status in ('active','expired','sold','hidden')),
  urgent boolean not null default false,
  is_pro_listing boolean not null default false,
  accepts_offers boolean not null default true,
  expires_at timestamptz not null default (now() + interval '14 days'),
  last_reup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'') || ' ' || coalesce(district,''))
  ) stored
);

create table if not exists listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, listing_id)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(buyer_id, seller_id, listing_id),
  check(buyer_id <> seller_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check(length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  amount bigint not null check(amount >= 0),
  message text not null default '' check(length(message) <= 2000),
  status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete set null,
  reporter_id uuid references profiles(id) on delete set null,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete set null,
  buyer_id uuid references profiles(id) on delete set null,
  seller_id uuid references profiles(id) on delete set null,
  amount bigint not null check(amount >= 0),
  platform_fee bigint not null default 0 check(platform_fee >= 0),
  status text not null default 'recorded' check(status in ('recorded','cancelled','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists sponsor_reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  reward_days int not null default 1 check(reward_days = 1),
  watched_seconds int not null check(watched_seconds >= 30),
  created_at timestamptz not null default now(),
  unique(user_id, listing_id, (date_trunc('day', created_at)))
);

-- Safe upgrades for databases that already contain the original Lumagada schema.
alter table profiles add column if not exists updated_at timestamptz not null default now();
alter table listings add column if not exists latitude double precision;
alter table listings add column if not exists longitude double precision;
alter table listings add column if not exists contact_phone text;
alter table listings add column if not exists accepts_offers boolean not null default true;
alter table listings add column if not exists updated_at timestamptz not null default now();
alter table listings add column if not exists search_vector tsvector generated always as (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'') || ' ' || coalesce(district,''))) stored;

insert into categories(name,slug,icon) values
('Mobil','mobil','🚗'),('Motor','motor','🏍️'),('Properti','properti','🏠'),('Elektronik','elektronik','📱'),
('Jasa & Lowongan','jasa','💼'),('Fashion','fashion','👕'),('Rumah & Perabot','rumah','🪑'),('Hobi & Koleksi','hobi','🎮'),
('Hewan','hewan','🐱'),('Buku','buku','📚'),('Bisnis','bisnis','🏪'),('Lainnya','lainnya','📦')
on conflict do nothing;

create index if not exists listings_active_created_idx on listings(status, created_at desc, id desc);
create index if not exists listings_seller_idx on listings(seller_id, created_at desc);
create index if not exists listings_category_idx on listings(category_id, created_at desc);
create index if not exists listings_city_idx on listings(city, created_at desc);
create index if not exists listings_expiry_idx on listings(expires_at) where status = 'active' and is_pro_listing = false;
create index if not exists listings_search_idx on listings using gin(search_vector);
create index if not exists listings_title_trgm_idx on listings using gin(title gin_trgm_ops);
create index if not exists listing_images_listing_idx on listing_images(listing_id, sort_order);
create index if not exists messages_conversation_idx on messages(conversation_id, created_at asc);
create index if not exists offers_seller_idx on offers(seller_id, status, created_at desc);
create index if not exists offers_buyer_idx on offers(buyer_id, created_at desc);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc) where read_at is null;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();
drop trigger if exists listings_updated_at on listings;
create trigger listings_updated_at before update on listings for each row execute function set_updated_at();
drop trigger if exists offers_updated_at on offers;
create trigger offers_updated_at before update on offers for each row execute function set_updated_at();

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Pengguna Lumagada'), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function expire_regular_listings() returns integer language plpgsql security definer set search_path = public as $$
declare changed integer;
begin
  update listings set status='expired'
  where status='active' and is_pro_listing=false and expires_at <= now();
  get diagnostics changed = row_count;
  return changed;
end; $$;

create or replace function reup_listing(p_listing_id uuid) returns listings language plpgsql security invoker as $$
declare result listings;
begin
  update listings set status='active', expires_at=greatest(now(), expires_at)+interval '14 days', last_reup_at=now()
  where id=p_listing_id and seller_id=auth.uid() and is_pro_listing=false
  returning * into result;
  return result;
end; $$;

create or replace function nearby_listings(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 25,
  p_limit int default 24,
  p_offset int default 0
) returns table(
  id uuid, title text, price bigint, city text, district text, latitude double precision, longitude double precision,
  condition text, accepts_offers boolean, is_pro_listing boolean, distance_km double precision
) language sql stable as $$
  select l.id,l.title,l.price,l.city,l.district,l.latitude,l.longitude,l.condition,l.accepts_offers,l.is_pro_listing,
    6371 * acos(least(1,greatest(-1,
      cos(radians(p_lat))*cos(radians(l.latitude))*cos(radians(l.longitude)-radians(p_lng)) + sin(radians(p_lat))*sin(radians(l.latitude))
    )))) as distance_km
  from listings l
  where l.status='active' and (l.is_pro_listing=true or l.expires_at > now()) and l.latitude is not null and l.longitude is not null
  and 6371 * acos(least(1,greatest(-1,
      cos(radians(p_lat))*cos(radians(l.latitude))*cos(radians(l.longitude)-radians(p_lng)) + sin(radians(p_lat))*sin(radians(l.latitude))
  ))) <= greatest(1,p_radius_km)
  order by distance_km asc, l.created_at desc, l.id desc
  limit least(greatest(p_limit,1),100) offset greatest(p_offset,0);
$$;

-- Fee policy stays private/configurable; the public UI must not expose a percentage.
create or replace function calculate_platform_fee(p_amount bigint) returns bigint language sql immutable as $$
  select case when p_amount > 1000000 then 0 else 0 end;
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table listings enable row level security;
alter table listing_images enable row level security;
alter table favorites enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table offers enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;
alter table transactions enable row level security;
alter table sponsor_reward_events enable row level security;

drop policy if exists "public read active listings" on listings;
create policy "public read active listings" on listings for select using((status='active' and (expires_at > now() or is_pro_listing=true)) or seller_id=auth.uid());
drop policy if exists "seller insert listings" on listings;
create policy "seller insert listings" on listings for insert with check(seller_id=auth.uid() and (condition <> 'Lowongan' or accepts_offers=false));
drop policy if exists "seller update listings" on listings;
create policy "seller update listings" on listings for update using(seller_id=auth.uid()) with check(seller_id=auth.uid() and (condition <> 'Lowongan' or accepts_offers=false));
drop policy if exists "seller delete listings" on listings;
create policy "seller delete listings" on listings for delete using(seller_id=auth.uid());

drop policy if exists "public read categories" on categories; create policy "public read categories" on categories for select using(true);
drop policy if exists "public read listing images" on listing_images; create policy "public read listing images" on listing_images for select using(true);
drop policy if exists "owners manage images" on listing_images; create policy "owners manage images" on listing_images for all using(exists(select 1 from listings l where l.id=listing_id and l.seller_id=auth.uid())) with check(exists(select 1 from listings l where l.id=listing_id and l.seller_id=auth.uid()));

drop policy if exists "users manage own favorites" on favorites; create policy "users manage own favorites" on favorites for all using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "participants read conversations" on conversations; create policy "participants read conversations" on conversations for select using(buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists "buyers create conversations" on conversations; create policy "buyers create conversations" on conversations for insert with check(buyer_id=auth.uid() and exists(select 1 from listings l where l.id=listing_id and l.seller_id=seller_id));
drop policy if exists "participants update conversations" on conversations; create policy "participants update conversations" on conversations for update using(buyer_id=auth.uid() or seller_id=auth.uid());

drop policy if exists "participants read messages" on messages; create policy "participants read messages" on messages for select using(exists(select 1 from conversations c where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())));
drop policy if exists "participants send messages" on messages; create policy "participants send messages" on messages for insert with check(sender_id=auth.uid() and exists(select 1 from conversations c where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())));

drop policy if exists "participants read offers" on offers; create policy "participants read offers" on offers for select using(buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists "buyers create offers" on offers; create policy "buyers create offers" on offers for insert with check(buyer_id=auth.uid() and exists(select 1 from listings l where l.id=listing_id and l.seller_id=seller_id and l.status='active' and l.condition <> 'Lowongan' and l.accepts_offers=true));
drop policy if exists "participants update offers" on offers; create policy "participants update offers" on offers for update using(buyer_id=auth.uid() or seller_id=auth.uid()) with check(buyer_id=auth.uid() or seller_id=auth.uid());

drop policy if exists "users create reports" on reports; create policy "users create reports" on reports for insert with check(reporter_id=auth.uid());
drop policy if exists "users read own reports" on reports; create policy "users read own reports" on reports for select using(reporter_id=auth.uid());

drop policy if exists "users read own notifications" on notifications; create policy "users read own notifications" on notifications for select using(user_id=auth.uid());
drop policy if exists "users update own notifications" on notifications; create policy "users update own notifications" on notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists "users read own transactions" on transactions; create policy "users read own transactions" on transactions for select using(buyer_id=auth.uid() or seller_id=auth.uid());

drop policy if exists "users read own reward events" on sponsor_reward_events; create policy "users read own reward events" on sponsor_reward_events for select using(user_id=auth.uid());

-- Storage bucket for listing photos. Create it once; uploads are restricted to authenticated users.
insert into storage.buckets(id,name,public) values ('listing-images','listing-images',true) on conflict (id) do update set public=true;
drop policy if exists "public listing image read" on storage.objects;
create policy "public listing image read" on storage.objects for select using(bucket_id='listing-images');
drop policy if exists "authenticated listing image upload" on storage.objects;
create policy "authenticated listing image upload" on storage.objects for insert to authenticated with check(bucket_id='listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners listing image update" on storage.objects;
create policy "owners listing image update" on storage.objects for update to authenticated using(bucket_id='listing-images' and (storage.foldername(name))[1] = auth.uid()::text) with check(bucket_id='listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners listing image delete" on storage.objects;
create policy "owners listing image delete" on storage.objects for delete to authenticated using(bucket_id='listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime for conversations/messages/notifications in Supabase dashboard if desired.
