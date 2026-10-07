-- 30_caption_mau_moi_3.sql — Caption cho 2 mẫu mới (#49, #50) + sửa thành phần #47 theo tên shop đặt lại, viết 07/10/2026.
-- Cùng khuôn "tạp chí" với file 23/26/29. Dòng "Hoa có đặt theo size" không cần: đã là THÔNG TIN CHUNG (SQL 28).
-- Chạy lại bao nhiêu lần cũng được: mỗi dòng CHỈ đổi khi mô tả vẫn còn y như lúc viết caption.
-- Mẫu nào shop đã tự sửa mô tả sau đó thì được giữ nguyên, không bị ghi đè.

-- #49 Bó hoa nhỏ mini (BST Hoa Sự Kiện — đồng tiền trắng, hồng phấn, giấy trắng lót hồng)
update products set description = E'“Lời chào nhỏ”\nĐồng tiền trắng · hồng phấn · phăng kem · phi yến trắng · giấy trắng lót hồng\nNhỏ nhắn — trong trẻo — vừa vặn mọi dịp.\nPhù hợp tặng 20/10, cô giáo, đồng nghiệp, khai giảng, tốt nghiệp, sự kiện cần số lượng.'
  where id = 49 and coalesce(description, '') = E'“BST Sự kiện”';

-- #50 Ngày nhẹ nhàng ❤️ — GIỮ NGUYÊN 2 dòng shop đã viết, chỉ thêm chữ khoá + "Phù hợp tặng"
update products set description = E'“Bó hoa tạo cảm giác rất riêng”\nThược dược cam cá hồi · hoa hồng · phăng đơn và phi yến nhuộm\nDịu dàng — ấm áp — tinh tế.\nPhù hợp tặng 20/10, bạn gái, vợ, sinh nhật, kỷ niệm.'
  where id = 50 and coalesce(description, '') = E'“Bó hoa tạo cảm giác rất riêng”\nThược dược cam cá hồi · hoa hồng · phăng đơn và phi yến nhuộm';

-- #47 Chiết xạ và phăng chùm hồng bó — shop đã đổi tên cho đúng hoa; dòng thành phần đổi theo (bỏ "cẩm chướng hồng/kem")
update products set description = E'“Có nhau”\nChiết xạ · phăng chùm hồng · giấy hoạ tiết nơ · ruy băng\nNgọt ngào — xinh xắn — có đôi có cặp.\nPhù hợp tặng bạn thân, cặp đôi, 20/10, kỷ niệm.'
  where id = 47 and coalesce(description, '') = E'“Có nhau”\nCẩm chướng hồng · cẩm chướng kem · giấy hoạ tiết nơ · ruy băng\nNgọt ngào — xinh xắn — có đôi có cặp.\nPhù hợp tặng bạn thân, cặp đôi, 20/10, kỷ niệm.';

-- Kiểm tra: 3 dòng dưới đây phải có mô tả mới
select id, name, left(description, 60) as mo_ta from products where id in (47, 49, 50) order by id;
