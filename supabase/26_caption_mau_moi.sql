-- 26_caption_mau_moi.sql — Caption cho 7 mẫu hoa mới (#38 → #44), viết ngày 29/09/2026, cùng khuôn "tạp chí" với file 23.
-- Chạy lại bao nhiêu lần cũng được: mỗi dòng CHỈ đổi khi mô tả vẫn còn y như lúc viết caption.
-- Mẫu nào shop đã tự sửa mô tả sau đó thì được giữ nguyên, không bị ghi đè.

-- #38 Hồng chùm đỏ
update products set description = E'“Vang đỏ”\nHồng chùm đỏ · giấy trắng · nơ đỏ\nNồng nàn — đầy đặn — nổi bật.\nPhù hợp tặng người yêu, kỷ niệm, khai trương.\nHoa có đặt theo size'
  where id = 38 and coalesce(description, '') = E'';
-- #39 Kem hồng - So Sweet
update products set description = E'“Kem dâu”\nHồng chùm kem hồng · lá bạch đàn · giấy trắng · nơ hồng\nNgọt ngào — bồng bềnh — tinh khôi.\nPhù hợp tặng bạn gái, sinh nhật, 20/10.\nHoa có đặt theo size'
  where id = 39 and coalesce(description, '') = E'';
-- #40 Mix ly và hồng lạc thần (cùng ảnh với #23 → dùng lại caption của #23)
update products set description = E'“Hương hồng”\nLy hồng · hồng lạc thần · giấy trắng\nRực rỡ — dịu dàng — thơm nhẹ.\nPhù hợp tặng sinh nhật, kỷ niệm, tặng mẹ.\nHoa có đặt theo size'
  where id = 40 and coalesce(description, '') = E'';
-- #41 Hoa ly mix phi yến trắng (bó ly kép hồng — khác bó ly trắng #9)
update products set description = E'“Tấm chân tình”\nLy kép hồng · phi yến trắng · giấy trắng ren\nTươi tắn — ngọt ngào — món quà nhỏ chứa đầy chân tình.\nPhù hợp tặng sinh nhật, 20/10, tặng mẹ, bạn nữ.\nHoa có đặt theo size'
  where id = 41 and coalesce(description, '') = E'Món quà nhỏ chứa đầy tấm chân tình';
-- #42 Dành cho em
update products set description = E'“Trăm đoá thương”\nHồng chùm hồng phấn · giấy trắng\nĐầy đặn — dịu dàng — thương thật nhiều.\nPhù hợp tặng bạn gái, vợ, sinh nhật, 20/10.\nHoa có đặt theo size'
  where id = 42 and coalesce(description, '') = E'';
-- #43 Dành cho anh
update products set description = E'“Biển lặng”\nCẩm tú cầu xanh · hồng trắng · cẩm chướng trắng · giấy trắng\nĐiềm tĩnh — thanh lịch — vững vàng.\nPhù hợp tặng anh, bạn nam, lễ tốt nghiệp, sinh nhật.\nHoa có đặt theo size'
  where id = 43 and coalesce(description, '') = E'';
-- #44 Món quà nhỏ cho "Sếp"
update products set description = E'“Lời cảm ơn”\nCẩm chướng hồng · hồng chùm · cẩm chướng trắng · giấy hồng\nChỉn chu — tươi tắn — trân trọng.\nPhù hợp tặng sếp, đồng nghiệp, cô giáo, 20/10.\nHoa có đặt theo size'
  where id = 44 and coalesce(description, '') = E'';

-- Kiểm tra: 7 dòng dưới đây phải có mô tả bắt đầu bằng dấu “
select id, name, left(description, 40) as mo_ta from products where id between 38 and 44 order by id;
