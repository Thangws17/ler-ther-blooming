# File SQL: dựng và cập nhật kho dữ liệu (Supabase)

**Cách chạy:** Supabase → **SQL Editor** → New query → dán toàn bộ nội dung file → **Run**.
Mọi file đều **chạy lại được nhiều lần** mà không hỏng dữ liệu. Không chắc đã chạy chưa thì cứ chạy lại.

- Số đầu tên file = **thứ tự chạy** khi dựng lại database từ đầu. `17_rls_lockdown.sql` chạy **sau cùng** trong lần dựng lại.
- **Đừng chạy** file trong [`da-thay-the/`](da-thay-the/): đó là bản cũ, chạy vào là lùi chức năng.
- Admin → **Tổng quan** tự kiểm các file có ✓ ở cột "Tự kiểm": database thiếu file nào sẽ hiện khung vàng ghi đúng tên file.

**Loại file:**
🧱 *Cấu trúc*: tạo bảng / cột / hàm, bắt buộc khi dựng lại. ·
🔒 *Bảo mật*: luật ai được đọc / sửa. ·
📝 *Dữ liệu một lần*: nhập nội dung (mô tả mẫu, BST…). Chạy lại không đè chữ shop đã sửa. Dựng database mới thì **không cần** chạy.

**Trạng thái** kiểm ngày **11/10/2026** bằng cách đọc thử dữ liệu công khai (chỉ đọc). ✅ = thấy dấu hiệu đã chạy;
☑️ = không kiểm được từ bên ngoài, nhưng theo ghi chép là đã chạy.

| # | File | Làm gì | Loại | Trạng thái | Tự kiểm |
|---|---|---|---|---|---|
| 01 | `01_orders_setup_full.sql` | Bảng **đơn hàng** + **sổ khách**, hàm tạo đơn bản đầu | 🧱 | ✅ | ✓ |
| 02 | `02_phase1_orders.sql` | Đơn giá, phí ship, tổng tiền tự tính | 🧱 | ✅ | ✓ |
| 03 | `03_order_phone_snapshot.sql` | Lưu SĐT ngay trên đơn (xoá khách không mất SĐT ở đơn cũ) | 🧱 | ✅ | ✓ |
| 04 | `04_phone_normalize.sql` | Chuẩn hoá SĐT (`0912 345 678` = `+84912345678`) | 🧱 | ☑️ | |
| 05 | `05_customers_insert_policy.sql` | Cho admin thêm khách trực tiếp | 🔒 | ☑️ | |
| 06 | `06_orders_image.sql` | Ảnh riêng cho đơn | 🧱 | ✅ | ✓ |
| 07 | `07_expenses_setup.sql` | **Sổ chi phí** | 🧱 | ✅ | ✓ |
| 08 | `08_expenses_image.sql` | Ảnh hoá đơn cho chi phí | 🧱 | ✅ | ✓ |
| 09 | `09_materials_setup.sql` | **Sổ nguyên liệu** (gợi ý giá khi ghi chi phí) | 🧱 | ✅ | ✓ |
| 10 | `10_gallery_categories_setup.sql` | Nhóm ảnh (album) Khoảnh khắc | 🧱 | ✅ | ✓ |
| 11 | `11_categories_unify.sql` | Gộp danh mục cũ (lịch sử, nay đã thay bằng BST) | 📝 | ☑️ | |
| 12 | `12_policy_migration.sql` | Nội dung trang Chính sách sửa được trong admin | 🧱 | ✅ | ✓ |
| 13 | `13_contact_hero_sides.sql` | 2 ảnh phụ trang chủ (nay đã ẩn, cột vẫn giữ) | 🧱 | ✅ | ✓ |
| 14 | `14_changelog_setup.sql` | **Nhật ký cập nhật** | 🧱 | ✅ | ✓ |
| 15 | `15_notifications_v2.sql` | ⭐ Hàm **tạo đơn** `place_order` (bản đang dùng), email báo đơn mới / xác nhận cho khách / nhắc lịch 8:30, chống spam. **Sửa logic tạo đơn = sửa file này.** Cấu hình Brevo ghi ở cuối file | 🧱🔒 | ☑️ | |
| 16 | `16_reminders_setup.sql` | Nền cho email tự động (hẹn giờ + gửi mạng). File 15 đã tự làm, giữ cho đủ số | 🧱 | ☑️ | |
| 17 | `17_rls_lockdown.sql` | Khoá ghi: khách chỉ đọc, ghi phải đăng nhập. **Chạy sau cùng** khi dựng lại | 🔒 | ☑️ | |
| 18 | `18_price_normalize.sql` | Chuẩn hoá giá cũ `350,000đ` → `350000` (không đụng giá chữ "Từ 2xx") | 📝 | ☑️ | |
| 19 | `19_order_status_check.sql` | Database chỉ nhận đúng 6 trạng thái đơn | 🔒 | ☑️ | |
| 20 | `20_analytics_settings.sql` | Ô mã Google Analytics + Clarity | 🧱 | ✅ | ✓ |
| 21 | `21_collections.sql` | **Bộ sưu tập** (thay danh mục), 1 mẫu nằm được nhiều bộ | 🧱 | ✅ | ✓ |
| 22 | `22_bst_cua_ler.sql` | 4 BST đầu tiên của Ler (chỉ có tác dụng lần đầu) | 📝 | ✅ | |
| 23 | `23_caption_san_pham.sql` | Mô tả "tạp chí" cho 28 mẫu đầu | 📝 | ✅ | |
| 24 | `24_chi_quan_tri.sql` | ⭐ **Chỉ tài khoản shop** (bảng `quan_tri`) được xem đơn / sửa dữ liệu. Thêm người quản trị: xem đầu file | 🔒 | ✅ | ✓ |
| 25 | `25_nhac_truoc_gio_giao.sql` | Email nhắc **trước giờ giao 2 tiếng** (5 phút kiểm 1 lần) | 🧱 | ✅ | ✓ |
| 26 | `26_caption_mau_moi.sql` | Mô tả mẫu #38–#44 | 📝 | ✅ | |
| 27 | `27_khoa_liet_ke_anh.sql` | Người lạ không liệt kê được danh sách file trong kho ảnh | 🔒 | ✅ | |
| 28 | `28_thong_tin_chung.sql` | "Thông tin chung" dưới mọi mẫu (sửa ở admin) | 🧱 | ✅ | ✓ |
| 29 | `29_caption_mau_moi_2.sql` | Mô tả mẫu #45–#47 | 📝 | ✅ | |
| 30 | `30_caption_mau_moi_3.sql` | Mô tả mẫu #49, #50 + sửa #47 | 📝 | ✅ | |
| 31 | `31_thanh_toan.sql` | Trạng thái **thanh toán / cọc**, tài khoản nhận tiền, nhật ký đổi tài khoản. Chạy xong nên chạy lại 15 | 🧱🔒 | ✅ | ✓ |
| 32 | `32_caption_mau_moi_4.sql` | Mô tả mẫu #51, #52 | 📝 | ✅ | |
| 33 | `33_nguon_khach.sql` | **Nguồn khách** của đơn; đơn web tự ghi "Web" | 🧱 | ✅ | ✓ |

## Thêm file SQL mới

1. Đặt tên theo số tiếp theo: `34_ten_ngan_gon.sql`. Viết sao cho **chạy lại được** (`create table if not exists`,
   `add column if not exists`…), có đoạn chú thích đầu file nói "vì sao cần".
2. Có bảng mới → thêm tên bảng vào danh sách trong `24_chi_quan_tri.sql` (luật "chỉ quản trị") và `SAO_LUU_BANG` (admin, sao lưu Excel).
3. Có bảng / cột mới → thêm 1 dòng vào `SQL_DAU_HIEU` trong `admin/index.html` (Ctrl+F `SQL_DAU_HIEU`) để Tổng quan tự nhắc khi chưa chạy.
4. Thêm 1 dòng vào bảng trên.

Ghi chú kỹ thuật (các bẫy đã gặp với SQL): [../huong-dan/ky-thuat/database-va-sql.md](../huong-dan/ky-thuat/database-va-sql.md).
