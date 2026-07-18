-- ════════════════════════════════════════════════════════════════
-- SETUP ĐẦY ĐỦ: Đơn hàng + Khách hàng (gộp orders_migration + p1)
-- Chạy được nhiều lần không lỗi. Nếu trước đó chạy dở, chạy lại file
-- NÀY là về đúng trạng thái. Chỉ cần chạy 1 file này, bỏ qua 2 file kia.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Bảng ──────────────────────────────────────────────────────
create table if not exists customers (
  id bigint generated always as identity primary key,
  phone text unique not null,
  name text not null,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  customer_id bigint references customers(id) on delete set null,
  product_id bigint references products(id) on delete set null,
  product_name text not null,
  quantity int not null default 1,
  delivery_address text,
  delivery_date date,
  message_card text,
  note text,
  status text not null default 'Mới',
  created_at timestamptz default now()
);

-- Cột bổ sung (P1) — thêm nếu chưa có
alter table orders add column if not exists delivery_area text;
alter table orders add column if not exists customer_name text;                 -- snapshot tên khách trên đơn
alter table orders add column if not exists image text;                         -- ảnh riêng của đơn (mặc định dùng ảnh sản phẩm)
alter table orders add column if not exists customer_email text;                -- email khách (không bắt buộc, nhận mail xác nhận)
alter table orders add column if not exists unit_price   numeric;              -- đơn giá admin chốt
alter table orders add column if not exists shipping_fee numeric default 0;
alter table orders add column if not exists total numeric
  generated always as (coalesce(unit_price, 0) * quantity + coalesce(shipping_fee, 0)) stored;

-- ── 2. Bật RLS ───────────────────────────────────────────────────
alter table customers enable row level security;
alter table orders    enable row level security;

-- ── 3. Policy (drop trước rồi tạo lại — chạy nhiều lần không lỗi) ──
drop policy if exists "Admin read customers"   on customers;
drop policy if exists "Admin insert customers" on customers;
drop policy if exists "Admin update customers" on customers;
drop policy if exists "Admin delete customers" on customers;
drop policy if exists "Admin read orders"      on orders;
drop policy if exists "Admin update orders"    on orders;
drop policy if exists "Admin delete orders"    on orders;

create policy "Admin read customers"   on customers for select using (auth.role() = 'authenticated');
create policy "Admin insert customers" on customers for insert with check (auth.role() = 'authenticated');
create policy "Admin update customers" on customers for update using (auth.role() = 'authenticated');
create policy "Admin delete customers" on customers for delete using (auth.role() = 'authenticated');
create policy "Admin read orders"   on orders for select using (auth.role() = 'authenticated');
create policy "Admin update orders" on orders for update using (auth.role() = 'authenticated');
create policy "Admin delete orders" on orders for delete using (auth.role() = 'authenticated');
-- Lưu ý: KHÔNG có policy insert cho anon trên orders/customers — khách đặt hàng
-- đi qua RPC place_order (security definer) nên vẫn tạo được đơn mà bảng vẫn khóa.

-- ── 4. Function đặt hàng ──────────────────────────────────────────
-- ⚠️ BẢN MỚI NHẤT của place_order nằm ở notifications_v2.sql (thêm p_email,
--    báo shop + mail xác nhận khách). Setup mới thì chạy file đó SAU file này.
-- Drop cả 2 phiên bản (9 và 10 tham số) để tránh hàm trùng tên lẫn lộn
drop function if exists place_order(text, text, text, bigint, text, int, date, text, text);
drop function if exists place_order(text, text, text, bigint, text, int, date, text, text, text);

-- SĐT tùy chọn · KHÔNG ghi đè thông tin khách đã có · chặn số lượng ≤ 0
-- · TỰ điền giá từ giá niêm yết sản phẩm (tách số từ chuỗi giá text)
create function place_order(
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
  if p_phone is not null and length(trim(p_phone)) > 0 then
    select id into v_customer_id from customers where phone = p_phone;
    if v_customer_id is null then
      insert into customers (phone, name, address)
      values (p_phone, p_name, p_address)
      returning id into v_customer_id;
    else
      -- Khách đã có: không đè tên/địa chỉ; chỉ điền địa chỉ nếu đang trống
      update customers
        set address    = coalesce(nullif(address, ''), p_address),
            updated_at = now()
      where id = v_customer_id;
    end if;
  else
    v_customer_id := null;
  end if;

  -- Giá niêm yết của sản phẩm → unit_price (không tách được số thì để trống)
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
