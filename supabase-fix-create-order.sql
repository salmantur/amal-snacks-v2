-- Amal Snacks — replace the create_order() RPC used by /api/orders (checkout)
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- The function already exists (confirmed: "cannot change return type of
-- existing function" on the first attempt), so something inside its current
-- body — not a missing function — is causing the checkout 500. This script
-- first prints the current definition (so we can see what it was actually
-- doing), then drops and recreates it to match exactly what
-- app/api/orders/route.ts calls and what the working admin insert path
-- (lib/orders.ts) does.

-- ── Step 1: show the current definition (read this before it's replaced) ──
select pg_get_functiondef(p.oid) as current_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_order';

-- ── Step 2: drop + recreate ─────────────────────────────────────────────
begin;

drop function if exists public.create_order(text, text, text, text, jsonb, numeric, numeric, numeric, text, text);

create function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_area text,
  p_order_type text,
  p_items jsonb,
  p_subtotal numeric,
  p_delivery_fee numeric,
  p_total numeric,
  p_notes text,
  p_scheduled_time text
)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    insert into public.orders (
      customer_name, customer_phone, customer_area, order_type,
      items, subtotal, delivery_fee, total, notes, scheduled_time, status
    )
    values (
      p_customer_name, p_customer_phone, p_customer_area, p_order_type,
      p_items, p_subtotal, p_delivery_fee, p_total, p_notes, p_scheduled_time, 'pending'
    )
    returning *;
end;
$$;

grant execute on function public.create_order(
  text, text, text, text, jsonb, numeric, numeric, numeric, text, text
) to anon, authenticated;

commit;

-- ── Step 3: verify ──────────────────────────────────────────────────────
select
  p.proname,
  p.prosecdef as security_definer,
  pg_get_function_identity_arguments(p.oid) as args,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_order';
