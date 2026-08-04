-- Amal Snacks — RLS lockdown for orders, app_settings, menu, delivery_areas
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- What this fixes:
--   * orders was publicly SELECT-able via the anon key -> every customer's
--     name/phone/address/order history was readable by anyone.
--   * app_settings was publicly SELECT-able -> the Telegram bot token
--     (key = 'telegram_alerts') was readable by anyone.
--   * Both tables likely also had permissive/no INSERT-UPDATE restrictions,
--     meaning settings (pricing, discounts, banner, theme) could potentially
--     be overwritten by anyone with the anon key.
--
-- What still works after this runs:
--   * Public checkout (anon) can still INSERT into orders and menu-price them.
--   * Public storefront (anon) can still SELECT menu, and app_settings rows
--     other than telegram_alerts (banner/theme/discount/delivery-areas/etc).
--   * Admin dashboard (authenticated staff login) keeps full read/write.

begin;

-- ── orders ──────────────────────────────────────────────────────────
alter table public.orders enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', pol.policyname);
  end loop;
end $$;

-- Checkout (anon, via /api/orders) and admin WhatsApp-import (authenticated) can create orders.
create policy "orders_insert_anon_and_staff"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- Only logged-in staff can read order data (names/phones/addresses).
create policy "orders_select_staff_only"
  on public.orders for select
  to authenticated
  using (true);

-- Only logged-in staff can update order status.
create policy "orders_update_staff_only"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

-- No delete policy -> deletes are denied for everyone (including staff) by default.
-- Add one explicitly if you actually need to delete orders from the admin UI.

-- ── app_settings ────────────────────────────────────────────────────
alter table public.app_settings enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'app_settings'
  loop
    execute format('drop policy if exists %I on public.app_settings', pol.policyname);
  end loop;
end $$;

-- Public storefront needs most settings (banner/theme/discounts/delivery-areas/
-- schedule) but NOT the Telegram bot token/chat id.
create policy "app_settings_select_public_except_telegram"
  on public.app_settings for select
  to anon
  using (key <> 'telegram_alerts');

create policy "app_settings_select_staff_all"
  on public.app_settings for select
  to authenticated
  using (true);

-- Only logged-in staff can change any setting (pricing, discounts, banner, etc).
create policy "app_settings_write_staff_only"
  on public.app_settings for insert
  to authenticated
  with check (true);

create policy "app_settings_update_staff_only"
  on public.app_settings for update
  to authenticated
  using (true)
  with check (true);

-- ── menu ────────────────────────────────────────────────────────────
alter table public.menu enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies
    where schemaname = 'public' and tablename = 'menu'
  loop
    execute format('drop policy if exists %I on public.menu', pol.policyname);
  end loop;
end $$;

-- Storefront + /api/menu + /api/orders (server-side re-pricing) all read as anon.
create policy "menu_select_everyone"
  on public.menu for select
  to anon, authenticated
  using (true);

-- Only logged-in staff can add/edit/remove items.
create policy "menu_write_staff_only"
  on public.menu for insert
  to authenticated
  with check (true);

create policy "menu_update_staff_only"
  on public.menu for update
  to authenticated
  using (true)
  with check (true);

create policy "menu_delete_staff_only"
  on public.menu for delete
  to authenticated
  using (true);

-- ── delivery_areas (legacy fallback table, only if it exists) ────────
do $$
begin
  if to_regclass('public.delivery_areas') is not null then
    execute 'alter table public.delivery_areas enable row level security';

    execute (
      select coalesce(string_agg(
        format('drop policy if exists %I on public.delivery_areas', policyname), '; '
      ), 'select 1')
      from pg_policies where schemaname = 'public' and tablename = 'delivery_areas'
    );

    execute 'create policy "delivery_areas_select_everyone" on public.delivery_areas for select to anon, authenticated using (true)';
    execute 'create policy "delivery_areas_write_staff_only" on public.delivery_areas for insert to authenticated with check (true)';
    execute 'create policy "delivery_areas_update_staff_only" on public.delivery_areas for update to authenticated using (true) with check (true)';
    execute 'create policy "delivery_areas_delete_staff_only" on public.delivery_areas for delete to authenticated using (true)';
  end if;
end $$;

commit;

-- ── Verify ────────────────────────────────────────────────────────────
-- Review the resulting policies below before trusting this is correct.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'app_settings', 'menu', 'delivery_areas')
order by tablename, cmd;
