-- ════════════════════════════════════════════════════════════════
-- Nguyên liệu — sổ tay điền nhanh cho Sổ chi phí.
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
--
-- Mục đích: khi lên chi phí, gõ vài chữ là gợi ý nguyên liệu → tự điền
-- Loại + Đơn giá (giá lần mua gần nhất). KHÔNG phải quản lý tồn kho.
-- ════════════════════════════════════════════════════════════════

create table if not exists materials (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null default 'Khác',   -- Hoa / Phụ kiện / Vận chuyển / Khác
  last_price numeric,                       -- đơn giá lần mua gần nhất (tự cập nhật)
  created_at timestamptz default now()
);

-- Chống trùng tên (không phân biệt hoa/thường, bỏ khoảng trắng thừa)
create unique index if not exists materials_name_uniq on materials (lower(trim(name)));

alter table materials enable row level security;

drop policy if exists "Admin read materials"   on materials;
drop policy if exists "Admin insert materials" on materials;
drop policy if exists "Admin update materials" on materials;
drop policy if exists "Admin delete materials" on materials;

create policy "Admin read materials"   on materials for select using (auth.role() = 'authenticated');
create policy "Admin insert materials" on materials for insert with check (auth.role() = 'authenticated');
create policy "Admin update materials" on materials for update using (auth.role() = 'authenticated');
create policy "Admin delete materials" on materials for delete using (auth.role() = 'authenticated');

-- ── Seed từ dữ liệu chi phí ĐÃ CÓ ─────────────────────────────────
-- Mỗi mặt hàng từng nhập → 1 nguyên liệu, lấy Loại + Đơn giá của lần mua GẦN NHẤT.
-- Chạy lại không tạo trùng (on conflict do nothing).
insert into materials (name, category, last_price)
select distinct on (lower(trim(item)))
       trim(item), category, unit_price
from expenses
where item is not null and length(trim(item)) > 0
order by lower(trim(item)), expense_date desc, id desc
on conflict do nothing;
