-- 33 · NGUỒN KHÁCH của đơn hàng (Facebook / Instagram / Zalo / Web / Giới thiệu / Khác) — 11/10/2026
-- Chạy trong Supabase SQL Editor. Chạy lại bao nhiêu lần cũng được.
--
-- • orders.nguon : khách biết tới shop / chốt đơn qua đâu. Shop chọn bằng 1 hàng chip trong form
--   Thêm đơn / Sửa đơn (admin nhớ lựa chọn lần trước). Danh sách chip nằm ở NGUON_KHACH trong admin —
--   database KHÔNG khoá cứng giá trị (chỉ giới hạn độ dài) nên thêm chip mới không cần chạy lại SQL.
-- • Đơn khách tự đặt trên web (gọi place_order khi CHƯA đăng nhập) tự ghi 'Web' — trigger bên dưới,
--   không phải sửa hàm place_order (file 15).
-- • Đơn cũ để trống → tab Báo cáo hiện là "Chưa ghi".

alter table orders add column if not exists nguon text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_nguon_do_dai') then
    alter table orders add constraint orders_nguon_do_dai check (nguon is null or char_length(nguon) <= 30);
  end if;
end $$;

create or replace function don_web_tu_ghi_nguon() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Khách vãng lai (khoá công khai, vai 'anon') = đơn đặt trên web. Admin đăng nhập thì để admin tự ghi.
  if new.nguon is null and coalesce(auth.jwt() ->> 'role', '') = 'anon' then
    new.nguon := 'Web';
  end if;
  return new;
end $$;

drop trigger if exists don_web_tu_ghi_nguon on orders;
create trigger don_web_tu_ghi_nguon
  before insert on orders
  for each row execute function don_web_tu_ghi_nguon();

-- Kiểm tra: số đơn theo từng nguồn
select coalesce(nguon, '(chưa ghi)') as nguon, count(*) as so_don from orders group by 1 order by 2 desc;
