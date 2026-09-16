create extension if not exists pgcrypto;

create table public.categories (id text primary key, name text not null);
create table public.products (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  category text not null references public.categories(id), price_minor integer not null check (price_minor > 0),
  description text not null, details text[] not null default '{}', image_url text not null, image_alt text not null,
  available boolean not null default true, featured boolean not null default false, badge text,
  created_at timestamptz not null default now()
);
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
create table public.orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  total_minor integer not null check (total_minor > 0), currency text not null default 'ETB' check (currency = 'ETB'),
  delivery jsonb not null, idempotency_key uuid not null, request_hash text not null,
  created_at timestamptz not null default now(), paid_at timestamptz,
  unique(user_id, idempotency_key)
);
create index orders_user_created on public.orders(user_id, created_at desc);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id), name text not null, description text not null,
  image_url text not null, unit_price_minor integer not null check (unit_price_minor > 0), quantity integer not null check (quantity between 1 and 10),
  unique(order_id, product_id)
);
create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id),
  status text not null default 'initializing' check (status in ('initializing','ready','unresolved','failed')),
  provider_order_id text unique, payment_url text, expires_at timestamptz, created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_attempts enable row level security;
create policy "Public categories" on public.categories for select using (true);
create policy "Public catalog" on public.products for select using (true);
create policy "Own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own order lines" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_id and orders.user_id = (select auth.uid())));
-- No client policy permits order/payment creation or mutation.
revoke all on public.payment_attempts from anon, authenticated;
grant select on public.products, public.categories to anon, authenticated;
grant select on public.orders, public.order_items, public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id) values (new.id); return new; end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create function public.create_checkout(p_user uuid, p_key uuid, p_hash text, p_items jsonb, p_delivery jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  previous public.orders; new_id uuid; total bigint; requested integer; matched_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || p_key::text, 0));
  select * into previous from public.orders where user_id = p_user and idempotency_key = p_key;
  if found then
    if previous.request_hash <> p_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return jsonb_build_object('order_id', previous.id, 'claimed', false);
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'INVALID_CART'; end if;
  requested := jsonb_array_length(p_items);
  if exists(select 1 from jsonb_to_recordset(p_items) as i("productId" uuid, quantity integer) where quantity is null or quantity not between 1 and 10 or "productId" is null)
     or requested <> (select count(distinct x->>'productId') from jsonb_array_elements(p_items) x) then raise exception 'INVALID_CART'; end if;
  -- Hold catalog rows stable while snapshots and the order are written.
  perform p.id from public.products p join jsonb_to_recordset(p_items) as i("productId" uuid, quantity integer) on p.id = i."productId" for share of p;
  select count(*), sum(p.price_minor::bigint * i.quantity) into matched_count, total
    from public.products p join jsonb_to_recordset(p_items) as i("productId" uuid, quantity integer) on p.id = i."productId" where p.available;
  if matched_count <> requested or total is null or total not between 1 and 2147483647 then raise exception 'INVALID_CART'; end if;
  insert into public.orders(user_id, total_minor, delivery, idempotency_key, request_hash) values(p_user, total, p_delivery, p_key, p_hash) returning id into new_id;
  insert into public.order_items(order_id, product_id, name, description, image_url, unit_price_minor, quantity)
    select new_id, p.id, p.name, p.description, p.image_url, p.price_minor, i.quantity from public.products p
    join jsonb_to_recordset(p_items) as i("productId" uuid, quantity integer) on p.id = i."productId";
  insert into public.payment_attempts(order_id) values(new_id);
  return jsonb_build_object('order_id', new_id, 'claimed', true);
end;
$$;
revoke all on function public.create_checkout(uuid,uuid,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.create_checkout(uuid,uuid,text,jsonb,jsonb) to service_role;

insert into storage.buckets(id, name, public) values('products', 'products', true) on conflict(id) do nothing;
create policy "Product images are public" on storage.objects for select using (bucket_id = 'products');
