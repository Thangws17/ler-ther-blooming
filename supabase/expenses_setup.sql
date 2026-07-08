-- Sổ chi phí (ghi nhận theo dòng tiền) — chạy trong Supabase SQL editor.
-- Chạy lại nhiều lần không lỗi.

create table if not exists expenses (
  id bigint generated always as identity primary key,
  expense_date date not null default current_date,
  category text not null default 'Khác',   -- Hoa / Phụ kiện / Vận chuyển / Khác
  item text,                                -- mặt hàng (tùy chọn)
  quantity numeric,                         -- số lượng (tùy chọn)
  unit_price numeric,                       -- đơn giá (tùy chọn)
  amount numeric not null default 0,        -- thành tiền (bắt buộc)
  note text,
  image text,                               -- ảnh hoá đơn/mặt hàng (tùy chọn)
  created_at timestamptz default now()
);

-- Thêm cột image nếu bảng đã tồn tại từ trước
alter table expenses add column if not exists image text;

alter table expenses enable row level security;

-- Chỉ admin (đã đăng nhập) thao tác — admin ghi trực tiếp nên CẦN cả policy insert
drop policy if exists "Admin read expenses"   on expenses;
drop policy if exists "Admin insert expenses" on expenses;
drop policy if exists "Admin update expenses" on expenses;
drop policy if exists "Admin delete expenses" on expenses;

create policy "Admin read expenses"   on expenses for select using (auth.role() = 'authenticated');
create policy "Admin insert expenses" on expenses for insert with check (auth.role() = 'authenticated');
create policy "Admin update expenses" on expenses for update using (auth.role() = 'authenticated');
create policy "Admin delete expenses" on expenses for delete using (auth.role() = 'authenticated');
