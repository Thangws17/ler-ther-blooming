-- ════════════════════════════════════════════════════════════════
-- Siết place_order (chạy trong Supabase SQL editor — chạy lại được).
--
-- Sửa 2 điểm yếu:
--  (1) KHÔNG ghi đè tên/địa chỉ của khách đã tồn tại. Khách vãng lai
--      đặt lại (hoặc người lạ biết SĐT) không thể đổi tên/địa chỉ khách cũ.
--      Chỉ bổ sung địa chỉ nếu khách chưa có địa chỉ nào.
--  (2) Chặn số lượng không hợp lệ (≤ 0 → về 1).
-- ════════════════════════════════════════════════════════════════

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
  v_qty int := greatest(coalesce(p_quantity, 1), 1);   -- (2) số lượng tối thiểu 1
begin
  -- Có SĐT → định danh/ghép khách theo SĐT. Không SĐT → đơn không gắn khách.
  if p_phone is not null and length(trim(p_phone)) > 0 then
    select id into v_customer_id from customers where phone = p_phone;
    if v_customer_id is null then
      -- Khách mới: tạo bản ghi với thông tin vừa nhập
      insert into customers (phone, name, address)
      values (p_phone, p_name, p_address)
      returning id into v_customer_id;
    else
      -- (1) Khách đã có: KHÔNG ghi đè tên/địa chỉ. Chỉ điền địa chỉ nếu đang trống.
      update customers
        set address    = coalesce(nullif(address, ''), p_address),
            updated_at = now()
      where id = v_customer_id;
    end if;
  else
    v_customer_id := null;
  end if;

  -- Luôn lưu tên khách snapshot trên đơn (đơn tự đứng được dù không gắn khách)
  insert into orders (customer_id, customer_name, product_id, product_name, quantity,
                      delivery_address, delivery_area, delivery_date, message_card, note)
  values (v_customer_id, p_name, p_product_id, p_product_name, v_qty,
          p_address, p_delivery_area, p_delivery_date, p_message_card, p_note)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function place_order to anon;
