-- Danh mục Gallery tự quản lý (thêm/sửa/xóa trong admin thay vì hard-code).
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.

create table if not exists gallery_categories (
  id bigint generated always as identity primary key,
  name text not null,
  emoji text default '📷',
  order_index int default 0,
  created_at timestamptz default now()
);

alter table gallery_categories enable row level security;

-- Public đọc (trang gallery cần), admin (đã đăng nhập) toàn quyền
drop policy if exists "Public read gallery_categories" on gallery_categories;
drop policy if exists "Admin write gallery_categories" on gallery_categories;
create policy "Public read gallery_categories" on gallery_categories
  for select using (true);
create policy "Admin write gallery_categories" on gallery_categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed danh mục mặc định (chỉ khi bảng đang trống)
insert into gallery_categories (name, emoji, order_index)
select v.name, v.emoji, v.order_index from (values
  ('Hoa bó',     '🌹', 1),
  ('Giỏ hoa',    '🌻', 2),
  ('Hoa để bàn', '💐', 3),
  ('Hoa cưới',   '👰', 4),
  ('Sự kiện',    '🎉', 5),
  ('Khác',       '📷', 6)
) as v(name, emoji, order_index)
where not exists (select 1 from gallery_categories);
