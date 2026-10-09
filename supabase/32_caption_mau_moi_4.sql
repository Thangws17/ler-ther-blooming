-- 32_caption_mau_moi_4.sql — Caption cho 2 mẫu mới (#51, #52), viết 09/10/2026.
-- Cùng khuôn "tạp chí" với file 23/26/29/30. Dòng "Hoa có đặt theo size" không cần: đã là THÔNG TIN CHUNG (SQL 28).
-- Chạy lại bao nhiêu lần cũng được: mỗi dòng CHỈ ghi khi mô tả của mẫu còn TRỐNG.
-- Mẫu nào shop đã tự viết mô tả sau đó thì được giữ nguyên, không bị ghi đè.

-- #51 Thanh liễu xanh (BST Em Xinh + Anh Trai — thanh liễu nhuộm xanh dương, 2 phăng kem, 1 hoa khô trắng, giấy đen, ruy băng xanh nhạt)
update products set description = E'“Đêm xanh”\nThanh liễu nhuộm xanh · phăng đơn kem · hoa khô · cỏ suối · giấy đen · ruy băng xanh\nCá tính — sâu lắng — khác biệt.\nPhù hợp tặng bạn trai, bạn gái, sinh nhật, tốt nghiệp, người mê màu xanh.'
  where id = 51 and coalesce(description, '') = '';

-- #52 Bó hoa nhỏ - tâm tình lớn (BST Hoa Sự Kiện — 2 hồng phấn, 1 phăng hồng, giấy mờ xanh mint)
update products set description = E'“Lời thì thầm”\nHồng phấn · phăng đơn hồng · cỏ suối · giấy mờ xanh mint · ruy băng xanh\nNhỏ xinh — dịu dàng — chân thành.\nPhù hợp tặng 20/10, cô giáo, đồng nghiệp, bạn bè, sự kiện cần số lượng.'
  where id = 52 and coalesce(description, '') = '';

-- Kiểm tra: 2 dòng dưới đây phải có mô tả mới
select id, name, left(description, 60) as mo_ta from products where id in (51, 52) order by id;
