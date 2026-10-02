-- ════════════════════════════════════════════════════════════════
--  28. "Thông tin chung" cho mọi mẫu hoa (02/10/2026)
--  Chạy được nhiều lần, chạy lại không hỏng gì (idempotent).
-- ════════════════════════════════════════════════════════════════
--
--  Các dòng hiện dưới MỌI mẫu ở trang chi tiết (giao miễn phí, COD…) trước đây ghi cứng trong code.
--  Giờ shop sửa được ở admin → tab Sản phẩm → nút "Thông tin chung". Lưu ở bảng cài đặt `contact`
--  (bảng này vốn cho khách đọc công khai — mấy dòng này đằng nào cũng hiện trên web).
--  Mỗi dòng một ý, cách nhau bằng xuống dòng. Để trống = không hiện dòng nào.

alter table contact add column if not exists thong_tin_chung text;

-- Lần đầu: điền sẵn 5 dòng (giống bộ mặc định THONG_TIN_CHUNG_MAC_DINH trong js/dungchung.js).
-- Đã có chữ (shop đã sửa) thì để nguyên.
update contact
   set thong_tin_chung = E'Hoa có đặt theo size\nGiao nội thành miễn phí\nGửi ảnh duyệt trước khi giao\nCOD hoặc chuyển khoản\nTặng kèm túi giấy, thiệp khi bạn yêu cầu'
 where id = 1 and thong_tin_chung is null;

-- "Hoa có đặt theo size" giờ là dòng CHUNG → bỏ dòng đó ở cuối mô tả từng mẫu, để shop xoá/sửa ở
-- "Thông tin chung" là cả web đổi theo (không còn mẫu nào tự giữ bản riêng). Các dòng riêng khác
-- (Phù hợp tặng…, Kích thước…, Tặng kèm…) giữ nguyên. Chạy lại: không còn dòng nào khớp → không đổi gì.
update products
   set description = regexp_replace(description, '\n[ \t]*Hoa có đặt theo size[ \t]*$', '')
 where description ~ '\n[ \t]*Hoa có đặt theo size[ \t]*$';

-- Kiểm tra: dòng 1 phải ra 5 dòng chữ; dòng 2 phải ra 0
select thong_tin_chung from contact where id = 1;
select count(*) as con_dong_size_rieng from products where description ~ '\n[ \t]*Hoa có đặt theo size[ \t]*$';
