-- ════════════════════════════════════════════════════════════════
-- Lưu SỐ ĐIỆN THOẠI ngay trên đơn (chạy trong Supabase SQL editor).
-- Chạy lại nhiều lần được — lần 2 trở đi không đổi gì nữa.
--
-- VÌ SAO CẦN:
--   Đơn hàng đang lưu sẵn snapshot TÊN khách (cột customer_name) nhưng
--   KHÔNG lưu số điện thoại — số đọc trực tiếp từ bảng customers.
--   Nên khi xoá một khách khỏi sổ, đơn cũ của họ vẫn còn nhưng
--   ô số điện thoại thành "—", lúc cần gọi lại thì không có gì để gọi.
--
-- LÀM GÌ:
--   1. Thêm cột orders.customer_phone
--   2. Điền cho các đơn đã có, lấy từ sổ khách hiện tại
--
--   Từ đây admin sẽ tự chép số vào đơn NGAY TRƯỚC KHI xoá khách,
--   nên lịch sử đơn không bao giờ mất số liên hệ.
--
-- AN TOÀN: chỉ THÊM cột và điền dữ liệu, không xoá/sửa gì sẵn có.
-- ════════════════════════════════════════════════════════════════

alter table orders add column if not exists customer_phone text;

-- Điền cho đơn đã có (chỉ điền chỗ đang trống, không đè)
update orders o
   set customer_phone = c.phone
  from customers c
 where o.customer_id = c.id
   and o.customer_phone is null
   and c.phone is not null;

-- ── Kiểm tra: còn bao nhiêu đơn có khách mà chưa có số? (nên là 0) ──
select count(*) as don_thieu_so
from orders o
join customers c on c.id = o.customer_id
where o.customer_phone is null and c.phone is not null;
