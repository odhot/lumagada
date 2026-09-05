create extension if not exists pgcrypto;
create table if not exists profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text not null default 'Pengguna Lumagada', phone text, city text, district text, avatar_url text, verified boolean not null default false, seller_type text not null default 'regular' check(seller_type in ('regular','pro')), seller_verified boolean not null default false, seller_document_type text, seller_document_number text, seller_business_name text, created_at timestamptz not null default now());
create table if not exists categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, icon text, created_at timestamptz not null default now());
create table if not exists listings (id uuid primary key default gen_random_uuid(), seller_id uuid not null references profiles(id) on delete cascade, category_id uuid references categories(id), title text not null, description text not null default '', price bigint not null check(price>=0), condition text not null default 'Bekas', city text not null, district text, status text not null default 'active' check(status in ('active','expired','sold','hidden')), urgent boolean not null default false, is_pro_listing boolean not null default false, expires_at timestamptz not null default (now() + interval '7 days'), last_reup_at timestamptz, created_at timestamptz not null default now());
create table if not exists listing_images (id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id) on delete cascade, url text not null, sort_order int not null default 0);
create table if not exists favorites (user_id uuid not null references profiles(id) on delete cascade, listing_id uuid not null references listings(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id,listing_id));
create table if not exists conversations (id uuid primary key default gen_random_uuid(), buyer_id uuid not null references profiles(id) on delete cascade, seller_id uuid not null references profiles(id) on delete cascade, listing_id uuid not null references listings(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations(id) on delete cascade, sender_id uuid not null references profiles(id) on delete cascade, body text not null, created_at timestamptz not null default now());
create table if not exists transactions (id uuid primary key default gen_random_uuid(), listing_id uuid references listings(id) on delete set null, buyer_id uuid references profiles(id) on delete set null, seller_id uuid references profiles(id) on delete set null, amount bigint not null check(amount>=0), platform_fee bigint not null default 0, created_at timestamptz not null default now());
insert into categories(name,slug,icon) values ('Mobil','mobil','🚗'),('Motor','motor','🏍️'),('Properti','properti','🏠'),('Elektronik','elektronik','📱'),('Jasa & Lowongan','jasa','💼'),('Fashion','fashion','👕'),('Rumah & Perabot','rumah','🪑'),('Hobi & Koleksi','hobi','🎮'),('Hewan','hewan','🐱'),('Buku','buku','📚'),('Bisnis','bisnis','🏪'),('Lainnya','lainnya','📦') on conflict do nothing;
alter table profiles enable row level security; alter table categories enable row level security; alter table listings enable row level security; alter table listing_images enable row level security; alter table favorites enable row level security; alter table conversations enable row level security; alter table messages enable row level security; alter table transactions enable row level security;
create policy "public read categories" on categories for select using(true);
create policy "public read active listings" on listings for select using((status='active' and (expires_at > now() or is_pro_listing=true)) or seller_id=auth.uid());
create policy "seller insert listings" on listings for insert with check(seller_id=auth.uid());
create policy "seller update listings" on listings for update using(seller_id=auth.uid());
create policy "seller delete listings" on listings for delete using(seller_id=auth.uid());
create policy "public read listing images" on listing_images for select using(true);
create policy "owners manage images" on listing_images for all using(exists(select 1 from listings l where l.id=listing_id and l.seller_id=auth.uid()));
create policy "users manage own favorites" on favorites for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "participants read conversations" on conversations for select using(buyer_id=auth.uid() or seller_id=auth.uid());
create policy "buyers create conversations" on conversations for insert with check(buyer_id=auth.uid());
create policy "participants read messages" on messages for select using(exists(select 1 from conversations c where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())));
create policy "participants send messages" on messages for insert with check(sender_id=auth.uid() and exists(select 1 from conversations c where c.id=conversation_id and (c.buyer_id=auth.uid() or c.seller_id=auth.uid())));
create policy "users read own transactions" on transactions for select using(buyer_id=auth.uid() or seller_id=auth.uid());

-- Regular listings expire after 7 days. Pro listings can remain active until manually changed.
create or replace function reup_listing(p_listing_id uuid)
returns listings
language plpgsql
security invoker
as $$
declare result listings;
begin
 update listings
 set status='active', expires_at=now()+interval '7 days', last_reup_at=now()
 where id=p_listing_id and seller_id=auth.uid() and is_pro_listing=false
 returning * into result;
 return result;
end;
$$;
