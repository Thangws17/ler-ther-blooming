-- 37_caption_mau_moi_6.sql — Caption cho mẫu mới, viết 17/11/2026 (xem ảnh từng mẫu).
-- Cùng khuôn "tạp chí" với file 23/26/30/32/34: “Biệt danh” / thành phần cách bằng · / 3 chữ khoá — / Phù hợp tặng …
-- Dòng "Hoa có đặt theo size" không cần: đã là THÔNG TIN CHUNG (SQL 28).
-- Chạy lại bao nhiêu lần cũng được:
--   • #58, #59, #60 (mô tả còn TRỐNG): chỉ ghi khi vẫn trống — shop tự viết rồi thì giữ nguyên.
--   • #53, #56, #57 (shop đã tự viết BIỆT DANH, chưa có thành phần): GIỮ NGUYÊN biệt danh, chỉ NỐI THÊM các dòng sau,
--     và chỉ khi mô tả vẫn còn đúng 1 dòng (chạy lần 2 sẽ không nối trùng).

-- ── Mẫu mới, mô tả trống ──────────────────────────────────────────

-- #58 Giỏ hoa mùa thu (giỏ mây, hồng kem vàng, đồng tiền hồng đào, hoa trắng điểm xuyết, lá măng, ruy băng vàng kem)
update products set description = E'“Nắng thu”\nHồng kem · đồng tiền hồng · hoa trắng điểm xuyết · lá măng · giỏ mây · ruy băng vàng kem\nẤm áp — dịu dàng — đầy đặn.\nPhù hợp tặng khai trương, sinh nhật, mẹ, thầy cô 20/11, lời cảm ơn.'
  where id = 58 and coalesce(description, '') = '';

-- #59 Hoa Ly mix dễ thương (ly kép hồng, hồng phấn, phăng chùm hồng, sao xanh, cỏ suối, giấy kem, đá đính trái tim/ngôi sao)
update products set description = E'“Hộp kẹo hồng”\nLy kép hồng · hồng phấn · phăng chùm hồng · sao xanh · cỏ suối · giấy kem nhăn · ruy băng vàng kem\nNgọt ngào — lấp lánh — đáng yêu.\nPhù hợp tặng bạn gái, em gái, sinh nhật, kỷ niệm, 20/11.'
  where id = 59 and coalesce(description, '') = '';

-- #60 Cảm ơn em (hồng chùm hồng phấn, sợi cói trắng, giấy chấm bi, túi kraft)
update products set description = E'“Thay lời cảm ơn”\nHồng chùm hồng phấn · sợi cói trắng · giấy chấm bi · túi kraft\nNhẹ nhàng — tinh tế — chân thành.\nPhù hợp tặng người yêu, bạn bè, đồng nghiệp, cô giáo, lời cảm ơn.'
  where id = 60 and coalesce(description, '') = '';

-- ── Mẫu shop đã viết biệt danh: nối thêm, giữ nguyên dòng đầu ─────────

-- #53 Ly kép mix — “Nhẹ nhàng ngày nắng” (ly kép hồng, phăng chùm, đồng tiền cam, cúc margaret, sao xanh, giấy kính trong)
update products set description = description || E'\nLy kép hồng · phăng chùm · đồng tiền cam · cúc margaret · sao xanh · giấy kính trong · ruy băng hồng\nRực rỡ — tươi vui — nhiều màu sắc.\nPhù hợp tặng sinh nhật, bạn gái, mẹ, chúc mừng, 20/11.'
  where id = 53 and coalesce(description, '') <> '' and position(E'\n' in description) = 0;

-- #56 Giỏ hoa yêu thương — “Một phiên bản pastel mới…” (ly kép trắng hồng, đồng tiền hồng, phăng đơn hồng, cúc margaret, sao xanh, giỏ cói)
update products set description = description || E'\nLy kép trắng hồng · đồng tiền hồng · phăng đơn hồng · cúc margaret · sao xanh · cỏ suối · giỏ cói · nơ hồng\nPastel — dịu dàng — đáng yêu.\nPhù hợp tặng mẹ, cô giáo, sinh nhật, chúc mừng, 20/11.'
  where id = 56 and coalesce(description, '') <> '' and position(E'\n' in description) = 0;

-- #57 Ngày trọng đại — “Bó hoa rực rỡ cho ngày đặc biệt” (hướng dương, đồng tiền trắng, phăng đơn hồng, phi yến trắng, giấy kraft)
update products set description = description || E'\nHướng dương · đồng tiền trắng · phăng đơn hồng · phi yến trắng · cỏ suối · giấy kraft · ruy băng đỏ đô\nRạng rỡ — tràn đầy năng lượng — đáng nhớ.\nPhù hợp tặng lễ tốt nghiệp, khai trương, thăng chức, chúc mừng.'
  where id = 57 and coalesce(description, '') <> '' and position(E'\n' in description) = 0;

-- Kiểm tra: 6 dòng dưới đây phải có đủ 4 dòng mô tả (so_dong = 4)
select id, name, array_length(string_to_array(description, E'\n'), 1) as so_dong, left(description, 50) as mo_ta
from products where id in (53, 56, 57, 58, 59, 60) order by id;
