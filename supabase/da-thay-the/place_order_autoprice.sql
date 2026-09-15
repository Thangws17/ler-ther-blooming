-- ════════════════════════════════════════════════════════════════
-- place_order: TỰ ĐIỀN GIÁ từ giá niêm yết sản phẩm khi tạo đơn.
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
--
-- File này là bản MỚI NHẤT của place_order (bao gồm luôn các sửa trước:
-- SĐT tùy chọn, không ghi đè tên/địa chỉ khách cũ, chặn số lượng ≤ 0).
-- Chỉ cần chạy file này, không cần chạy lại place_order_hardening.sql.
--
-- Giá sản phẩm lưu dạng chữ ("600,000 đ") → tách lấy số → unit_price.
-- Nếu giá không tách được số (VD "Liên hệ") → để trống như cũ (Chưa định giá).
-- Admin vẫn sửa lại giá từng đơn được (hoa custom, đổi loại hoa...).
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
  v_qty int := greatest(coalesce(p_quantity, 1), 1);
  v_unit_price numeric;
begin
  -- Khách: có SĐT → định danh theo SĐT; không ghi đè thông tin khách đã có
  if p_phone is not null and length(trim(p_phone)) > 0 then
    select id into v_customer_id from customers where phone = p_phone;
    if v_customer_id is null then
      insert into customers (phone, name, address)
      values (p_phone, p_name, p_address)
      returning id into v_customer_id;
    else
      update customers
        set address    = coalesce(nullif(address, ''), p_address),
            updated_at = now()
      where id = v_customer_id;
    end if;
  else
    v_customer_id := null;
  end if;

  -- Tự lấy giá niêm yết của sản phẩm (tách số từ chuỗi giá)
  if p_product_id is not null then
    select nullif(regexp_replace(coalesce(price, ''), '[^0-9]', '', 'g'), '')::numeric
      into v_unit_price
    from products
    where id = p_product_id;
  end if;

  insert into orders (customer_id, customer_name, product_id, product_name, quantity,
                      unit_price,
                      delivery_address, delivery_area, delivery_date, message_card, note)
  values (v_customer_id, p_name, p_product_id, p_product_name, v_qty,
          v_unit_price,
          p_address, p_delivery_area, p_delivery_date, p_message_card, p_note)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function place_order to anon;

-- ────────────────────────────────────────────────────────────────
-- TÙY CHỌN: điền giá cho các đơn CŨ đang "Chưa định giá" mà sản phẩm
-- có giá niêm yết. Xem trước danh sách bị ảnh hưởng bằng câu SELECT,
-- ưng rồi mới chạy câu UPDATE (bỏ dấu -- ở đầu).
-- ────────────────────────────────────────────────────────────────
-- select o.id, o.product_name, p.price as gia_niem_yet
-- from orders o join products p on p.id = o.product_id
-- where o.unit_price is null;
--
-- update orders o
-- set unit_price = nullif(regexp_replace(coalesce(p.price,''), '[^0-9]', '', 'g'), '')::numeric
-- from products p
-- where p.id = o.product_id and o.unit_price is null;
