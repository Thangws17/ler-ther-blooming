# Việc hay làm: hướng dẫn từng bước

Mọi lệnh dưới đây gõ trong **Terminal của VS Code** (menu *Terminal → New Terminal*), đứng ở thư mục dự án.
Không quen gõ lệnh? Cứ nói với Claude Code: *"chạy thử web cho mình"*, *"chạy kiểm tra"*… và Claude sẽ làm giúp.

---

## 1. Chạy thử web trên máy

```bash
python serve.py
```

Rồi mở <http://localhost:8765/> (web khách) hoặc <http://localhost:8765/admin/> (trang quản lý).

- Dùng `serve.py`, **đừng dùng** `python -m http.server`: web bỏ đuôi `.html` trong đường dẫn, server có sẵn của Python không hiểu kiểu đó nên báo lỗi 404 khắp nơi.
- Không mở file `.html` bằng cách nhấp đúp, vì sẽ lỗi.
- ⚠️ Bản chạy thử **dùng dữ liệu thật**. Bấm xoá trong admin ở máy cũng là xoá thật.

### Xem thử trên điện thoại

```powershell
.\serve.ps1        # chạy server + in ra đường link để mở trên điện thoại
```

Điện thoại phải dùng **cùng wifi** với máy tính. Đổi chỗ làm việc thì địa chỉ đổi theo, cứ chạy lại `serve.ps1` là có link mới.

Lần đầu cần mở cổng 8765 trên tường lửa Windows (chỉ làm **một lần**, mở PowerShell bằng quyền Admin):

```powershell
New-NetFirewallRule -DisplayName 'Ler Ther local dev 8765' -Direction Inbound -Action Allow `
  -Protocol TCP -LocalPort 8765 -Profile Any -RemoteAddress LocalSubnet
```

Wifi chung (quán cà phê, toà nhà) hay chặn các máy nói chuyện với nhau. Khi đó bật **điểm phát wifi trên điện thoại**,
cho máy tính kết nối vào, rồi chạy lại `serve.ps1`.

---

## 2. Chạy kiểm tra tự động (bắt buộc trước khi đưa lên mạng)

Có 12 trang kiểm tra, tổng cộng khoảng **1.000 ca thử**: giá, form, lịch, bảo mật, giao diện điện thoại… Các trang này dùng **dữ liệu giả**,
chạy bao nhiêu lần cũng không đụng đơn thật.

**Cách 1, bấm nút:** đang chạy `serve.py` thì mở <http://localhost:8765/test/> → bấm **Chạy tất cả** → chờ 4–6 phút,
để nguyên tab đó trên màn hình. Xong sẽ hiện ✓ xanh hoặc ✕ đỏ cho từng trang.

**Cách 2, dòng lệnh** (mở thêm 1 cửa sổ Terminal, cửa sổ kia vẫn đang chạy `serve.py`):

```bash
python test/chay-tat-ca.py
```

Cuối cùng in ra `TỔNG KẾT: 13/13 mục đạt — tất cả đạt` (12 trang + 1 bước kiểm file tài liệu). Có dòng ✕ thì **đừng đưa lên mạng**: chép dòng đỏ đó gửi cho Claude để sửa.

---

## 3. Đưa bản mới lên mạng ("push", "uplive")

1. Chạy thử và tự xem lại trên máy (mục 1), chạy kiểm tra đạt hết (mục 2).
2. Lưu thay đổi và đẩy lên GitHub:
   ```bash
   git add -A
   git commit -m "Mô tả ngắn bản cập nhật"
   git push origin main
   ```
3. Đợi khoảng 1 phút, GitHub Pages tự cập nhật. Mở <https://lertherblooming.vn>, bấm **Ctrl+F5** để xem bản mới.
   Kiểm bằng lệnh (`--ssl-no-revoke` là bắt buộc trên máy này):
   ```bash
   curl --ssl-no-revoke -s https://lertherblooming.vn/ | head
   ```
4. **Ghi nhật ký:** admin → tab **Cập nhật** → thêm bản cập nhật mới (hoặc dán câu SQL `insert into changelog …` mà Claude soạn sẵn)
   để Ler cùng đọc và góp ý.

> Làm cùng Claude: Claude chỉ đẩy lên mạng **khi bạn nói rõ** ("push đi"). Quy trình quen thuộc là: Claude sửa → chạy
> kiểm tra → mở sẵn trình duyệt cho bạn xem → bạn duyệt → bạn bảo "push" → Claude đẩy lên, kiểm bản thật, soạn câu nhật ký.

---

## 4. Chạy một file SQL (cập nhật kho dữ liệu)

Khi Claude báo *"cần chạy file supabase/xx_….sql"*:

1. Vào <https://supabase.com> → đăng nhập → mở dự án của shop.
2. Menu bên trái: **SQL Editor** → **New query**.
3. Mở file `.sql` đó trong VS Code → chọn hết (Ctrl+A) → chép (Ctrl+C) → dán vào Supabase.
4. Bấm **Run**. Thấy "Success" là xong.

- Mọi file đều **chạy lại được nhiều lần** mà không hỏng gì. Không chắc đã chạy chưa thì cứ chạy lại.
- **Đừng chạy** file trong `supabase/da-thay-the/`.
- Admin → **Tổng quan** tự kiểm database: thiếu file nào sẽ hiện **khung vàng** ghi đúng tên file cần chạy.
- Danh sách đầy đủ + file nào đã chạy: [supabase/README.md](../supabase/README.md).

---

## 5. Sao lưu dữ liệu (mỗi tháng 1 lần)

Admin → **Tổng quan** → kéo xuống **Công cụ** → **Tải file sao lưu**. Bạn nhận về 1 file Excel gồm đơn hàng, khách, chi phí,
nguyên liệu, mẫu hoa, bộ sưu tập, ảnh, đánh giá, nhật ký, cài đặt liên hệ. Cất file lên Google Drive.

- File **không chứa ảnh** (chỉ chứa đường link tới ảnh) và **không chứa mật khẩu / mã bí mật** của email.
- Khung sao lưu chuyển màu cam khi máy đó đã hơn 30 ngày chưa sao lưu. Ngày sao lưu được nhớ riêng theo từng máy.

---

## 6. Công việc hằng ngày trong trang quản lý

| Việc | Ở đâu |
|---|---|
| Lên đơn mới (khách chốt qua Facebook/Zalo) | Tab **Đơn hàng** → nút ＋ |
| Xem hôm nay giao gì | Tab **Tổng quan** (Giao hôm nay) hoặc **Lịch giao** |
| Ghi nhận khách chuyển khoản, mở mã QR | Mở đơn → nút **Mã QR** → *Đã nhận tiền* |
| Ghi chi phí (mua hoa, giấy gói, ship…) | Tab **Sổ chi phí** → nút ＋ |
| Xem doanh thu, lãi, mẫu bán chạy, khách tới từ đâu | Tab **Báo cáo** |
| Đăng mẫu hoa mới, đổi giá, chọn mẫu lên trang chủ (ngôi sao) | Tab **Sản phẩm** |
| Mở / tắt / hẹn ngày cho bộ sưu tập | Tab **Bộ sưu tập** |
| Đăng ảnh hoa đã giao | Tab **Khoảnh khắc** |
| Sửa số điện thoại, địa chỉ, chính sách, tài khoản nhận tiền, mã đo lường | Tab **Liên hệ** |

Email tự động (qua Brevo): **đơn mới từ web** → báo shop ngay; **8:30 sáng** → nhắc các đơn giao trong 2 ngày tới;
**trước giờ giao 2 tiếng** → nhắc đơn có hẹn giờ.

---

## 7. Đo lượt xem web (Google Analytics + Clarity)

Mã đã được dán sẵn ở admin → tab **Liên hệ**. Muốn tắt đo lường thì xoá trống 2 ô đó. Web chỉ đếm lượt xem trên trang thật;
máy đã đăng nhập admin (máy của shop) sẽ không bị đếm để số liệu không lẫn lượt xem của chính shop.

- Google Analytics: <https://analytics.google.com> (lượt xem, khách tới từ đâu).
- Microsoft Clarity: <https://clarity.microsoft.com> (xem lại khách bấm, cuộn ở đâu trên web).
