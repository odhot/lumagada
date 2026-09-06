-- Lumagada production Supabase schema
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Pengguna Lumagada', phone text, city text, district text, avatar_url text,
 verified boolean not null default false,
 seller_type text not null default 'regular' check(seller_type in('regular','pro')),
 seller_verified boolean not null default false, seller_document_type text, seller_document_number text, seller_business_name text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists categories(id uuid primary key default gen_random_uuid(),name text unique not null,slug text unique not null,icon text,created_at timestamptz not null default now());
create table if not exists listings(
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references profiles(id) on delete cascade,
 category_id uuid references categories(id), title text not null, description text not null default '', price bigint not null check(price>=0),
 condition text not null default 'Bekas', city text not null, district text, latitude double precision, longitude double precision,
 contact_phone text, status text not null default 'active' check(status in('active','expired','sold','hidden')),
 urgent boolean not null default false, is_pro_listing boolean not null default false,
 accepts_offers boolean not null default true,
 expires_at timestamptz not null default(now()+interval '14 days'), last_reup_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 search_vector tsvector generated always as(to_tsvector('simple',coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(city,'')||' '||coalesce(district,''))) stored
);
create table if not exists listing_images(id uuid primary key default gen_random_uuid(),listing_id uuid not null references listings(id) on delete cascade,url text not null,sort_order int not null default 0,created_at timestamptz not null default now());
create table if not exists favorites(user_id uuid not null references profiles(id) on delete cascade,listing_id uuid not null references listings(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,listing_id));
create table if not exists conversations(id uuid primary key default gen_random_uuid(),buyer_id uuid not null references profiles(id) on delete cascade,seller_id uuid not null references profiles(id) on delete cascade,listing_id uuid not null references listings(id) on delete cascade,created_at timestamptz not null default now(),unique(buyer_id,seller_id,listing_id),check(buyer_id<>seller_id));
create table if not exists messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references conversations(id) on delete cascade,sender_id uuid not null references profiles(id) on delete cascade,body text not null check(length(trim(body)) between 1 and 4000),created_at timestamptz not null default now());
create table if not exists offers(id uuid primary key default gen_random_uuid(),listing_id uuid not null references listings(id) on delete cascade,buyer_id uuid not null references profiles(id) on delete cascade,seller_id uuid not null references profiles(id) on delete cascade,amount bigint not null check(amount>=0),message text not null default '' check(length(message)<=2000),status text not null default 'pending' check(status in('pending','accepted','rejected','withdrawn','expired')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists reports(id uuid primary key default gen_random_uuid(),listing_id uuid references listings(id) on delete set null,reporter_id uuid references profiles(id) on delete set null,reason text not null,details text not null default '',status text not null default 'open' check(status in('open','reviewing','resolved','dismissed')),created_at timestamptz not null default now());
create table if not exists notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles(id) on delete cascade,type text not null,title text not null,body text not null default '',data jsonb not null default '{}'::jsonb,read_at timestamptz,created_at timestamptz not null default now());
create table if not exists transactions(id uuid primary key default gen_random_uuid(),listing_id uuid references listings(id) on delete set null,buyer_id uuid references profiles(id) on delete set null,seller_id uuid references profiles(id) on delete set null,amount bigint not null check(amount>=0),platform_fee bigint not null default 0 check(platform_fee>=0),status text not null default 'recorded' check(status in('recorded','cancelled','refunded')),created_at timestamptz not null default now());
create table if not exists sponsor_reward_events(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles(id) on delete cascade,listing_id uuid not null references listings(id) on delete cascade,reward_days int not null default 1 check(reward_days=1),watched_seconds int not null check(watched_seconds>=30),reward_day date not null default current_date,created_at timestamptz not null default now());

alter table profiles add column if not exists updated_at timestamptz not null default now();
alter table listings add column if not exists latitude double precision;
alter table listings add column if not exists longitude double precision;
alter table listings add column if not exists contact_phone text;
alter table listings add column if not exists accepts_offers boolean not null default true;
alter table listings add column if not exists updated_at timestamptz not null default now();
alter table sponsor_reward_events add column if not exists reward_day date;
update sponsor_reward_events set reward_day=(created_at at time zone 'utc')::date where reward_day is null;
alter table sponsor_reward_events alter column reward_day set default current_date;
alter table sponsor_reward_events alter column reward_day set not null;

insert into categories(name,slug,icon) values
('Mobil','mobil','🚗'),('Motor','motor','🏍️'),('Properti','properti','🏠'),('Elektronik','elektronik','📱'),('Jasa & Lowongan','jasa','💼'),('Fashion','fashion','👕'),('Rumah & Perabot','rumah','🪑'),('Hobi & Koleksi','hobi','🎮'),('Hewan','hewan','🐱'),('Buku','buku','📚'),('Bisnis','bisnis','🏪'),('Lainnya','lainnya','📦')
on conflict do nothing;

create index if not exists listings_active_idx on listings(status,created_at desc,id desc);
create index if not exists listings_seller_idx on listings(seller_id,created_at desc);
create index if not exists listings_category_idx on listings(category_id,created_at desc);
create index if not exists listings_city_idx on listings(city,created_at desc);
create index if not exists listings_expiry_idx on listings(expires_at) where status='active' and is_pro_listing=false;
create index if not exists listings_search_idx on listings using gin(search_vector);
create index if not exists listings_title_idx on listings using gin(title gin_trgm_ops);
create index if not exists listing_images_idx on listing_images(listing_id,sort_order);
create index if not exists messages_idx on messages(conversation_id,created_at);
create index if not exists offers_seller_idx on offers(seller_id,status,created_at desc);
create index if not exists offers_buyer_idx on offers(buyer_id,created_at desc);
create index if not exists notifications_idx on notifications(user_id,created_at desc) where read_at is null;
create unique index if not exists sponsor_reward_daily_idx on sponsor_reward_events(user_id,listing_id,reward_day);

create or replace function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists profiles_updated_at on profiles; create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();
drop trigger if exists listings_updated_at on listings; create trigger listings_updated_at before update on listings for each row execute function set_updated_at();
drop trigger if exists offers_updated_at on offers; create trigger offers_updated_at before update on offers for each row execute function set_updated_at();

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,display_name,phone) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Pengguna Lumagada'),new.raw_user_meta_data->>'phone') on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function expire_regular_listings() returns integer language plpgsql security definer set search_path=public as $$ declare n integer; begin update listings set status='expired' where status='active' and is_pro_listing=false and expires_at<=now(); get diagnostics n=row_count; return n; end; $$;
create or replace function reup_listing(p_listing_id uuid) returns listings language plpgsql security invoker as $$ declare r listings; begin update listings set status='active',expires_at=greatest(now(),expires_at)+interval '14 days',last_reup_at=now() where id=p_listing_id and seller_id=auth.uid() and is_pro_listing=false returning * into r; return r; end; $$;
create or replace function nearby_listings(p_lat double precision,p_lng double precision,p_radius_km double precision default 25,p_limit int default 24,p_offset int default 0) returns table(id uuid,title text,price bigint,city text,district text,latitude double precision,longitude double precision,condition text,accepts_offers boolean,is_pro_listing boolean,distance_km double precision) language sql stable as $$ select l.id,l.title,l.price,l.city,l.district,l.latitude,l.longitude,l.condition,l.accepts_offers,l.is_pro_listing,6371*acos(least(1,greatest(-1,cos(radians(p_lat))*cos(radians(l.latitude))*cos(radians(l.longitude)-radians(p_lng))+sin(radians(p_lat))*sin(radians(l.latitude))))) distance_km from listings l where l.status='active' and(l.is_pro_listing or l.expires_at>now()) and l.latitude is not null and l.longitude is not null and 6371*acos(least(1,greatest(-1,cos(radians(p_lat))*cos(radians(l.latitude))*cos(radians(l.longitude)-radians(p_lng))+sin(radians(p_lat))*sin(radians(l.latitude)))))<=greatest(1,p_radius_km) order by distance_km,l.created_at desc,l.id desc limit least(greatest(p_limit,1),100) offset greatest(p_offset,0); $$;

alter table profiles enable row level security; alter table categories enable row level security; alter table listings enable row level security; alter table listing_images enable row level security; alter table favorites enable row level security; alter table conversations enable row level security; alter table messages enable row level security; alter table offers enable row level security; alter table reports enable row level security; alter table notifications enable row level security; alter table transactions enable row level security; alter table sponsor_reward_events enable row level security;

drop policy if exists "profiles own read" on profiles; create policy "profiles own read" on profiles for select using(id=auth.uid());
drop policy if exists "profiles own update" on profiles; create policy "profiles own update" on profiles for update using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists "categories public read" on categories; create policy "categories public read" on categories for select using(true);
drop policy if exists "listings public read" on listings; create policy "listings public read" on listings for select using((status='active' and(expires_at>now() or is_pro_listing)) or seller_id=auth.uid());
drop policy if exists "listings seller insert" on listings; create policy "listings seller insert" on listings for insert with check(seller_id=auth.uid() and(condition<>'Lowongan' or accepts_offers=false));
drop policy if exists "listings seller update" on listings; create policy "listings seller update" on listings for update using(seller_id=auth.uid()) with check(seller_id=auth.uid() and(condition<>'Lowongan' or accepts_offers=false));
drop policy if exists "listings seller delete" on listings; create policy "listings seller delete" on listings for delete using(seller_id=auth.uid());
drop policy if exists "images public read" on listing_images; create policy "images public read" on listing_images for select using(true);
drop policy if exists "images owner manage" on listing_images; create policy "images owner manage" on listing_images for all using(exists(select 1 from listings l where l.id=listing_id and l.seller_id=auth.uid())) with check(exists(select 1 from listings l where l.id=listing_id and l.seller_id=auth.uid()));
drop policy if exists "favorites own" on favorites; create policy "favorites own" on favorites for all using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "conversations participants" on conversations; create policy "conversations participants" on conversations for select using(buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists "conversations create" on conversations; create policy "conversations create" on conversations for insert with check(buyer_id=auth.uid() and exists(select 1 from listings l where l.id=listing_id and l.seller_id=seller_id and l.status='active'));
drop policy if exists "messages participants read" on messages; create policy "messages participants read" on messages for select using(exists(select 1 from conversations c where c.id=conversation_id and(c.buyer_id=auth.uid() or c.seller_id=auth.uid())));
drop policy if exists "messages participants send" on messages; create policy "messages participants send" on messages for insert with check(sender_id=auth.uid() and exists(select 1 from conversations c where c.id=conversation_id and(c.buyer_id=auth.uid() or c.seller_id=auth.uid())));
drop policy if exists "offers participants read" on offers; create policy "offers participants read" on offers for select using(buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists "offers buyer create" on offers; create policy "offers buyer create" on offers for insert with check(buyer_id=auth.uid() and exists(select 1 from listings l where l.id=listing_id and l.seller_id=seller_id and l.status='active' and l.condition<>'Lowongan' and l.accepts_offers=true));
drop policy if exists "offers participants update" on offers; create policy "offers participants update" on offers for update using(seller_id=auth.uid()) with check(seller_id=auth.uid());
drop policy if exists "offers buyer withdraw" on offers; create policy "offers buyer withdraw" on offers for update using(buyer_id=auth.uid() and status='pending') with check(buyer_id=auth.uid() and status='withdrawn');
drop policy if exists "reports create" on reports; create policy "reports create" on reports for insert with check(reporter_id=auth.uid());
drop policy if exists "reports own read" on reports; create policy "reports own read" on reports for select using(reporter_id=auth.uid());
drop policy if exists "notifications own read" on notifications; create policy "notifications own read" on notifications for select using(user_id=auth.uid());
drop policy if exists "notifications own update" on notifications; create policy "notifications own update" on notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "transactions participants read" on transactions; create policy "transactions participants read" on transactions for select using(buyer_id=auth.uid() or seller_id=auth.uid());
drop policy if exists "rewards own read" on sponsor_reward_events; create policy "rewards own read" on sponsor_reward_events for select using(user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('listing-images','listing-images',true,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "listing photos public read" on storage.objects; create policy "listing photos public read" on storage.objects for select using(bucket_id='listing-images');
drop policy if exists "listing photos authenticated upload" on storage.objects; create policy "listing photos authenticated upload" on storage.objects for insert to authenticated with check(bucket_id='listing-images' and(storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "listing photos owner update" on storage.objects; create policy "listing photos owner update" on storage.objects for update to authenticated using(bucket_id='listing-images' and(storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='listing-images' and(storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "listing photos owner delete" on storage.objects; create policy "listing photos owner delete" on storage.objects for delete to authenticated using(bucket_id='listing-images' and(storage.foldername(name))[1]=auth.uid()::text);

-- Public UI does not expose the platform fee. Configure the internal fee before recording real transactions above Rp1.000.000.
