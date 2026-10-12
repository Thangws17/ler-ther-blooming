# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bối cảnh

Website + hệ quản lý đơn hàng của shop hoa nhỏ (2 người, part-time). Chủ shop **không phải dev** — trả lời bằng tiếng Việt, tránh jargon, giải thích rõ ràng.

Tài liệu (11/10/2026 sắp xếp lại):
- [README.md](README.md) — cửa vào, sơ đồ thư mục ngắn.
- [huong-dan/](huong-dan/) — viết cho **người không biết code**: bắt đầu từ `00-bat-dau-tu-day.md`; quyết định
  shop đã chốt ở `06-quyet-dinh-da-chot.md` (đọc trước khi đề xuất đổi hướng).
- [huong-dan/ky-thuat/](huong-dan/ky-thuat/) — chi tiết kỹ thuật + **mọi bẫy đã gặp** (tách từ file này). Danh sách
  tiêu đề ở mục "Bẫy đã biết" bên dưới: sửa phần nào thì ĐỌC file chủ đề đó trước.
- [supabase/README.md](supabase/README.md) — 33 file SQL: làm gì, loại nào, đã chạy chưa.

## Lệnh thường dùng

```bash
python serve.py                   # chạy local; web http://localhost:8765/ , admin /admin/
```

Không có bước build, không `npm install`. Kiểm thử tự động (database giả, không đụng dữ liệu thật):

```bash
python test/chay-tat-ca.py       # chạy cả 12 trang test (cần serve.py đang chạy), in ✓/✕ từng trang
```

hoặc mở `/test/` bấm "Chạy tất cả". Danh sách từng trang test, cách chạy ngầm, bẫy khi viết test:
[huong-dan/ky-thuat/kiem-thu.md](huong-dan/ky-thuat/kiem-thu.md). Xem giao diện admin bằng dữ liệu giả:
`/test/xem-admin.html?v=ds` (đơn hàng), `?v=tq` (tổng quan)… — danh sách `?v=` ở đầu file đó.

```bash
git push origin main                                     # deploy: GitHub Pages tự cập nhật sau ~1 phút
curl --ssl-no-revoke -s https://lertherblooming.vn/ | head   # verify bản live
```

`--ssl-no-revoke` là bắt buộc — curl trên máy này lỗi kiểm tra thu hồi chứng chỉ.

SQL chạy thủ công: chủ shop tự dán file trong `supabase/` vào Supabase SQL Editor. Không có CLI migration.

## Kiến trúc

**Hai front-end, một database.** Cả web khách và admin đều là HTML tĩnh gọi thẳng Supabase từ trình duyệt — không có server trung gian, không API layer.
Admin dùng thư viện Supabase JS đầy đủ; **web khách KHÔNG nạp thư viện** (08/10/2026) mà dùng bộ đọc nhẹ `taoSbNhe()` đầu
`js/main.js`: cùng cách viết `sb.from().select().eq().neq().in().order().limit().single()/maybeSingle()` + `sb.rpc()`, trả
`{data, error}`, không bao giờ ném lỗi. Khoá công khai đi trên đường dẫn (`?apikey=`) để lệnh đọc là "yêu cầu đơn giản", khỏi
preflight. Đọc quá 15 giây (`DOC_CHO_TOI_DA`) → error; `rpc` KHÔNG hẹn giờ cắt (cắt giữa chừng = khách gửi lại thành 2 đơn).
Cần lệnh thư viện mà bộ nhẹ chưa có (`ilike`, `range`, `gte`…) thì thêm vào `taoSbNhe`, đừng nạp lại thư viện.
Kết quả của `sb.from(...)` là câu hỏi CHƯA gửi — mỗi lần `await`/`.then` là gửi 1 lần; muốn dùng chung thì gói
`Promise.resolve(...)` (như `_contactReady`). Anon key nằm trong code là cố ý; ranh giới bảo mật duy nhất là **RLS**: public chỉ đọc, ghi phải có tài khoản admin đăng nhập (`supabase/17_rls_lockdown.sql`).

**Web khách — `js/main.js` dùng chung cho MỌI trang.** Không có router. Mỗi hàm `loadX()` tự thoát sớm nếu trang hiện tại không có element mốc của nó (`const grid = document.getElementById('productsGrid'); if (!grid) return`). Hàm `DOMContentLoaded` ở cuối file gọi *tất cả* các loader song song; trang nào không liên quan thì loader tự no-op. Thêm trang mới = thêm HTML + một `loadX()` theo đúng khuôn này, không tạo file JS riêng.

**Admin — `admin/index.html` là một file monolith ~10.000 dòng** (HTML + CSS + JS trong cùng file, cố ý giữ vậy;
**MỤC LỤC ở đầu file** — tìm mục bằng Ctrl+F `// ── Tên mục`; test-cu-phap kiểm mục lục không lỗi thời). Điều hướng qua `applyTab(tab)`: ẩn/hiện `.panel`, rồi gọi đúng `loadX()` của tab đó. `switchTab()` đẩy `history.pushState` + `#hash` nên nút Back của trình duyệt và F5 đều giữ đúng tab. `applyTab` cũng gọi `closeAllModals()` — modal của tab cũ phải dọn ở đó, đừng để rò sang tab mới.

**Bảo mật database (kiểm 25/09/2026):** Supabase từng MỞ ĐĂNG KÝ (`/auth/v1/settings` → `disable_signup:false`; kiểm lại
07/10/2026: đã TẮT, `true`). Dù vậy vẫn coi "đã đăng nhập" (`authenticated`) KHÔNG có nghĩa là shop. `supabase/24_chi_quan_tri.sql` thêm lớp luật
RESTRICTIVE "chi quan tri…" trên mọi bảng + kho ảnh: phải nằm trong bảng `quan_tri` (hàm `la_quan_tri()`). File 17/21
xoá sạch luật cũ nhưng CHỪA tên `chi quan tri%` — viết file SQL mới kiểu "xoá hết luật" cũng phải chừa y vậy. Thêm bảng
mới: thêm vào danh sách trong file 24.

**Đường ghi đơn hàng đi qua RPC `place_order`** (cả web khách lẫn admin đều gọi, `security definer`): tự dedupe khách theo SĐT đã chuẩn hoá, tự điền giá từ giá niêm yết, cho phép đơn không SĐT, và không cho ghi đè tên/địa chỉ khách cũ. Sửa logic tạo đơn thì thường là sửa hàm SQL này, không phải sửa JS.
Từ 25/09 hàm này cắt độ dài từng ô, `html_esc()` mọi chữ khách gõ trước khi vào email, và CHỐNG SPAM khi gọi từ web
(không đăng nhập): 1 SĐT ≤ 3 đơn/10 phút, cả web ≤ 20 đơn/10 phút, 1 email ≤ 3 mail xác nhận/ngày → lỗi `QUA_NHIEU_DON`
(web khách bắt chữ này để mời nhắn Zalo). Admin đã đăng nhập không bị giới hạn và được giữ tên mẫu tự gõ.

**Danh mục đã bị thay bằng BỘ SƯU TẬP.** Khách không còn thấy "Hoa bó / Sự kiện" nữa — thay bằng `collections` (BST có ảnh bìa, câu giới thiệu, công tắc bật/tắt, hẹn ngày) + bảng nối `collection_products` (**1 mẫu nằm được nhiều BST**). Xem `supabase/21_collections.sql`; 4 BST thật của Ler (Trông Trăng, 20/10, Em Xinh, Anh Trai) tạo ở `22_bst_cua_ler.sql` — file này chỉ chạy lần đầu, 5 BST cũ bị tắt chứ không xoá. Admin quản ở tab 🌿 Bộ sưu tập; form Sản phẩm tick BST thay cho ô "Danh mục" cũ.

**Ảnh:** upload nào cũng đi qua **`taiAnhLen(folder, file, {maxDim, nho, nen})`** trong admin (01/10/2026) — đừng gọi
`storage.upload` trực tiếp nữa. Nó: `compressImage()` (≤1600px, WebP q0.78, fallback JPEG, bỏ qua file <300KB) → làm
thêm **bản nhỏ** rộng `ANH_NHO_RONG` (640px, js/dungchung.js) cất ở `nho/<cùng đường dẫn>` → lên kho, cache 1 năm.
Tên file ảnh có bản nhỏ mang dấu **`<13 chữ số>n_`** (vd `products/1790791559234n_hoa.webp`); `anhNho()` thấy dấu đó +
cỡ xin ≤ 640 thì trả link `nho/`. Đây là bản gói FREE thay cho Supabase Image Transformations (`ANH_NHO_BAT`, gói Pro).
`nho: false` cho hoá đơn (`expenses/`) và ảnh nền trang chủ (`hero/`). Thư mục: `products/`, `gallery/`, `hero/`,
`collections/`, `expenses/` (hoá đơn không lên web), `nho/`. Nút "Tạo ảnh nhỏ cho ảnh cũ" (`optimizeOldImages()`, Tổng
quan) làm bản nhỏ cho ảnh chưa có dấu rồi đổi link trong DB; file cũ để nguyên (link cũ ở đơn hàng vẫn xem được).

**Doanh thu** tính theo **ngày giao** (trống thì lấy ngày tạo). Trạng thái nào được tính nằm ở `REVENUE_STATUSES` / `DONE_STATUSES` (`admin/index.html`, Ctrl+F `const REVENUE_STATUSES`). Vòng đời: `Mới → Đã xác nhận → Đang giao → Giao thành công → Hoàn thành` (khoá sửa) hoặc `Đã hủy`.

## Bẫy đã biết

Chi tiết từng mục (lỗi thật đã xảy ra + cách làm đúng) nằm ở `huong-dan/ky-thuat/`. Dưới đây CHỈ là tiêu đề —
**sửa phần nào thì mở file chủ đề đó đọc trước**, thêm bẫy mới thì ghi vào đúng file chủ đề (không ghi lại vào đây).

**[Database (Supabase) và file SQL](huong-dan/ky-thuat/database-va-sql.md)**
- `place_order` được định nghĩa lại ở 4 file SQL
- Hàm nhắc lịch `send_delivery_reminders()` chỉ còn ở `15_notifications_v2.sql`
- Kho ảnh: người lạ từng LIỆT KÊ được mọi file
- Admin kiểm quyền sau đăng nhập
- File SQL đánh số theo thứ tự chạy
- Trạng thái đơn bị database khoá chỉ nhận 6 giá trị
- `gallery_categories` giờ CHỈ của Thư viện ảnh
- Giá sản phẩm lưu dạng TEXT
- Giá sản phẩm có loại dạng CHỮ CÓ SỐ
- Nguồn khách `orders.nguon` (SQL 33)
- Mail nhắc trước giờ giao 2 tiếng
- Sao lưu Excel (`admin/xlsx.js` + `taiSaoLuu()` trong admin)

**[Web khách (7 trang + js/main.js)](huong-dan/ky-thuat/web-khach.md)**
- Web khách cũng có CSP bằng `<meta>` (08/10/2026)
- Đọc `localStorage`/`sessionStorage` ở web khách phải bọc `try`
- Đo lường (GA4 + Clarity)
- Tắt một BST KHÔNG được làm mất mẫu hoa
- `bstDangHien()` giờ chỉ CÒN 1 BẢN ở `js/dungchung.js`
- Hàng Bộ sưu tập trang chủ tự trôi (05/10/2026, `bstTuTruot()` main.js)
- iPhone bắn `resize` liên tục chỉ vì đổi CHIỀU CAO
- Trang ảnh tên là "Khoảnh khắc" (`khoanh-khac`), không còn chữ "Gallery" nào khách/admin thấy
- Không đặt được HTTP header trên GitHub Pages
- Chạy local bằng `python serve.py`, KHÔNG dùng `python -m http.server`
- Link nội bộ KHÔNG ghi đuôi `.html`
- 3 trang đã đổi tên
- Tên miền riêng `lertherblooming.vn` (01/10/2026)
- Ô không hợp lệ nằm trong mục đang gấp
- Web khách trên điện thoại có thanh tab dưới đáy
- Form đặt hoa web khách không còn `<input type="date">`
- Chống xô lệch bố cục (CLS, đo 11/10/2026)

**[Admin — khung màn hình, iPhone, ô nhập, form](huong-dan/ky-thuat/admin-khung-man-hinh.md)**
- Admin có CSP bằng thẻ `<meta>`
- `--vvh` và `--apph` là HAI thứ khác nhau, đừng gộp
- Không còn `<input type="date">` nào, đừng thêm lại
- Ô tiền phải là `type="text"` + `inputmode="numeric"`, KHÔNG dùng `type="number"`
- `required` KHÔNG có hiệu lực trên input hidden và input readonly
- Đừng gọi `scrollIntoView` cho phần tử trong modal mà không dọn sau
- Không dùng `100vh` cho `body` hay khung toàn màn hình
- Bàn phím iOS đổi chiều cao mà không báo sự kiện
- Đừng đặt `position: sticky` cho phần tử nằm TRONG `.content`
- Popover tự vẽ lại khi bấm (lịch ‹ ›) + trình xử lý "bấm ra ngoài thì đóng" = lỗi tự đóng
- Thanh tab dưới đáy `.bottom-tabs` (điện thoại) cùng luật với `.admin-topbar`
- Tên class đặt lên `<body>` không được trùng class dùng cho phần tử
- `<td>` không được `display:flex`
- Form Thêm đơn + Thêm chi phí kiểu mới
- Nút thao tác trong danh sách admin dùng `nutTT(ten, nhan, onclick, {xoa, tat})`
- Dải trượt ngang + chuột

**[Admin — từng tab (Đơn hàng, Báo cáo, Khách hàng, Sản phẩm…)](huong-dan/ky-thuat/admin-tung-tab.md)**
- Mảng `orders` CHỈ chứa trang đơn đang xem, không phải cả bảng
- Tab Báo cáo (`panelReports`, 11/10/2026)
- Tra đơn theo id phải dùng `orderById(id)`
- Lịch sử mua hàng của khách (`viewCustomerOrders`) tự truy vấn theo `customer_id`
- Số đỏ trên biểu tượng
- Tổng quan xếp theo việc cần làm
- Khoảnh khắc trong admin theo ALBUM
- Tab Sản phẩm kiểu danh sách gọn (24/09/2026)
- Tab Khách hàng kiểu danh bạ gọn (24/09/2026)
- Chọn mẫu hoa khi lên đơn chỉ lấy giá khi là số tiền thuần
- Bảng mã QR mở được từ 2 nơi (09/10/2026)
- Nút "Ghi chú" trên thẻ Lịch giao + bảng/thẻ Đơn hàng (12/10/2026)

**[Dùng chung web + admin, và luật viết code](huong-dan/ky-thuat/dung-chung.md)**
- Safari/iPhone KHÔNG xuất được WebP
- Bẫy khi ghi file: chuỗi `\u0000` có thể bị biến thành ký tự điều khiển THẬT
- Viết hàm tiện ích bằng `function`, đừng `const ten = () => …`
- `data/*.json`, `admin/config.yml`, `images/uploads/`, `demo-*.html` đã bị xoá
- `js/dungchung.js` giữ hàm dùng chung
- Biểu tượng: MỘT bộ duy nhất trong `js/dungchung.js` (`BIEU_TUONG` + `ic('ten')`)
- Người nhận + giờ giao nằm trong GHI CHÚ đơn, không có cột riêng
- Font (24/09/2026, phương án B "dịu mắt")
- Mô tả mẫu hoa viết theo khuôn "tạp chí"
- "Thông tin chung" cho mọi mẫu (SQL 28, 02/10/2026)
- Bộ gõ tiếng Việt (Unikey/EVKey) TỰ GỬI chuỗi phím giả để sửa dấu
- Chuyển động (rà soát 11/10/2026)
- Tự động, không cần sửa từng chỗ
- File `.md` bị GitHub Pages (Jekyll) biến thành trang web công khai
- Script Python in tiếng Việt ra cửa sổ lệnh Windows bị lỗi `UnicodeEncodeError`

**[Kiểm thử (test) và xem thử bằng dữ liệu giả](huong-dan/ky-thuat/kiem-thu.md)**
- Xem admin với dữ liệu giả
- Trang test chạy trong khung ẩn NGOÀI màn hình → trình duyệt dừng hiệu ứng chuyển động giữa chừng

## Quy ước khi sửa code

- **Đơn hàng chủ yếu do shop tự nhập trong admin** (khách chốt qua Facebook/Zalo rồi shop mới lên đơn). Cải tiến về nhập đơn thì làm ở **admin trước**, và **sửa web khách thì phải sửa admin cùng lúc** — đã từng bỏ sót ở cả hai chiều.
- SĐT trong admin có **3 chỗ nhập**: sửa đơn `oePhone`, thêm đơn tay `noPhone`, sổ khách `cuPhone` — đụng tới SĐT phải rà đủ cả 3.
- **Luôn `esc()`** dữ liệu người dùng nhập trước khi nhét vào HTML. Chuỗi nằm TRONG `onclick="f('…')"` thì dùng `jsAttr()`
  (esc() KHÔNG đủ: trình duyệt đổi `&#39;` về dấu `'` trước khi chạy lệnh). Cả hai ở `js/dungchung.js`, dùng cho cả web lẫn admin.
  Link do shop nhập (Facebook…) đi qua `linkAnToan()` (chặn `javascript:`). Chạy `test-bao-mat` sau khi thêm chỗ hiển thị dữ liệu.
- **Ảnh trong thẻ / lưới / ô nhỏ dùng `<img ${srcNho(url, rộng)}>`**, không `src="${esc(url)}"` — Supabase thu nhỏ ảnh 1600px
  xuống đúng cỡ (gói Pro, `ANH_NHO_BAT` trong dungchung.js), lỗi thì tự về ảnh gốc. Trình xem ảnh lớn thì giữ ảnh gốc.
  **Shop đang ở gói FREE → `ANH_NHO_BAT = false`** (25/09/2026): `srcNho` dùng bản nhỏ tự làm (xem mục **Ảnh**) nếu ảnh có,
  không thì ảnh gốc. Cỡ xin > 640 (trang chi tiết 1000, bìa BST lớn) luôn là ảnh gốc.
- **Ghi database trong admin phải kiểm kết quả**: `if (!(await ghiDb(sb.from(…).delete().eq(…).select('id'), 'xoá'))) return`.
  `.select('id')` để bắt trường hợp hết phiên đăng nhập (không lỗi mà 0 dòng đổi). Đừng `await sb.from(…)` suông rồi báo "Đã xoá".
- **Thư viện Supabase nạp bản CỐ ĐỊNH `@2.117.1/dist/umd/supabase.js` + `integrity`** — giờ CHỈ ở admin (web khách dùng
  `taoSbNhe`, test-bao-mat cấm trang khách nạp script từ nơi khác). Nâng phiên bản: tính lại sha384 (`openssl dgst -sha384 -binary f.js | openssl base64 -A`). Đừng dùng file `.min.js` của jsDelivr (tự sinh, vân tay đổi).
- **Không thêm thư viện/framework/build step.** Giữ HTML+CSS+JS thuần.
- SQL mới phải **idempotent** (`create ... if not exists`, `add column if not exists`) — chủ shop hay chạy lại file cũ.
- Tránh UI thô: đừng dùng `prompt()`/`alert()`, đừng dùng input `date`/`month` mặc định của trình duyệt — repo đã có sẵn modal, lịch tự vẽ, bottom-sheet; dùng lại chúng. Responsive điện thoại là bắt buộc, kể cả admin.

## Quy trình làm việc

Code xong → chạy local → `python test/chay-tat-ca.py` (phải "tất cả đạt") → **mở sẵn trình duyệt** cho chủ shop tự xem (đừng chỉ dán URL) → họ xác nhận → mới push → verify bản live → soạn sẵn câu SQL `insert into changelog ...` đưa họ dán (tab 📝 Cập nhật) để Ler cùng đọc.
