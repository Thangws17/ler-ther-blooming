-- Phase 1 CMS: tiền & tổng đơn — chạy trong Supabase SQL editor
-- (chạy SAU orders_setup_full.sql). Chỉ thêm cột, KHÔNG đụng RPC place_order.

alter table orders add column if not exists unit_price   numeric;
alter table orders add column if not exists shipping_fee numeric default 0;

-- Tổng tiền = đơn giá × số lượng + phí ship (cột tự tính, luôn đúng)
alter table orders add column if not exists total numeric
  generated always as (coalesce(unit_price, 0) * quantity + coalesce(shipping_fee, 0)) stored;
