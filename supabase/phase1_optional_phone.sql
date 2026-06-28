-- Phase 1: cho phép đơn KHÔNG có SĐT khách + lưu tên khách snapshot trên đơn
-- Chạy trong Supabase SQL editor (sau orders_setup_full.sql + phase1_orders.sql).
-- Chữ ký place_order KHÔNG đổi → chỉ create or replace, không cần drop.

alter table orders add column if not exists customer_name text;

create or replace function place_order(
  p_phone text,
  p_name text,
  p_address text,
  p_product_id bigint,
  p_product_name text,
  p_quantity int,
  p_delivery_date date,
  p_message_card text,
  p_note text,
  p_delivery_area text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id bigint;
  v_order_id bigint;
begin
  -- Có SĐT → định danh/ghép khách theo SĐT như cũ. Không SĐT → đơn không gắn khách.
  if p_phone is not null and length(trim(p_phone)) > 0 then
    select id into v_customer_id from customers where phone = p_phone;
    if v_customer_id is null then
      insert into customers (phone, name, address)
      values (p_phone, p_name, p_address)
      returning id into v_customer_id;
    else
      update customers set name = p_name, address = coalesce(p_address, address), updated_at = now()
      where id = v_customer_id;
    end if;
  else
    v_customer_id := null;
  end if;

  -- Luôn lưu tên khách snapshot (customer_name) để đơn tự đứng được dù không có khách
  insert into orders (customer_id, customer_name, product_id, product_name, quantity,
                      delivery_address, delivery_area, delivery_date, message_card, note)
  values (v_customer_id, p_name, p_product_id, p_product_name, p_quantity,
          p_address, p_delivery_area, p_delivery_date, p_message_card, p_note)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function place_order to anon;
