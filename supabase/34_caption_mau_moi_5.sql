-- 34_caption_mau_moi_5.sql — Caption cho 2 mẫu mới (#54, #55), viết 27/10/2026.
-- Cùng khuôn "tạp chí" với file 23/26/30/32. Dòng "Hoa có đặt theo size" không cần: đã là THÔNG TIN CHUNG (SQL 28).
-- Chạy lại bao nhiêu lần cũng được: mỗi dòng CHỈ ghi khi mô tả của mẫu còn TRỐNG.
-- Mẫu nào shop đã tự viết mô tả sau đó thì được giữ nguyên, không bị ghi đè.

-- #54 Bó hoa tặng người thương (ly kép hồng, hồng kem, sao xanh, giấy trắng nhăn, voan trắng, ruy băng hồng)
update products set description = E'“Nắng trong tay”\nLy kép hồng · hồng kem · sao xanh · giấy trắng nhăn · ruy băng hồng\nDịu dàng — rực rỡ — đầy đặn.\nPhù hợp tặng người yêu, mẹ, sinh nhật, kỷ niệm, 20/10.'
  where id = 54 and coalesce(description, '') = '';

-- #55 Mix dịu dàng (hồng phấn, đồng tiền hồng, cúc margaret, cúc trắng, sao xanh, giấy hồng mây, ruy băng đỏ đô)
update products set description = E'“Vườn hồng phấn”\nHồng phấn · đồng tiền hồng · cúc margaret · sao xanh · giấy hồng mây · ruy băng đỏ đô\nTươi tắn — ngọt ngào — nhiều lớp hoa.\nPhù hợp tặng bạn gái, mẹ, cô giáo, sinh nhật, 20/10.'
  where id = 55 and coalesce(description, '') = '';

-- Kiểm tra: 2 dòng dưới đây phải có mô tả mới
select id, name, left(description, 60) as mo_ta from products where id in (54, 55) order by id;
