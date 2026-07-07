-- Ảnh đại diện cho đơn hàng — chạy trong Supabase SQL editor. Chạy lại được.
--
-- Cách hoạt động:
--  · Đơn đặt từ web (có chọn sản phẩm) → tự hiển thị ảnh của sản phẩm đó
--    (không cần điền gì, admin join sang bảng products lúc hiển thị).
--  · Cột "image" dưới đây chỉ dùng khi admin muốn gắn ảnh RIÊNG cho đơn
--    (đơn thủ công không có sản phẩm, hoặc hoa custom khác mẫu niêm yết).

alter table orders add column if not exists image text;
