-- Đơn hàng + Khách hàng — chạy trong Supabase SQL editor

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

alter table customers enable row level security;
alter table orders enable row level security;

-- Chỉ admin (đã đăng nhập) mới đọc/sửa/xóa được — khách đặt hàng không đọc trực tiếp bảng này
create policy "Admin read customers"   on customers for select using (auth.role() = 'authenticated');
create policy "Admin update customers" on customers for update using (auth.role() = 'authenticated');
create policy "Admin delete customers" on customers for delete using (auth.role() = 'authenticated');

create policy "Admin read orders"   on orders for select using (auth.role() = 'authenticated');
create policy "Admin update orders" on orders for update using (auth.role() = 'authenticated');
create policy "Admin delete orders" on orders for delete using (auth.role() = 'authenticated');

-- Function đặt hàng: chạy với quyền cao hơn (SECURITY DEFINER) để khách (anon)
-- gọi được mà không cần quyền đọc/ghi trực tiếp lên 2 bảng trên.
-- Tự nhận diện khách theo SĐT: có rồi thì gắn đơn vào khách cũ, chưa có thì tạo mới.
create or replace function place_order(
  p_phone text,
  p_name text,
  p_address text,
  p_product_id bigint,
  p_product_name text,
  p_quantity int,
  p_delivery_date date,
  p_message_card text,
  p_note text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id bigint;
  v_order_id bigint;
begin
  select id into v_customer_id from customers where phone = p_phone;

  if v_customer_id is null then
    insert into customers (phone, name, address)
    values (p_phone, p_name, p_address)
    returning id into v_customer_id;
  else
    update customers set name = p_name, address = coalesce(p_address, address), updated_at = now()
    where id = v_customer_id;
  end if;

  insert into orders (customer_id, product_id, product_name, quantity, delivery_address, delivery_date, message_card, note)
  values (v_customer_id, p_product_id, p_product_name, p_quantity, p_address, p_delivery_date, p_message_card, p_note)
  returning id into v_order_id;

  return v_order_id;
end;
$$;

grant execute on function place_order to anon;
