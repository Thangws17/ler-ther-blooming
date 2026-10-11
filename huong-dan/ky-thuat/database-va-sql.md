# Database (Supabase) và file SQL

<!-- Tách từ CLAUDE.md (11/10/2026). Ghi chú kỹ thuật cho người sửa code / Claude — người dùng thường
     xem huong-dan/00-bat-dau-tu-day.md. Mỗi mục: lỗi đã từng xảy ra + cách làm đúng. Thêm bẫy mới vào ĐÚNG file chủ đề. -->

Bảng, hàm SQL, luật bảo mật, cách viết/chạy file SQL, sao lưu. Đọc trước khi sửa thứ gì trong `supabase/` hoặc chỗ ghi database.

- **`place_order` được định nghĩa lại ở 4 file SQL.** Bản hiện hành là `supabase/15_notifications_v2.sql` (11 tham số, có `p_email`). Ba bản cũ (10 tham số) đã dồn vào `supabase/da-thay-the/` — chạy vào là **lùi** hàm về bản cũ. Sửa RPC thì sửa trong `15_notifications_v2.sql`.
- **Hàm nhắc lịch `send_delivery_reminders()` chỉ còn ở `15_notifications_v2.sql`** (Brevo). File 16 trước đây định nghĩa
  lại bản Telegram/Resend cũ → chạy lại 16 là đè mất bản mới, mất email nhắc 8:30. File 16 giờ chỉ tạo extension + bảng
  `app_settings`; file 15 cũng tự tạo nền đó nên không phụ thuộc thứ tự. Mọi chữ ghép vào HTML email phải qua `html_esc()`,
  và chuỗi `'…' || cột` phải `coalesce` từng cột (1 cột null = cả dòng biến mất khỏi `string_agg`).
- **Kho ảnh: người lạ từng LIỆT KÊ được mọi file** (kể cả `expenses/` hoá đơn) qua `/storage/v1/object/list/images`
  dù bảng đã khoá (kiểm 01/10/2026). `supabase/27_khoa_liet_ke_anh.sql` thêm luật RESTRICTIVE `chi quan tri select` trên
  `storage.objects`. Link ảnh công khai vẫn xem được bình thường (kho public không qua luật SELECT).
- **Admin kiểm quyền sau đăng nhập** (`kiemQuyenQuanTri()` → rpc `la_quan_tri`): tài khoản không có trong `quan_tri` thấy
  cảnh báo đỏ `#canhBaoQuyen` thay vì danh sách trống không lời giải thích.
- **File SQL đánh số theo thứ tự chạy** (`01_` → `33_`; mục lục + "đã chạy chưa" ở `supabase/README.md`); `17_rls_lockdown.sql` luôn chạy cuối cùng khi dựng lại DB. Đổi tên file SQL thì phải sửa cả 2 thông báo trong `admin/index.html` đang nhắc tên file (`14_changelog_setup`, `03_order_phone_snapshot`) **và** bảng `SQL_DAU_HIEU`.
  **File SQL mới có thêm bảng/cột → thêm 1 dòng vào `SQL_DAU_HIEU` (admin, mục "Kiểm file SQL đã chạy chưa")**:
  Tổng quan tự đọc thử đúng cột đó, database báo "không có cột" là hiện khung vàng nhắc chạy file (11/10/2026).
  Và thêm 1 dòng vào bảng trong `supabase/README.md`.
- **Trạng thái đơn bị database khoá chỉ nhận 6 giá trị** (`supabase/19_order_status_check.sql`), phải
  khớp y hệt `ORDER_STATUSES` trong admin. Thêm/đổi tên trạng thái: sửa SQL **trước**, rồi mới sửa JS —
  ngược lại thì lưu đơn bị từ chối. Mọi chỗ ghi status đều phải lấy từ `ORDER_STATUSES`, đừng gõ tay chuỗi.
- **`gallery_categories` giờ CHỈ của Thư viện ảnh.** Không còn dùng chung với sản phẩm nữa —
  đổi tên / xoá nhóm ảnh không đụng gì tới mẫu hoa. Cột `products.category` vẫn còn nhưng
  **chỉ là ghi chú** (tên BST đầu tiên, cho dễ đọc file sao lưu) — đừng lọc/hiển thị theo nó.
- **Giá sản phẩm lưu dạng TEXT** (`"600,000đ"`, `"Liên hệ"`, `"Từ 2xx (Theo size order)"`) — luôn qua `fmtPrice()` (web) /
  `fmtPriceText()` (admin), cả hai gọi **`hienGia()`** trong dungchung.js; đừng coi là số. Trước 03/10 hai hàm đó dồn MỌI chữ số
  lại: "Từ 50000" → "50.000đ" (mất "Từ"), "Từ 300.000 - 500.000" → "300.000.500.000đ". Giá thấp nhất trang chủ dùng `soGiaDau()`.
- **Giá sản phẩm có loại dạng CHỮ CÓ SỐ**: `"Từ 2xx (Theo size order)"`. Viết SQL kiểu "bỏ hết ký tự
  không phải số" sẽ biến nó thành giá **2 đồng**. Xem `supabase/18_price_normalize.sql` để biết cách lọc
  đúng (chỉ đổi chuỗi thuần số tiền). **`place_order` từng dính đúng lỗi này** (đơn web đặt sản phẩm
  "Từ 2xx" bị ghi đơn giá 2đ) — đã sửa trong `15_notifications_v2.sql` bằng cùng điều kiện lọc.
- **Nguồn khách `orders.nguon` (SQL 33)**: chip "Khách tới từ" trong form Thêm/Sửa đơn (`NGUON_KHACH`, `nguonVe(k, v, coCot)`),
  form Thêm đơn nhớ lần trước (`lt_nguonCuoi`). Database KHÔNG khoá giá trị (chỉ ≤ 30 ký tự) — thêm chip chỉ sửa mảng JS.
  Đơn web tự ghi `'Web'` bằng trigger (vai `anon`), không sửa `place_order`. Chưa chạy SQL 33 → chip ẩn, hiện nhắc chạy file.
- **Mail nhắc trước giờ giao 2 tiếng** (`supabase/25_nhac_truoc_gio_giao.sql`, cron 5 phút/lần): SQL đọc giờ từ ghi chú bằng
  `gio_giao_cua()` — regex của nó phải khớp `MAU_GIO` trong dungchung.js. Chỉ nhắc đơn "Mới"/"Đã xác nhận"; cột
  `orders.nhac_gio_da_gui` nhớ đã nhắc cho giờ nào (đổi giờ → nhắc lại). Đổi "2 tiếng": sửa `v_truoc` trong SQL **và**
  `NHAC_TRUOC_PHUT` trong admin (dòng "Mail nhắc lúc …" dưới ô giờ + nhãn cam "còn 1g20"/đỏ "tới giờ" của `gioBadge()`).
- **Sao lưu Excel (`admin/xlsx.js` + `taiSaoLuu()` trong admin)** tự viết file .xlsx, KHÔNG thêm thư viện.
  Thêm bảng mới vào database thì thêm vào `SAO_LUU_BANG`; cột lạ tự nối vào cuối nên không mất dữ liệu,
  nhưng khai báo thì có tên cột tiếng Việt. **Tuyệt đối không thêm `app_settings`** (chứa token). Ngày sao
  lưu gần nhất nhớ theo TỪNG MÁY (localStorage `lt_saoLuuCuoi`), không phải toàn shop.
