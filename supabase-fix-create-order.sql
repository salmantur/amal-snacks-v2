-- Amal Snacks — create the create_order() RPC used by /api/orders (checkout)
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- Why: app/api/orders/route.ts (the endpoint every real checkout hits) saves
-- orders via supabase.rpc("create_order", {...}) — a Postgres function, not a
-- plain table insert. That function's definition lives only in the database,
-- not in this repo. If it was never created here (or exists with a mismatched
-- signature, or without EXECUTE granted to the anon role checkout runs as),
-- every checkout submission 500s and the order is never saved — while
-- everything else (menu browsing, the admin's separate plain-insert path in
-- lib/orders.ts) keeps working fine, since neither of those touch this
-- function at all. That matches the reported symptom exactly.
--
-- Safe to run even if the function already exists correctly: CREATE OR
-- REPLACE + idempotent GRANT just reaffirm the same definition.

begin;

create or replace function public.create_order(
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

-- security definer runs as the function owner (the role that ran this
-- script, normally postgres) which already bypasses RLS on tables it owns —
-- this grant just makes sure the anon/authenticated roles are allowed to
-- call the function itself.
grant execute on function public.create_order(
  text, text, text, text, jsonb, numeric, numeric, numeric, text, text
) to anon, authenticated;

commit;

-- ── Verify ────────────────────────────────────────────────────────────
-- Confirm the function exists, is security definer, and anon/authenticated
-- have execute rights (look for "anon=X" / "authenticated=X" in acl).
select
  p.proname,
  p.prosecdef as security_definer,
  pg_get_function_identity_arguments(p.oid) as args,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_order';
