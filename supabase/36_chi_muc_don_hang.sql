-- 36 · Chỉ mục (index) cho bảng đơn hàng + chi phí — 16/11/2026
--
-- VÌ SAO: bảng `orders` chưa có chỉ mục nào ngoài mã đơn → mỗi lần cần "đơn giao hôm nay", "đơn tạo 10 phút qua"…
-- database phải lật TỪNG đơn từ đầu tới cuối. Vài trăm đơn thì chưa thấy chậm, nhưng việc đó chạy rất thường xuyên:
--   • mỗi đơn khách đặt trên web: place_order đếm đơn 10 phút gần nhất (chống spam) + mail đã gửi trong ngày;
--   • cứ 5 phút 1 lần: mail nhắc trước giờ giao 2 tiếng (file 25) tìm đơn giao quanh hôm nay;
--   • 8:30 sáng: mail nhắc lịch giao 2 ngày tới (file 15);
--   • admin: Lịch giao / Báo cáo xếp theo ngày giao, lịch sử mua của 1 khách (khoá ngoại customer_id KHÔNG tự có chỉ mục).
-- Chỉ mục giống mục lục cuối sách: tra thẳng tới đúng trang thay vì lật cả cuốn.
--
-- AN TOÀN: không thêm/xoá/sửa dữ liệu, không đổi cách admin hay web hoạt động. Chạy lại nhiều lần không sao
-- (`if not exists`). Tốn thêm rất ít dung lượng (vài trăm KB cho vài nghìn đơn).

create index if not exists orders_created_at_idx    on orders (created_at);
create index if not exists orders_delivery_date_idx on orders (delivery_date);
create index if not exists orders_customer_id_idx   on orders (customer_id);
-- place_order: "1 email nhận tối đa 3 mail xác nhận / ngày" so lower(customer_email)
create index if not exists orders_email_lower_idx   on orders (lower(customer_email)) where customer_email is not null;
-- Sổ chi phí lọc theo tháng
create index if not exists expenses_expense_date_idx on expenses (expense_date);

-- Kiểm: phải thấy 4 dòng orders_… + 1 dòng expenses_…
select tablename, indexname from pg_indexes
where schemaname = 'public' and indexname in ('orders_created_at_idx', 'orders_delivery_date_idx', 'orders_customer_id_idx',
  'orders_email_lower_idx', 'expenses_expense_date_idx')
order by 1, 2;
