-- Chính sách (giao hàng / thanh toán / cam kết) — chạy trong Supabase SQL editor
-- Lưu trong bảng contact (cấu hình 1 dòng), sửa được trong Admin → Liên hệ

alter table contact add column if not exists policy_delivery text;
alter table contact add column if not exists policy_payment  text;
alter table contact add column if not exists policy_quality  text;

-- Nội dung mặc định (bạn có thể sửa lại trong Admin sau)
update contact set
  policy_delivery = coalesce(policy_delivery,
'Miễn phí giao hàng khu vực nội thành.
Khu vực ngoại thành: vui lòng liên hệ để được báo phí giao cụ thể.
Đặt hoa trước càng sớm càng tốt để shop chuẩn bị chu đáo, ưu tiên giao trong ngày khi có thể.'),
  policy_payment = coalesce(policy_payment,
'Tiền mặt khi nhận hoa (COD).
Chuyển khoản ngân hàng — thông tin tài khoản sẽ được gửi qua Zalo khi xác nhận đơn.'),
  policy_quality = coalesce(policy_quality,
'Hoa được chọn tươi mới mỗi ngày, cắm nghệ thuật theo từng đơn.
Shop chụp ảnh bó hoa thật và gửi để bạn duyệt trước khi giao — đảm bảo đúng mẫu bạn mong muốn.')
where id = 1;
