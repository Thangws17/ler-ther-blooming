-- ════════════════════════════════════════════════════════════════
-- Hero trang chủ là CỤM 3 ẢNH: 1 ảnh chính + 2 ảnh phụ.
-- Trước đây 2 ảnh phụ tự lấy từ Gallery; file này thêm 2 cột để chủ shop
-- tự chọn 2 ảnh phụ trong admin. Bỏ trống thì vẫn tự lấy từ Gallery như cũ.
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
-- ════════════════════════════════════════════════════════════════

alter table contact add column if not exists hero_side1 text;
alter table contact add column if not exists hero_side2 text;
