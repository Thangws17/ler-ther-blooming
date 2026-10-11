# Bắt đầu từ đây 🌸

Trang này dành cho người **mới nhận dự án, không cần biết lập trình**. Đọc khoảng 10 phút là nắm được
dự án gồm những gì, nằm ở đâu và chạy ra sao.

## Dự án này là gì?

**Ler & Ther Blooming** là shop hoa nhỏ do 2 người làm bán thời gian. Dự án gồm 2 thứ:

1. **Website cho khách**: <https://lertherblooming.vn>. Khách xem mẫu hoa, bộ sưu tập, ảnh hoa đã giao, rồi đặt hoa.
2. **Trang quản lý cho shop** (gọi tắt là *admin*): <https://lertherblooming.vn/admin/>. Shop lên đơn, xem lịch giao,
   ghi chi phí, xem báo cáo, đăng mẫu hoa và ảnh. **Phần lớn đơn do shop tự nhập ở đây**, vì khách thường chốt qua
   Facebook/Zalo trước.

## Dự án gồm 3 mảnh ghép

```
   Khách (điện thoại / máy tính)                 Shop (Ler & Ther)
              │                                         │
              ▼                                         ▼
   ┌───────────────────────┐               ┌───────────────────────┐
   │  WEBSITE KHÁCH        │               │  TRANG QUẢN LÝ (admin)│
   │  lertherblooming.vn   │               │  …/admin/  (đăng nhập)│
   └───────────┬───────────┘               └───────────┬───────────┘
               │  chỉ ĐỌC (+ gửi đơn)                  │  đọc + GHI
               └───────────────┬───────────────────────┘
                               ▼
                 ┌───────────────────────────┐
                 │  SUPABASE = "kho dữ liệu"  │
                 │  đơn hàng, khách, mẫu hoa, │
                 │  chi phí, ảnh…             │
                 └───────────────────────────┘

   Mã nguồn (các file trong thư mục này) nằm trên GITHUB.
   GitHub tự đưa website lên mạng mỗi khi có bản cập nhật mới.
```

| Mảnh ghép | Là gì | Ở đâu |
|---|---|---|
| **Mã nguồn** | Các file tạo nên website + trang quản lý (chính thư mục này) | GitHub: `Thangws17/ler-ther-blooming` |
| **Nơi đặt web** | GitHub Pages: miễn phí, tự cập nhật khoảng 1 phút sau khi đẩy code mới lên | Tên miền `lertherblooming.vn` mua ở PA Việt Nam |
| **Kho dữ liệu** | Supabase (gói miễn phí): lưu đơn hàng, khách, mẫu hoa, ảnh; gửi email nhắc lịch | <https://supabase.com> → dự án `oijcwborkebjpavzyisl` |

Ngoài ra còn vài dịch vụ phụ: **Brevo** (gửi email báo đơn mới và nhắc lịch giao), **Google Analytics + Microsoft
Clarity** (đếm lượt xem web), **VietQR** (tạo mã QR chuyển khoản).

## Vì sao làm theo kiểu này?

- **Rẻ:** cả hệ thống chạy miễn phí, chỉ trả tiền tên miền.
- **Đơn giản:** không có máy chủ riêng, không phải cài đặt hay "build". Mỗi trang web chỉ là một file mở được bằng trình duyệt.
- **An toàn:** khách chỉ **đọc** được dữ liệu công khai (mẫu hoa, ảnh). Muốn xem đơn, sổ khách hay sửa bất cứ thứ gì
  đều phải đăng nhập bằng tài khoản nằm trong danh sách quản trị.

## Đọc tiếp theo thứ tự

| File | Nội dung |
|---|---|
| [01-ban-do-thu-muc.md](01-ban-do-thu-muc.md) | Mỗi thư mục, mỗi file dùng để làm gì; file nào **tuyệt đối đừng xoá** |
| [02-viec-hay-lam.md](02-viec-hay-lam.md) | Hướng dẫn từng bước: chạy thử, kiểm tra, đưa lên mạng, chạy file SQL, sao lưu |
| [03-khi-co-su-co.md](03-khi-co-su-co.md) | Web trắng, mail không tới, không đăng nhập được… thì xử lý thế nào |
| [04-du-lieu.md](04-du-lieu.md) | Kho dữ liệu có những "bảng" nào, mỗi bảng hiện ở đâu trên web/admin |
| [05-tu-dien.md](05-tu-dien.md) | Giải nghĩa các từ kỹ thuật hay gặp (database, SQL, push, cache…) |
| [06-quyet-dinh-da-chot.md](06-quyet-dinh-da-chot.md) | Những điều shop **đã quyết** và lý do, đọc trước khi định đổi hướng |

Phần dành cho **người sửa code** (hoặc Claude): [ky-thuat/](ky-thuat/), ghi lại mọi lỗi đã từng gặp và cách tránh.
File [CLAUDE.md](../CLAUDE.md) ở thư mục gốc là "sổ tay" mà Claude Code tự đọc mỗi lần làm việc với dự án.

## Ba nguyên tắc vàng

1. **Chạy kiểm tra trước khi đưa lên mạng.** Khách đang dùng web thật. Xem mục "Chạy kiểm tra" ở [02-viec-hay-lam.md](02-viec-hay-lam.md).
2. **Sao lưu mỗi tháng:** admin → Tổng quan → *Tải file sao lưu*, rồi cất lên Google Drive.
3. **Sửa web khách thì xem lại admin, và ngược lại.** Hai bên dùng chung dữ liệu, lệch nhau là sinh lỗi.
