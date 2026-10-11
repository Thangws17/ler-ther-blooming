# Bản đồ thư mục

Mọi file của dự án và công dụng của từng file. Ký hiệu **⛔** = đừng xoá, đừng đổi tên (sẽ hỏng web hoặc mất tên miền).

```
ler-ther-blooming/
│
├── index.html ............ Trang chủ                         → lertherblooming.vn/
├── san-pham.html ......... Danh sách mẫu hoa + lọc theo BST   → /san-pham
├── chi-tiet.html ......... Chi tiết 1 mẫu hoa + nút đặt       → /chi-tiet?id=12
├── khoanh-khac.html ...... Ảnh hoa thật đã giao               → /khoanh-khac
├── cau-chuyen.html ....... Câu chuyện của shop                → /cau-chuyen
├── lien-he.html .......... Liên hệ, bản đồ, mạng xã hội       → /lien-he
├── chinh-sach.html ....... Giao hàng, thanh toán, hỏi đáp     → /chinh-sach
├── 404.html .............. Trang báo "không tìm thấy" riêng của shop
│
├── dang-sau-nhung-bo-hoa.html ⛔ ┐ Tên trang CŨ, giờ chỉ tự chuyển sang trang mới.
├── san-pham-chi-tiet.html     ⛔ │ Link cũ đã chia sẻ trên Facebook/Zalo/Google
├── gallery.html               ⛔ ┘ vẫn trỏ vào đây → xoá là khách bấm vào bị lỗi.
│
├── css/style.css ......... Kiểu dáng (màu, chữ, bố cục) của toàn bộ web khách
├── js/
│   ├── main.js ........... Cách chạy của web khách: tải mẫu hoa, lọc, form đặt hoa…
│   └── dungchung.js ...... Phần DÙNG CHUNG cho cả web khách và admin (định dạng giá,
│                           biểu tượng, ảnh nhỏ, kiểm số điện thoại, bánh xe chọn giờ…)
├── images/ ............... Ảnh cố định: ảnh chia sẻ link (og-cover.jpg), biểu tượng Zalo.
│                           (Ảnh mẫu hoa KHÔNG nằm đây mà nằm trong kho ảnh Supabase.)
│
├── admin/
│   ├── index.html ........ TOÀN BỘ trang quản lý trong 1 file (~10.000 dòng).
│   │                       Có MỤC LỤC ở đầu file → dùng Ctrl+F để tìm phần cần sửa.
│   └── xlsx.js ........... Tạo file Excel cho nút "Tải file sao lưu"
│
├── supabase/ ............. Các file SQL dựng kho dữ liệu, ĐÁNH SỐ theo thứ tự chạy (01 → 33).
│   ├── README.md ......... Bảng liệt kê từng file: làm gì, đã chạy chưa ← đọc trước khi chạy
│   └── da-thay-the/ ...... File cũ đã bị thay thế. ĐỪNG chạy (chạy vào là lùi về bản cũ).
│
├── test/ ................. Kiểm tra tự động (dùng dữ liệu GIẢ, không đụng dữ liệu thật)
│   ├── index.html ........ Mở /test/ → bấm "Chạy tất cả"
│   ├── chay-tat-ca.py .... Cùng việc đó nhưng chạy bằng dòng lệnh
│   ├── test-*.html ....... 12 trang kiểm tra, mỗi trang kiểm 1 nhóm chức năng
│   ├── gia-lap-sb.js ..... "Database giả" cho các trang kiểm tra
│   ├── xem-admin.html .... Xem trang quản lý với dữ liệu giả (để xem / chụp màn hình giao diện)
│   └── xem-web.html ...... Xem web khách, mở sẵn form đặt hoa (không gửi đơn thật)
│
├── huong-dan/ ............ Bạn đang ở đây: tài liệu cho người mới
│   └── ky-thuat/ ......... Ghi chú kỹ thuật cho người sửa code (mọi lỗi đã gặp + cách tránh)
│
├── CLAUDE.md ............. Sổ tay Claude Code tự đọc mỗi lần làm việc với dự án
├── README.md ............. Giới thiệu ngắn (trang đầu tiên hiện ra trên GitHub)
├── serve.py .............. Chạy web thử trên máy: python serve.py → http://localhost:8765
├── serve.ps1 ............. Như trên + in link để mở thử trên điện thoại (cùng wifi)
├── CNAME ................. ⛔ Gắn tên miền lertherblooming.vn. Xoá file này là MẤT tên miền.
├── sitemap.xml, robots.txt  Chỉ đường cho Google (robots chặn Google vào /admin/)
└── .gitignore ............ Liệt kê những thứ KHÔNG đưa lên mạng (vd thư mục demo/)
```

## Những thứ chỉ có trên máy làm việc (không có trên GitHub)

- **`demo/`**: bản nháp các phương án giao diện đã đề xuất cho shop chọn, kèm ảnh chụp so sánh. Không ảnh hưởng gì tới web.
- **`.claude/`**: cài đặt riêng của Claude Code trên máy này.

## Tìm nhanh: muốn sửa X thì mở file nào?

| Muốn sửa… | Mở file | Ghi chú |
|---|---|---|
| Chữ cố định trên 1 trang web (tiêu đề, đoạn giới thiệu) | `<tên-trang>.html` | Chữ do shop nhập trong admin (mẫu hoa, chính sách, liên hệ) thì sửa trong **admin**, không sửa file |
| Màu sắc, cỡ chữ, khoảng cách của web khách | `css/style.css` | |
| Cách web khách tải và hiện dữ liệu, form đặt hoa | `js/main.js` | |
| Bất cứ thứ gì trong trang quản lý | `admin/index.html` | Xem mục lục ở đầu file |
| Định dạng giá, số điện thoại, biểu tượng, chọn giờ giao | `js/dungchung.js` | Sửa ở đây là **cả web lẫn admin** đổi theo |
| Cách tạo đơn, email báo đơn, nhắc lịch, chống spam | `supabase/15_notifications_v2.sql` | Sửa xong phải dán lại vào Supabase |
| Mail nhắc trước giờ giao 2 tiếng | `supabase/25_nhac_truoc_gio_giao.sql` | |

Mẹo: nhờ Claude Code ("sửa giúp mình…"). Claude đã có sổ tay CLAUDE.md nên biết phải sửa ở đâu và cần kiểm tra những gì.
