-- 23_caption_san_pham.sql — Caption (mô tả) mới cho 28 mẫu hoa, viết ngày 24/09/2026.
-- Chạy lại bao nhiêu lần cũng được: mỗi dòng CHỈ đổi khi mô tả vẫn còn y như lúc viết caption.
-- Mẫu nào shop đã tự sửa mô tả sau đó thì được giữ nguyên, không bị ghi đè.
-- Muốn sửa caption nào: vào admin tab Sản phẩm, mở mẫu đó, sửa ô Mô tả như bình thường.

-- #36 Đèn ông sao nở hoa - Ver3
update products set description = E'“Hội trăng rằm”\nĐèn ông sao treo tay · đồng tiền · hồng trắng\nRộn ràng — nhiều màu — vui tươi.\nPhù hợp tặng dịp Trung thu.\nKích thước: 13cm và 23cm\nTặng kèm: túi và đèn nháy'
  where id = 36 and coalesce(description, '') = E'Đèn ông sao được trang trí bởi hoa tươi\nKích thước: 13cm và 23cm \nTặng kèm: Túi và đèn nháy';
-- #17 Hồng chiết xạ
update products set description = E'“Mây hồng”\nHồng chiết xạ · giấy trắng\nMềm mại — ngọt ngào — rất "em xinh".\nPhù hợp tặng bạn gái, sinh nhật, kỷ niệm.\nHoa có đặt theo size'
  where id = 17 and coalesce(description, '') = E'';
-- #21 Hồng chùm Red Lace
update products set description = E'“Ren đỏ”\nHồng chùm Red Lace · giấy đen\nNồng nàn — quyến rũ — sâu lắng.\nPhù hợp tặng người yêu, lễ kỷ niệm, Valentine.\nHoa có đặt theo size'
  where id = 21 and coalesce(description, '') = E'Hoa có đặt theo size';
-- #32 Viên kẹo hồng - Plume
update products set description = E'“Kẹo bông”\nHồng Plume · giấy hồng\nTròn trịa — ngọt ngào — tan chảy.\nPhù hợp tặng bạn gái, sinh nhật, kỷ niệm.\nHoa có đặt theo size'
  where id = 32 and coalesce(description, '') = E'';
-- #31 Mix Chiết Xạ và Sophia
update products set description = E'“Tổ ấm”\nHồng chiết xạ · Sophia · tổ cỏ khô · nơ lụa trắng\nĐầy đặn — hoành tráng — thật đặc biệt.\nPhù hợp tặng lễ kỷ niệm, cầu hôn, sinh nhật người thương.\nHoa có đặt theo size'
  where id = 31 and coalesce(description, '') = E'';
-- #23 Mix ly và hồng lạc thần
update products set description = E'“Hương hồng”\nLy hồng · hồng lạc thần · giấy trắng\nRực rỡ — dịu dàng — thơm nhẹ.\nPhù hợp tặng sinh nhật, kỷ niệm, tặng mẹ.\nHoa có đặt theo size'
  where id = 23 and coalesce(description, '') = E'';
-- #30 Ly mix - Tone Bờ Ling
update products set description = E'“Bling bling”\nLy hồng đốm · hồng kem · giấy kraft\nLấp lánh — nổi bật — ngọt ngào.\nPhù hợp tặng bạn nữ, sinh nhật, 20/10.\nHoa có đặt theo size'
  where id = 30 and coalesce(description, '') = E'';
-- #25 Mix Garden - Tone Hồng Pastel
update products set description = E'“Người bên cạnh”\nHồng · đồng tiền · sao xanh · tone hồng pastel\nDịu dàng — yêu thương — cho người phụ nữ đang ở cạnh bạn.\nPhù hợp tặng bạn gái, vợ, mẹ, 20/10.\nHoa có đặt theo size'
  where id = 25 and coalesce(description, '') = E'Bó hoa tone pastel đem lại cảm giác yêu thương người phụ nữ đang ở cạnh bạn';
-- #26 Ly mix - Tone dịu dàng
update products set description = E'“Hồng trên nền đêm”\nLy hồng · hồng trắng nhỏ · giấy đen\nDịu dàng — nổi bật — có điểm nhấn riêng.\nPhù hợp tặng sinh nhật, kỷ niệm, bạn nữ.\nHoa có đặt theo size'
  where id = 26 and coalesce(description, '') = E'Hoa có đặt theo size';
-- #34 Đèn ông sao nở hoa - Ver2
update products set description = E'“Ánh trăng”\nĐèn ông sao khung tre · ly trắng · hoa vàng chanh\nThanh mát — trong trẻo — dịu nhẹ.\nPhù hợp tặng dịp Trung thu.\nKích thước: 13cm và 23cm\nTặng kèm: túi và đèn nháy'
  where id = 34 and coalesce(description, '') = E'Đèn ông sao được trang trí bởi hoa tươi\nKích thước: 13cm và 23cm \nTặng kèm: Túi và đèn nháy';
-- #33 Đèn ông sao nở hoa
update products set description = E'“Trăng rằm hoa nở”\nĐèn ông sao khung tre · ly hồng · hồng kem · sao xanh\nẤm áp — truyền thống — tươi mới.\nPhù hợp tặng dịp Trung thu.\nKích thước: 13cm và 23cm\nTặng kèm: túi và đèn nháy'
  where id = 33 and coalesce(description, '') = E'Đèn ông sao được trang trí bởi hoa tươi\nKích thước: 13cm và 23cm \nTặng kèm: Túi và đèn nháy';
-- #9 Hoa ly mix phi yến trắng
update products set description = E'“Lụa trắng”\nHoa ly trắng · phi yến · giấy nâu\nSang trọng — nhã nhặn — tinh tế.\nPhù hợp tặng sinh nhật, kỷ niệm, lễ tốt nghiệp.\nHoa có đặt theo size'
  where id = 9 and coalesce(description, '') = E'Sự kết hợp giữa hoa ly, phi yến và giấy gói màu nâu tạo cảm giác sang trọng, nhã nhặn nhưng không kém phần tinh tế.\nPhù hợp tặng sinh nhật, kỉ niệm hoặc ngày lễ tốt nghiệp\nHoa có đặt theo size';
-- #10 Mix Garden
update products set description = E'“Khu vườn nhỏ”\nHồng trắng · sao xanh · cúc margaret\nNhiều màu sắc — trong trẻo — dễ chịu.\nPhù hợp tặng sinh nhật, kỷ niệm, lễ tốt nghiệp.\nHoa có đặt theo size'
  where id = 10 and coalesce(description, '') = E'Sự kết hợp giữa hồng trắng, sao xanh và cúc margaret tạo thành khu vườn nhỏ nhiều màu sắc.\nPhù hợp tặng sinh nhật, kỉ niệm hoặc lễ tốt nghiệp\nHoa có đặt theo size';
-- #15 Sofia
update products set description = E'“Ghi dấu vào tim”\nHồng Sofia đỏ · điểm hoa kem · giấy đen\nNồng nàn — nhẹ nhàng — khó quên.\nPhù hợp tặng người thương, lễ kỷ niệm, 20/10.\nHoa có đặt theo size'
  where id = 15 and coalesce(description, '') = E'Sofia nhẹ nhàng ghi dấu vào tim - Hoa có đặt theo size';
-- #1 Tulip x cỏ suối
update products set description = E'“Buổi hẹn đầu”\nTulip trắng · cỏ suối · giấy đen\nTrưởng thành — tinh tế — bay bổng.\nPhù hợp tặng first date, lễ kỷ niệm.\nHoa có đặt theo size'
  where id = 1 and coalesce(description, '') = E'Tulip tượng trưng cho tình yêu trưởng thành, tinh tế, kết hợp cùng cỏ suối tạo độ bay bổng và nhẹ nhàng.\nPhù hợp tặng first date hoặc lễ kỉ niệm.\nHoa có đặt theo size';
-- #28 Lam Tinh mix cúc
update products set description = E'“Trời xanh sau mưa”\nLam tinh · điểm cúc vàng · giấy ren mộc\nTrong trẻo — khoẻ khoắn — không điệu đà.\nPhù hợp tặng bạn nam, tốt nghiệp, chúc mừng.\nHoa có đặt theo size'
  where id = 28 and coalesce(description, '') = E'Lam tinh kết hợp vs điểm nhẹ cúc vàng - Hoa có đặt theo size';
-- #24 Sofia mix phăng chùm
update products set description = E'“Má hồng”\nHồng Sofia · phăng chùm · cúc trắng · giấy kraft\nTươi tắn — ngọt ngào — tinh nghịch.\nPhù hợp tặng bạn gái, sinh nhật, 20/10.\nHoa có đặt theo size'
  where id = 24 and coalesce(description, '') = E'Hoa có đặt theo size';
-- #16 Hồng song hỉ x cúc tana
update products set description = E'“San hô ngày hè”\nHồng song hỉ · cúc tana\nRạng rỡ — ấm áp — tràn niềm vui.\nPhù hợp tặng sinh nhật, chúc mừng.\nHoa có đặt theo size'
  where id = 16 and coalesce(description, '') = E'Hoa có đặt theo size';
-- #11 Hoa ly nhuộm mix
update products set description = E'“Đêm nhung đỏ”\nLy kép · phi yến · phăng nhuộm đỏ · giấy đen\nHuyền bí — khác biệt — sang trọng.\nPhù hợp tặng sinh nhật, lễ tốt nghiệp.\nHoa có đặt theo size'
  where id = 11 and coalesce(description, '') = E'Hoa ly kép, phi yến và phăng nhuộm đỏ tạo cảm giác khác biệt. Kết hợp với gói giấy màu đen mang đến cảm giác huyền bí nhưng cũng không kém phần sang trọng và tinh tế.\nPhù hợp tặng sinh nhật hoặc lễ tốt nghiệp\nHoa có đặt theo size';
-- #2 Lam tinh x cúc migarret
update products set description = E'“Sáng mai trong veo”\nLam tinh · cúc margaret · giấy kraft\nNhẹ nhàng — tinh khiết — mộc mạc.\nPhù hợp tặng tốt nghiệp, tỏ tình.\nHoa có đặt theo size'
  where id = 2 and coalesce(description, '') = E'Lam tinh mix cỏ suối tạo cảm giác nhẹ nhàng và tinh khiết.\nPhù hợp tặng tốt nghiệp hoặc tỏ tình\nHoa có đặt theo size';
-- #3 Cúc Ping pong và phăng chùm
update products set description = E'“Ngày vui rộn ràng”\nCúc ping pong · phăng chùm · giấy đen\nTươi vui — nhiều màu sắc — nổi bật.\nPhù hợp tặng tốt nghiệp, sinh nhật.\nHoa có đặt theo size'
  where id = 3 and coalesce(description, '') = E'Bó hoa tươi đầy màu sắc với cúc và hồng nhẹ nhàng - Hoa có đặt theo size';
-- #4 Hồng Ecuador rực rỡ
update products set description = E'“Lời thương cô đọng”\nHồng Ecuador đỏ · hoa trắng điểm xuyết · giấy kraft\nSang trọng — đơn giản — nhiều tình cảm.\nPhù hợp tặng người thương, lễ kỷ niệm, 20/10.\nHoa có đặt theo size'
  where id = 4 and coalesce(description, '') = E'Sang trọng, đơn giản cô đọng nhiều tình cảm - Hoa có đặt theo size';
-- #18 Hướng dương tốt nghiệp
update products set description = E'“Chặng đường mới”\nHướng dương · gấu tốt nghiệp · giấy trắng\nRực rỡ — tự hào — hướng về phía trước.\nPhù hợp tặng lễ tốt nghiệp, bảo vệ luận văn.\nHoa có đặt theo size'
  where id = 18 and coalesce(description, '') = E'Hoa có đặt theo size';
-- #20 Hướng dương dễ thương
update products set description = E'“Ngày nắng đẹp”\nHướng dương · hồng kem · hoa trắng · giấy kraft\nVui tươi — dễ thương — ấm áp.\nPhù hợp tặng sinh nhật, tốt nghiệp, bạn bè.\nHoa có đặt theo size'
  where id = 20 and coalesce(description, '') = E'Hoa có đặt theo size';
-- #19 Hướng dương ngược nắng
update products set description = E'“Ngược nắng”\nHướng dương · sao xanh · giấy xanh navy\nMạnh mẽ — lạc quan — nổi bật.\nPhù hợp tặng tốt nghiệp, khai trương, chúc mừng thành công.\nHoa có đặt theo size'
  where id = 19 and coalesce(description, '') = E'Hoa có đặt theo size';
-- #5 Lan tường x lam tinh x thủy tinh
update products set description = E'“Quý ông lịch lãm”\nLan tường trắng · lam tinh · thuỷ tinh xanh\nLịch sự — sang trọng — hài hoà.\nPhù hợp tặng bạn nam dịp sinh nhật, kỷ niệm.\nHoa có đặt theo size'
  where id = 5 and coalesce(description, '') = E'Sự hòa quyện của các loài hoa tạo cảm giác lịch sự và sang trọng.\nPhù hợp tặng bạn nam nhân dịp sinh nhật hoặc kỉ niệm.\nHoa có đặt theo size';
-- #6 Tone vàng hồng pastel dịu kha
update products set description = E'“Nắng sớm màu kem”\nĐồng tiền kép · phăng chùm hồng · giấy trắng\nDễ thương — tươi mới — dịu dàng.\nPhù hợp tặng bạn nữ dịp sinh nhật, kỷ niệm, tốt nghiệp.\nHoa có đặt theo size'
  where id = 6 and coalesce(description, '') = E'Sự kết hợp của hoa đồng tiền kép với phăng chùm hồng tạo cảm giác dễ thương và tươi mới.\nPhù hợp tặng bạn nữ nhân dịp sinh nhật, kỷ niệm hoặc tốt nghiệp\nHoa có đặt theo size';
-- #8 Bó Hoa Mix Đồng Nội
update products set description = E'“Đồng nội nhỏ xinh”\nBó nhỏ · đồng tiền · hồng\nGọn gàng — tươi tắn — hợp đặt số lượng nhiều.\nPhù hợp tặng sự kiện 8/3, 20/10, tri ân.\nHoa có đặt theo size'
  where id = 8 and coalesce(description, '') = E'Các bó hoa nhỏ dùng cho sự kiện như ngày lễ 8/3, 20/10, tri ân,...\nHoa có đặt theo size';

-- Kết quả: số mẫu đã có caption mới (đủ thì là 28)
select count(*) as so_mau_da_co_caption_moi from products
  where description like '“%';
