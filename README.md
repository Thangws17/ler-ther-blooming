# 🌸 Ler & Ther Blooming

Website giới thiệu hoa tươi **và** hệ thống quản lý đơn hàng (admin) của shop Ler & Ther Blooming.

- 🌐 Web khách: <https://thangws17.github.io/ler-ther-blooming/>
- 🔐 Trang quản lý: <https://thangws17.github.io/ler-ther-blooming/admin/> (đăng nhập email/mật khẩu Supabase)

> Phần lớn đơn hàng do **shop tự nhập trong admin** (khách chốt qua Facebook/Zalo/Instagram rồi mới lên đơn).
> Form đặt hàng trên web khách chỉ là một nguồn nhỏ — nên khi sửa gì về đơn hàng, **sửa cả 2 bên**.

---

## 1. Công nghệ

| Thành phần | Dùng gì |
|---|---|
| Giao diện | HTML / CSS / JS thuần — **không framework**, không build, không `npm install` |
| Backend | [Supabase](https://supabase.com) — Postgres + Auth + Storage |
| Hosting | GitHub Pages, tự deploy khi push nhánh `main` |

Supabase project: `https://oijcwborkebjpavzyisl.supabase.co`.
Key nằm thẳng trong code là **publishable/anon key** — công khai được, an toàn vì mọi quyền ghi đều chặn bằng RLS (xem mục 5).

## 2. Cấu trúc thư mục

```
index.html                  Trang chủ (hero 3 ảnh, sản phẩm nổi bật, đánh giá)
san-pham.html               Danh sách sản phẩm + lọc danh mục
san-pham-chi-tiet.html      Chi tiết 1 sản phẩm (carousel nhiều ảnh) + nút đặt hàng
gallery.html                Thư viện ảnh masonry + lightbox
dang-sau-nhung-bo-hoa.html  Câu chuyện shop
lien-he.html                Liên hệ, bản đồ, mạng xã hội
chinh-sach.html             Giao hàng / thanh toán / cam kết + FAQ
404.html                    Trang lỗi riêng của shop

css/style.css               Toàn bộ style web khách (1 file duy nhất)
js/main.js                  Toàn bộ JS web khách: đọc Supabase, render, modal đặt hàng

admin/index.html            TOÀN BỘ trang quản lý — 1 file, ~5000 dòng (HTML+CSS+JS)
supabase/*.sql              Các file SQL cài đặt / nâng cấp database
images/                     Ảnh tĩnh (og-cover, icon…). Ảnh sản phẩm nằm trên Supabase Storage
sitemap.xml, robots.txt     SEO (robots đã chặn /admin/)
_headers, netlify.toml      Header bảo mật (di sản thời Netlify, để lại cho chắc)
```

**File cũ không còn dùng:** `data/*.json` và `admin/config.yml` là di sản thời dùng Decap CMS — hiện không file nào đọc tới. Giữ lại cho an toàn, xoá lúc nào cũng được.
`demo-*.html` ở thư mục gốc là các bản nháp giao diện để xem thử, chưa commit lên web.

## 3. Chạy thử ở máy

Không cần cài gì, chỉ cần Python:

```bash
python -m http.server 8765
```

Rồi mở <http://localhost:8765/> (admin: <http://localhost:8765/admin/>).
Dữ liệu vẫn lấy từ Supabase thật, nên **sửa gì ở local là sửa thật** — cẩn thận khi bấm xoá.

> Phải chạy qua server như trên, mở thẳng file `.html` bằng double-click sẽ lỗi.

### Xem thử trên điện thoại

```powershell
.\serve.ps1     # chạy server + in ra link để mở trên điện thoại
```

Điện thoại phải **cùng wifi** với máy tính. Đổi chỗ làm thì IP đổi theo — chạy lại `serve.ps1`
là có link mới, không phải làm gì thêm.

Lần đầu cần mở cổng 8765 trên tường lửa Windows (chỉ làm **một lần**, chạy PowerShell quyền Admin):

```powershell
New-NetFirewallRule -DisplayName 'Ler Ther local dev 8765' -Direction Inbound -Action Allow `
  -Protocol TCP -LocalPort 8765 -Profile Any -RemoteAddress LocalSubnet
```

`-RemoteAddress LocalSubnet` = chỉ máy trong cùng mạng nội bộ vào được, và tự đúng ở mọi wifi
nên đổi chỗ làm không cần sửa. Muốn đóng lại: `Remove-NetFirewallRule -DisplayName 'Ler Ther local dev 8765'`.

> Wifi chung (quán cà phê, toà nhà) hay bật chặn máy-nói-với-máy → điện thoại không vào được dù
> đã mở cổng. Lúc đó bật **hotspot trên điện thoại**, cho **máy tính** nối vào, rồi chạy lại `serve.ps1`.

### Test

Vẫn server đó, mở <http://localhost:8765/test/test-gia-san-pham.html> — xanh là đạt, đỏ là hỏng,
mỗi ca sai đều ghi rõ *mong đợi* và *nhận được*. Trang test **không** nối Supabase nên chạy bao nhiêu
lần cũng không đụng dữ liệu thật.

| File | Kiểm cái gì |
|---|---|
| `test/test-gia-san-pham.html` | Ô giá sản phẩm: tự chèn dấu chấm, giữ con trỏ khi sửa giữa chuỗi, mẫu "Liên hệ", dãy giá hay dùng |
| `test/test-khung-man-hinh.html` | Khung màn hình admin trên iPhone: thẻ đơn không bị trắng thông tin, thanh trên không che khuất / bấm được |
| `test/test-form-chi-phi.html` | Form chi phí: lịch tự vẽ (4 form), ô tiền có dấu chấm hàng nghìn, form không bị đẩy lên cụt đầu |

Trang test **bốc hàm thật ra khỏi `admin/index.html`** (cắt theo 2 mốc comment) chứ không copy code,
nên sửa admin là test biết ngay. Nếu đổi tên hay dời khối code đó thì test báo đỏ kèm lời nhắc sửa
lại 2 mốc ở đầu file test — cố ý như vậy.

## 4. Đưa lên web (uplive)

1. Chạy local, tự xem lại cho chắc.
2. `git add` → `git commit` → `git push origin main`.
3. Đợi ~1 phút, GitHub Pages tự cập nhật. Kiểm tra lại bản live:
   ```bash
   curl --ssl-no-revoke -s https://thangws17.github.io/ler-ther-blooming/ | head
   ```
   (`--ssl-no-revoke` là do máy này hay lỗi kiểm tra chứng chỉ.)
4. Ghi lại bản cập nhật: vào admin → tab **📝 Cập nhật**, hoặc chạy câu SQL `insert into changelog ...` trong Supabase — để Ler cùng đọc và góp ý.

## 5. Database (Supabase)

**Các bảng chính**

| Bảng | Nội dung |
|---|---|
| `products` | Sản phẩm (giá lưu dạng **TEXT**, ví dụ `"600,000đ"` hoặc `"Liên hệ"`) |
| `gallery`, `gallery_categories` | Ảnh thư viện + danh mục tự quản (Sản phẩm dùng chung danh mục này) |
| `orders` | Đơn hàng: `unit_price`, `shipping_fee`, `total` tự tính, tên + SĐT khách snapshot, ngày giao, trạng thái |
| `customers` | Sổ khách, `phone` là duy nhất |
| `expenses`, `materials` | Sổ chi phí (ghi theo dòng tiền) + sổ tay nguyên liệu gợi ý giá |
| `contact` | Cấu hình 1 dòng: liên hệ, mạng xã hội, ảnh hero, nội dung chính sách |
| `testimonials` | Đánh giá khách hàng |
| `changelog` | Nhật ký cập nhật website + góp ý |
| `app_settings` | Token Telegram / Resend cho cảnh báo (khoá RLS, chỉ server đọc) |

**Storage:** bucket `images` — thư mục `products/`, `gallery/`, `hero/`, `expenses/` (ảnh hoá đơn không lên web công khai).

**RPC `place_order`:** dùng chung cho cả web khách lẫn admin. Tự khớp khách theo SĐT (không tạo trùng), tự điền giá từ giá niêm yết, cho phép đơn không có SĐT.

**RLS:** khách vãng lai chỉ **đọc**; mọi thao tác ghi đều yêu cầu tài khoản admin đã đăng nhập.

### Chạy file SQL

Mọi file trong `supabase/` đều **idempotent** — chạy lại nhiều lần không lỗi, không hỏng dữ liệu.
Mở Supabase → SQL Editor → dán nội dung file → Run. Nếu dựng lại database từ đầu, chạy theo thứ tự:

```
orders_setup_full.sql → phase1_orders.sql → phase1_optional_phone.sql
place_order_autoprice.sql → place_order_hardening.sql
order_phone_snapshot.sql → phone_normalize.sql → customers_insert_policy.sql → orders_image.sql
expenses_setup.sql → expenses_image.sql → materials_setup.sql
gallery_categories_setup.sql → categories_unify.sql
policy_migration.sql → contact_hero_sides.sql → changelog_setup.sql
notifications_v2.sql → reminders_setup.sql → rls_lockdown.sql   (rls_lockdown chạy CUỐI)
```

`reminders_setup.sql` cần điền token Telegram/Email trước — xem `supabase/REMINDERS_SETUP.md`.

## 6. Trang quản lý (admin)

Các tab: **📊 Tổng quan · 📦 Đơn hàng · 📅 Lịch giao · 👤 Khách hàng · 💰 Sổ chi phí · 🛍️ Sản phẩm · 📸 Gallery · 💬 Đánh giá · 📝 Cập nhật · ⚙️ Liên hệ**.
Dùng tốt trên điện thoại (menu trượt, bảng đổi thành thẻ, bottom-sheet). F5 vẫn giữ nguyên tab đang xem nhờ `#hash` trên URL.

**Vòng đời đơn hàng**

```
Mới → Đã xác nhận → Đang giao → Giao thành công → Hoàn thành (khoá sửa)
                                      ↑                    ↘ Đã hủy
                          mốc ghi nhận doanh thu
```

Doanh thu tính theo **ngày giao** (nếu trống thì lấy ngày tạo đơn). Danh sách trạng thái tính tiền nằm ở hằng `REVENUE_STATUSES` / `DONE_STATUSES` trong `admin/index.html`.

**Cảnh báo chuẩn bị hàng:** hiện ngay trong admin (miễn phí), kèm Telegram + Email 8:30 mỗi sáng cho đơn giao ngày mai (pg_cron + pg_net).

## 7. Quy ước khi sửa code

- **Không thêm thư viện** nếu chưa thật cần — giữ nguyên HTML/CSS/JS thuần cho dễ bảo trì.
- **Luôn dùng `esc()`** khi nhét dữ liệu do người dùng nhập vào HTML (chống XSS); chèn vào `onclick` ở web khách thì dùng thêm `jsAttr()` (helper này chỉ có trong `js/main.js`).
- **Sửa web khách thì sửa admin cùng lúc** (và ngược lại) — nhất là form đơn hàng, kiểm tra SĐT, định dạng giá.
- SĐT trong admin có **3 chỗ nhập**: sửa đơn (`oePhone`), thêm đơn tay (`noPhone`), sổ khách (`cuPhone`) — đụng tới SĐT phải rà đủ cả 3.
- Giá sản phẩm là TEXT, hiển thị qua `fmtPrice()`; đừng mặc định nó là số.
- SQL mới phải idempotent (`create ... if not exists`, `add column if not exists`).
