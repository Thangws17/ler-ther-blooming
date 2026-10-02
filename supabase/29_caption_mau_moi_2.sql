-- 29_caption_mau_moi_2.sql — Caption cho 3 mẫu mới (#45, #46, #47), viết ngày 02/10/2026, cùng khuôn "tạp chí" với file 23/26.
-- Không còn dòng "Hoa có đặt theo size" ở cuối: dòng đó giờ là THÔNG TIN CHUNG (SQL 28), tự hiện dưới mọi mẫu.
-- Chạy lại bao nhiêu lần cũng được: mỗi dòng CHỈ đổi khi mô tả vẫn còn y như lúc viết caption.
-- Mẫu nào shop đã tự sửa mô tả sau đó thì được giữ nguyên, không bị ghi đè.

-- #45 Mix garden Yêu Thương (bó giấy nhăn trắng, nơ hồng)
update products set description = E'“Gửi trọn yêu thương”\nCẩm chướng hồng · đồng tiền vàng chanh · cúc vàng · sao xanh · giấy nhăn trắng\nTươi tắn — rực rỡ — đầy ắp yêu thương.\nPhù hợp tặng sinh nhật, 20/10, tặng mẹ, bạn bè.'
  where id = 45 and coalesce(description, '') = E'Yêu thương';

-- #46 Mẫu chậu mini nhỏ xinh (chậu đất nung, hoa tươi, viết chữ lên chậu)
update products set description = E'“Khu vườn bỏ túi”\nChậu đất nung mini · hoa tươi · cỏ lá nhỏ · nơ cói\nNhỏ xinh — đáng yêu — để bàn làm việc rất hợp.\nPhù hợp tặng 20/10, đồng nghiệp, cô giáo, bạn bè.\nHoa chọn được: tulip, cẩm chướng, cúc, đồng tiền\nViết tên, lời chúc lên chậu theo yêu cầu'
  where id = 46 and coalesce(description, '') = E'';

-- #47 Song hành (cặp 2 bó nhỏ, giấy hoạ tiết nơ)
update products set description = E'“Có nhau”\nCẩm chướng hồng · cẩm chướng kem · giấy hoạ tiết nơ · ruy băng\nNgọt ngào — xinh xắn — có đôi có cặp.\nPhù hợp tặng bạn thân, cặp đôi, 20/10, kỷ niệm.'
  where id = 47 and coalesce(description, '') = E'';

-- Kiểm tra: 3 dòng dưới đây phải có mô tả bắt đầu bằng dấu “
select id, name, left(description, 40) as mo_ta from products where id in (45, 46, 47) order by id;
