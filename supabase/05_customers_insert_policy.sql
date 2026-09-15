-- Cho phép Admin (đã đăng nhập) tạo khách hàng mới trực tiếp từ modal Sửa đơn
-- (trước đây chỉ có policy đọc/sửa/xóa, thiếu insert vì khách trước nay chỉ được
-- tạo qua RPC place_order). Chạy lại nhiều lần không lỗi.

drop policy if exists "Admin insert customers" on customers;
create policy "Admin insert customers" on customers for insert with check (auth.role() = 'authenticated');
