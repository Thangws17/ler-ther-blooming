-- Ảnh cho từng dòng chi phí (chụp hoá đơn / mặt hàng để dễ quản lý).
-- Chạy trong Supabase SQL editor. Chạy lại được.
-- Ảnh chi phí lưu riêng (thư mục expenses/), KHÔNG đưa vào Gallery công khai.

alter table expenses add column if not exists image text;
