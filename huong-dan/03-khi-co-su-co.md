# Khi có sự cố

Tra theo **triệu chứng**. Cách nhanh nhất thường là: chụp màn hình + mô tả bấm gì thì bị, gửi cho Claude Code.
Claude sẽ mở sẵn đúng màn hình đó trên máy để xem cùng.

## Web khách

| Triệu chứng | Nguyên nhân hay gặp | Làm gì |
|---|---|---|
| Vừa đưa bản mới lên mà web chưa đổi | GitHub cần ~1–2 phút; trình duyệt còn giữ bản cũ | Đợi 2 phút → **Ctrl+F5**. Vẫn chưa đổi: mở GitHub → repo → tab **Actions**, xem dòng "pages build and deployment" có bị **đỏ** không (xem mục "Đưa lên mạng bị lỗi" bên dưới) |
| Web trắng, hoặc chỉ hiện khung xám chờ mãi | Supabase tạm dừng / mạng chập chờn / lỗi code mới | Mở <https://supabase.com>: dự án có bị **Paused** không (gói miễn phí tự dừng nếu cả tuần không ai dùng) → bấm **Restore**. Nếu vừa đưa bản mới lên → báo Claude ngay, kèm ảnh chụp |
| Mẫu hoa / bộ sưu tập không hiện | Bộ sưu tập đang tắt hoặc chưa tới ngày hẹn | Admin → **Bộ sưu tập**: xem nhãn "Đang tắt / Chờ tới …". Nút **Tất cả** trên trang Sản phẩm luôn hiện mọi mẫu |
| Ảnh tải chậm | Ảnh cũ chưa có bản nhỏ | Admin → **Tổng quan** → Công cụ → **Tạo ảnh nhỏ cho ảnh cũ** → Bắt đầu (bấm 1 lần là xong) |
| Khách báo "không gửi được đơn", web mời nhắn Zalo | Chống spam: 1 số điện thoại tối đa 3 đơn / 10 phút, cả web tối đa 20 đơn / 10 phút | Bình thường, chỉ để chặn kẻ phá. Nhận đơn qua Zalo rồi tự lên đơn trong admin |
| Gõ `lertherblooming.vn` không vào được | Tên miền hết hạn / cài đặt tên miền bị đổi / mất file `CNAME` | Kiểm hạn tên miền ở **PA Việt Nam**. GitHub → repo → **Settings → Pages**: ô Custom domain phải là `lertherblooming.vn`. File `CNAME` phải còn trong thư mục dự án |

## Trang quản lý (admin)

| Triệu chứng | Nguyên nhân hay gặp | Làm gì |
|---|---|---|
| Khung **đỏ** "Tài khoản này chưa có trong danh sách quản trị" | Đăng nhập bằng email chưa được cấp quyền | Thêm email đó vào bảng `quan_tri` (hướng dẫn ở đầu file `supabase/24_chi_quan_tri.sql`) |
| Khung **vàng** "Database còn thiếu … file cài đặt" | Có file SQL chưa chạy (thường là file mới) | Chạy đúng các file được ghi trong khung (xem [02-viec-hay-lam.md](02-viec-hay-lam.md) mục 4) rồi F5 |
| Lưu không được, báo hết phiên / không có quyền | Phiên đăng nhập hết hạn | Đăng xuất → đăng nhập lại |
| Danh sách đơn trống trơn | Đang bật bộ lọc (ngày, trạng thái, ô tìm) | Bấm **Xóa lọc** |
| Chip "Khách tới từ" không hiện | Chưa chạy `33_nguon_khach.sql` | Chạy file đó |
| Máy mới vào admin bị đếm vào lượt xem web | Máy đó chưa đăng nhập admin lần nào | Đăng nhập admin 1 lần trên máy đó (nhớ theo từng máy, từng trình duyệt) |

## Email tự động không tới

Email đi qua **Brevo** (<https://brevo.com>, miễn phí 300 mail/ngày). Kiểm theo thứ tự:

1. Xem thư mục **Spam / Quảng cáo** của hộp thư.
2. Đăng nhập Brevo → xem còn hạn mức không, email người gửi còn được xác minh không.
3. Supabase → **SQL Editor**, chạy câu sau để xem 10 lần gửi gần nhất có lỗi không:
   ```sql
   select jobname, status, return_message, start_time
   from cron.job_run_details join cron.job using (jobid)
   order by start_time desc limit 10;
   ```
4. Nhắc trước giờ giao chỉ chạy với đơn có dòng **"Giờ giao: 15h30"** trong ghi chú, trạng thái *Mới* hoặc *Đã xác nhận*.
5. Vẫn không được → chạy lại `supabase/15_notifications_v2.sql` (và `25_nhac_truoc_gio_giao.sql`). Phần cấu hình Brevo
   (mã API, email gửi, email nhận) được ghi chú ở **cuối file 15**.

## Đưa lên mạng bị lỗi (GitHub Actions đỏ)

GitHub tự chuyển các file `.md` (tài liệu) thành trang web. Nếu một file `.md` có chứa ký hiệu `{` + `{` hoặc `{` + `%`
viết liền nhau, bước này **hỏng** và cả bản cập nhật không lên được. `python test/chay-tat-ca.py` đã tự kiểm lỗi này.
Thấy đỏ thì mở dòng lỗi trong tab Actions, chép gửi Claude.

## Lỡ xoá nhầm / sửa nhầm

- **Dữ liệu** (đơn, khách, mẫu hoa…): mở file sao lưu Excel gần nhất để xem lại và nhập lại tay. Supabase gói miễn phí
  **không** có nút khôi phục, nên sao lưu mỗi tháng rất quan trọng.
- **Code** (file trong dự án): mọi phiên bản cũ đều còn trên GitHub. Nhờ Claude "lấy lại file X như bản hôm qua".

## Kiểm tra tự động báo đỏ

**Đừng đưa lên mạng.** Chép nguyên dòng đỏ (có "mong đợi … / nhận được …") gửi Claude. Nếu bạn không sửa gì mà test
vẫn đỏ, có thể là test cũ "hết hạn" vì ghi cứng ngày tháng. Claude sẽ sửa lại test cho tính theo ngày hôm nay.
