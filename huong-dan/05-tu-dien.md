# Từ điển: giải nghĩa từ kỹ thuật

Xếp theo chữ cái. Từ in nghiêng là tên riêng trong dự án này.

| Từ | Nghĩa dễ hiểu |
|---|---|
| **Admin** | Trang quản lý dành riêng cho shop: `lertherblooming.vn/admin/`, phải đăng nhập |
| ***BST*** | Bộ sưu tập: nhóm mẫu hoa theo dịp (Trông Trăng, 20/10…). Khách lọc mẫu theo BST. Thay cho "danh mục" cũ |
| **Brevo** | Dịch vụ gửi email (miễn phí 300 mail/ngày): báo đơn mới, nhắc lịch giao, xác nhận đơn cho khách |
| **Cache** | Bản lưu tạm trong trình duyệt để lần sau mở nhanh hơn. Vì vậy đôi khi phải bấm **Ctrl+F5** mới thấy bản mới |
| **Changelog** | Nhật ký cập nhật: mỗi lần đổi web ghi lại 1 dòng (admin → tab Cập nhật) |
| **Clarity** | Công cụ của Microsoft xem lại cách khách bấm, cuộn trên web (ẩn danh) |
| **Claude Code** | Trợ lý AI sửa code ngay trong VS Code. Đọc `CLAUDE.md` để biết quy tắc của dự án |
| **CLAUDE.md** | "Sổ tay" cho Claude: kiến trúc, quy ước, mục lục các lỗi đã gặp |
| **Code / mã nguồn** | Các file tạo nên web (HTML, CSS, JS) |
| **Commit** | "Chụp" lại một lần thay đổi code kèm lời mô tả, lưu vào lịch sử. Chưa lên mạng |
| **CSP** | "Hàng rào" ghi trong mỗi trang, chỉ cho trang nói chuyện với vài địa chỉ đã duyệt. Chặn mã độc gửi dữ liệu ra ngoài |
| **CSS** | File quy định kiểu dáng: màu, cỡ chữ, khoảng cách (`css/style.css`) |
| **Cron** | Đồng hồ hẹn giờ trong database: 8:30 sáng gửi mail nhắc, 5 phút một lần kiểm đơn sắp tới giờ giao |
| **Database / cơ sở dữ liệu** | Nơi lưu dữ liệu (ở đây là Supabase). Giống bộ file Excel trên mạng |
| ***Database giả*** | Dữ liệu bịa trong các trang kiểm tra, để thử thoải mái mà không đụng dữ liệu thật |
| **Deploy / uplive / đưa lên mạng** | Làm cho bản code mới chạy trên web thật. Ở đây = `git push`, GitHub tự làm phần còn lại |
| **DNS / tên miền** | "Danh bạ" dẫn chữ `lertherblooming.vn` tới máy chủ GitHub. Mua và cài ở PA Việt Nam |
| **Git** | Phần mềm ghi lại lịch sử mọi thay đổi code, quay lại bản cũ lúc nào cũng được |
| **GitHub** | Trang web cất code + lịch sử (`github.com/Thangws17/ler-ther-blooming`) |
| **GitHub Pages** | Dịch vụ miễn phí của GitHub, đưa code lên thành website thật |
| **Google Analytics (GA4)** | Công cụ đếm lượt xem web, khách tới từ đâu |
| **HTML** | File nội dung + khung của 1 trang web (`index.html`, `san-pham.html`…) |
| **JS / JavaScript** | Phần "biết làm việc" của trang: tải dữ liệu, lọc, mở form, gửi đơn |
| ***Khoảnh khắc*** | Trang ảnh hoa thật đã giao (trong code vẫn tên `gallery`) |
| **Local / localhost** | Chạy thử ngay trên máy mình (`http://localhost:8765`), chỉ máy mình thấy |
| **Push** | Đẩy các commit lên GitHub. Với dự án này, push = **đưa lên mạng thật** |
| **Repo** | "Kho" chứa toàn bộ code của dự án trên GitHub |
| **RLS** | Luật bảo vệ từng bảng dữ liệu: ai được đọc, ai được sửa. Là "ổ khoá" chính của dự án |
| **RPC / hàm database** | Một đoạn xử lý chạy ngay trong database, ví dụ `place_order` tạo đơn |
| **Server / máy chủ** | Máy phục vụ trang web. Chạy thử ở máy thì `serve.py` đóng vai máy chủ |
| **SQL** | Ngôn ngữ ra lệnh cho database. File `.sql` trong `supabase/` là các "lệnh dựng kho" |
| **SQL Editor** | Ô trong Supabase để dán và chạy lệnh SQL |
| **Supabase** | Dịch vụ database + kho ảnh + đăng nhập mà dự án dùng (gói miễn phí) |
| **Test / kiểm tra tự động** | Trang tự bấm thử hàng nghìn tình huống rồi báo ✓ / ✕ (`/test/`) |
| **VietQR** | Dịch vụ tạo ảnh mã QR chuyển khoản có sẵn số tiền + nội dung |
| **VS Code** | Phần mềm để mở và sửa code (Claude Code chạy trong đó) |
