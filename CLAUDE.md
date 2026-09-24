# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bối cảnh

Website + hệ quản lý đơn hàng của shop hoa nhỏ (2 người, part-time). Chủ shop **không phải dev** — trả lời bằng tiếng Việt, tránh jargon, giải thích rõ ràng.

Xem thêm [README.md](README.md) cho cấu trúc thư mục và mô tả từng bảng dữ liệu.

## Lệnh thường dùng

```bash
python serve.py                   # chạy local; web http://localhost:8765/ , admin /admin/
```

Không có bước build, không `npm install`. Vẫn nên mở trình duyệt xem thật, nhưng đã có sẵn
mấy trang test chạy trong trình duyệt (vẫn server 8765 đó):

- `/test/test-gia-san-pham.html` — ô giá sản phẩm: chèn dấu chấm, giữ con trỏ, dãy giá hay dùng
- `/test/test-khung-man-hinh.html` — khung màn hình admin trên iPhone + thanh tab dưới đáy (xem "Bẫy đã biết")
- `/test/test-form-chi-phi.html` — ô ngày + ô tiền + chip / mục gấp của form chi phí và form thêm đơn
- `/test/test-phan-trang-don.html` — phân trang đơn: kiểm đúng URL truy vấn gửi lên Supabase
- `/test/test-sao-luu.html` — bộ tạo Excel + nút sao lưu thật trong admin (xuất file mẫu base64 để mở lại bằng openpyxl)
- `/test/test-do-luong.html` — Google Analytics + Clarity: khi nào đếm / không đếm, kiểm mã, hàng chờ thao tác
- `/test/test-bo-suu-tap.html` — bộ sưu tập: luật hiện/ẩn, đuôi link, tắt bộ không làm mất mẫu hoa
- `/test/test-nguoi-nhan.html` — người nhận + giờ giao: web ghép vào ghi chú đơn, admin tách ra (bấm thật, database giả)
- `/test/test-web-khach.html` — mọi trang web khách × 3 khổ (360/390/1280): tràn ngang, lỗi JS, nút có tên, emoji,
  thanh tab, nút nổi, lọc/tìm/xem ảnh/menu, form đặt hoa + các lỗi nhập (gửi đơn bằng database giả), trang chi tiết
- `/test/test-admin-giao-dien.html` — admin × 2 khổ (390/1280) với DATABASE GIẢ (`test/gia-lap-sb.js`): từng tab không
  lỗi / không tràn, số đỏ, nút ＋ nổi, Tổng quan, Lịch giao, chi phí, bộ sưu tập, album, nguyên liệu, cảnh báo nhập dở
- `/test/test-cu-phap.html` — biên dịch thử toàn bộ JS (web + admin). Chạy sau mọi lần sửa file lớn

Trang test **bốc hàm/DOM thật ra khỏi `admin/index.html`** chứ không copy code, nên sửa admin là test
biết ngay. Không nối Supabase để ghi, chạy bao nhiêu lần cũng không đụng dữ liệu thật.

```bash
git push origin main                                     # deploy: GitHub Pages tự cập nhật sau ~1 phút
curl --ssl-no-revoke -s https://thangws17.github.io/ler-ther-blooming/ | head   # verify bản live
```

`--ssl-no-revoke` là bắt buộc — curl trên máy này lỗi kiểm tra thu hồi chứng chỉ.

SQL chạy thủ công: chủ shop tự dán file trong `supabase/` vào Supabase SQL Editor. Không có CLI migration.

## Kiến trúc

**Hai front-end, một database.** Cả web khách và admin đều là HTML tĩnh gọi thẳng Supabase JS client từ trình duyệt — không có server trung gian, không API layer. Anon key nằm trong code là cố ý; ranh giới bảo mật duy nhất là **RLS**: public chỉ đọc, ghi phải có tài khoản admin đăng nhập (`supabase/17_rls_lockdown.sql`).

**Web khách — `js/main.js` dùng chung cho MỌI trang.** Không có router. Mỗi hàm `loadX()` tự thoát sớm nếu trang hiện tại không có element mốc của nó (`const grid = document.getElementById('productsGrid'); if (!grid) return`). Hàm `DOMContentLoaded` ở cuối file gọi *tất cả* các loader song song; trang nào không liên quan thì loader tự no-op. Thêm trang mới = thêm HTML + một `loadX()` theo đúng khuôn này, không tạo file JS riêng.

**Admin — `admin/index.html` là một file monolith ~5000 dòng** (HTML + CSS + JS trong cùng file, cố ý giữ vậy). Điều hướng qua `applyTab(tab)`: ẩn/hiện `.panel`, rồi gọi đúng `loadX()` của tab đó. `switchTab()` đẩy `history.pushState` + `#hash` nên nút Back của trình duyệt và F5 đều giữ đúng tab. `applyTab` cũng gọi `closeAllModals()` — modal của tab cũ phải dọn ở đó, đừng để rò sang tab mới.

**Đường ghi đơn hàng đi qua RPC `place_order`** (cả web khách lẫn admin đều gọi, `security definer`): tự dedupe khách theo SĐT đã chuẩn hoá, tự điền giá từ giá niêm yết, cho phép đơn không SĐT, và không cho ghi đè tên/địa chỉ khách cũ. Sửa logic tạo đơn thì thường là sửa hàm SQL này, không phải sửa JS.

**Danh mục đã bị thay bằng BỘ SƯU TẬP.** Khách không còn thấy "Hoa bó / Sự kiện" nữa — thay bằng `collections` (BST có ảnh bìa, câu giới thiệu, công tắc bật/tắt, hẹn ngày) + bảng nối `collection_products` (**1 mẫu nằm được nhiều BST**). Xem `supabase/21_collections.sql`; 4 BST thật của Ler (Trông Trăng, 20/10, Em Xinh, Anh Trai) tạo ở `22_bst_cua_ler.sql` — file này chỉ chạy lần đầu, 5 BST cũ bị tắt chứ không xoá. Admin quản ở tab 🌿 Bộ sưu tập; form Sản phẩm tick BST thay cho ô "Danh mục" cũ.

**Ảnh:** upload nào cũng đi qua `compressImage()` trong admin — thu về ≤1600px, xuất WebP q0.78 (fallback JPEG), bỏ qua file <300KB; rồi `sb.storage.from('images').upload(path, file, { cacheControl: '31536000' })`. Thư mục trong bucket: `products/`, `gallery/`, `hero/`, `expenses/` (ảnh hoá đơn không lên web công khai). `optimizeOldImages()` là nút chạy một lần cho ảnh cũ, nhận diện ảnh đã tối ưu qua `_optw_` / đuôi `.webp`.

**Doanh thu** tính theo **ngày giao** (trống thì lấy ngày tạo). Trạng thái nào được tính nằm ở `REVENUE_STATUSES` / `DONE_STATUSES` (`admin/index.html`, gần dòng 3850). Vòng đời: `Mới → Đã xác nhận → Đang giao → Giao thành công → Hoàn thành` (khoá sửa) hoặc `Đã hủy`.

## Bẫy đã biết

- **`place_order` được định nghĩa lại ở 4 file SQL.** Bản hiện hành là `supabase/15_notifications_v2.sql` (11 tham số, có `p_email`). Ba bản cũ (10 tham số) đã dồn vào `supabase/da-thay-the/` — chạy vào là **lùi** hàm về bản cũ. Sửa RPC thì sửa trong `15_notifications_v2.sql`.
- **File SQL đánh số theo thứ tự chạy** (`01_` → `22_`); `17_rls_lockdown.sql` luôn chạy cuối cùng khi dựng lại DB. Đổi tên file SQL thì phải sửa cả 2 thông báo trong `admin/index.html` đang nhắc tên file (`14_changelog_setup`, `03_order_phone_snapshot`).
- **Sao lưu Excel (`admin/xlsx.js` + `taiSaoLuu()` trong admin)** tự viết file .xlsx, KHÔNG thêm thư viện.
  Thêm bảng mới vào database thì thêm vào `SAO_LUU_BANG`; cột lạ tự nối vào cuối nên không mất dữ liệu,
  nhưng khai báo thì có tên cột tiếng Việt. **Tuyệt đối không thêm `app_settings`** (chứa token). Ngày sao
  lưu gần nhất nhớ theo TỪNG MÁY (localStorage `lt_saoLuuCuoi`), không phải toàn shop.
- **Bẫy khi ghi file: chuỗi `\u0000` có thể bị biến thành ký tự điều khiển THẬT.** Đã xảy ra với regex lọc
  ký tự cấm trong `xlsx.js` (trình duyệt đổi NUL thật thành ký tự lạ → bộ lọc hỏng mà không báo lỗi). Viết
  xong file có `\uXXXX` thì quét lại ký tự điều khiển ẩn trước khi commit.
- **Đo lường (GA4 + Clarity):** mã nhập ở admin tab Liên hệ → cột `contact.ga4_id` / `contact.clarity_id`
  (SQL 20). Web khách chỉ nạp khi mã khớp `MA_GA4` / `MA_CLARITY` — 2 regex này **phải giống hệt nhau** ở
  `admin/index.html` và `js/main.js` (test kiểm). Không đếm khi chạy ở localhost/IP, và máy đã đăng nhập admin
  (cờ `lt_mayCuaShop`, đặt trong `showApp()`). Ghi thao tác bằng `doLuong(ten, thamSo)` — gọi sớm cũng được,
  nó tự xếp hàng chờ tới khi biết có bật hay không. Lưu form Liên hệ phải bỏ cột database chưa có
  (`_contactCot`), không thì chưa chạy SQL 20 là hỏng cả form.
- **Trạng thái đơn bị database khoá chỉ nhận 6 giá trị** (`supabase/19_order_status_check.sql`), phải
  khớp y hệt `ORDER_STATUSES` trong admin. Thêm/đổi tên trạng thái: sửa SQL **trước**, rồi mới sửa JS —
  ngược lại thì lưu đơn bị từ chối. Mọi chỗ ghi status đều phải lấy từ `ORDER_STATUSES`, đừng gõ tay chuỗi.
- **Tắt một BST KHÔNG được làm mất mẫu hoa.** Nút "🌸 Tất cả" trên trang Sản phẩm luôn hiện
  **mọi** mẫu, kể cả mẫu không thuộc BST nào — đây là lá chắn duy nhất sau khi bỏ danh mục, đừng
  viết lại bộ lọc thành "phải thuộc một BST". Admin cũng cảnh báo mẫu chưa thuộc BST nào.
  "Sản phẩm liên quan" ở trang chi tiết lấy theo BST, không có thì lùi về mẫu mới nhất — không
  bao giờ để trống.
- **`bstDangHien()` viết HAI lần** — `admin/index.html` và `js/main.js`. Luật bật/tắt + hẹn ngày
  phải giống hệt nhau, lệch là admin báo một đằng web hiện một nẻo (test đối chiếu 2 bản).
  Tương tự: `slugVi()` trong JS phải cho ra kết quả giống hàm `slug_vi()` trong SQL 21.
- **Trang ảnh tên là "Khoảnh khắc" (`khoanh-khac`), không còn chữ "Gallery" nào khách/admin thấy** (web thuần Việt,
  23/09/2026). Trong code và database vẫn tên `gallery` (bảng, hàm `loadGallery`, `data-tab="Gallery"`) — cố ý
  giữ, đừng đổi tên bảng. Chữ mới hiện ra thì viết "Khoảnh khắc" / "nhóm ảnh", đừng viết "Gallery" / "danh mục".
- **`gallery_categories` giờ CHỈ của Thư viện ảnh.** Không còn dùng chung với sản phẩm nữa —
  đổi tên / xoá nhóm ảnh không đụng gì tới mẫu hoa. Cột `products.category` vẫn còn nhưng
  **chỉ là ghi chú** (tên BST đầu tiên, cho dễ đọc file sao lưu) — đừng lọc/hiển thị theo nó.
- **Viết hàm tiện ích bằng `function`, đừng `const ten = () => …`.** `const`/`let` ở phạm vi gốc
  KHÔNG nằm trong `window`, nên trang test (chạy admin trong iframe) gọi không tới. Cần đặt
  giá trị cho biến `let` từ test thì phải dùng `khung.eval('ten = …')`, gán thẳng là vô tác dụng.
- **Giá sản phẩm lưu dạng TEXT** (`"600,000đ"`, `"Liên hệ"`, `"Từ 2xx (Theo size order)"`) — luôn qua `fmtPrice()`, đừng coi là số.
- **`data/*.json`, `admin/config.yml`, `images/uploads/`, `demo-*.html` đã bị xoá** (16/09/2026) — di sản Decap CMS và bản nháp, không còn trong repo. Đừng tạo lại.
- **Không đặt được HTTP header trên GitHub Pages.** `_headers`/`netlify.toml` đã xoá vì GH Pages không đọc (đã kiểm: bản live không trả về `X-Frame-Options`). Đừng tạo lại — muốn có header bảo mật thật thì phải đổi hosting.
- **Chạy local bằng `python serve.py`, KHÔNG dùng `python -m http.server`.** Web bỏ đuôi `.html` trong
  link (`/san-pham`); GitHub Pages tự hiểu, còn server có sẵn của Python thì không → báo 404 khắp nơi dù
  web thật vẫn chạy. `serve.py` bắt chước đúng GitHub Pages (URL không đuôi + trả `404.html`).
- **Link nội bộ KHÔNG ghi đuôi `.html`.** Trang chủ là `./`, các trang khác `san-pham`, `chi-tiet?id=…`.
  Menu tô sáng mục đang xem bằng `tenTrang()` trong `js/main.js` (bỏ đuôi .html khi so) — đừng quay lại
  so nguyên tên file. Trang 404 dùng `data-to=""` cho trang chủ vì JS tự ghép tiền tố repo.
- **3 trang đã đổi tên:** `dang-sau-nhung-bo-hoa` → `cau-chuyen`, `san-pham-chi-tiet` →
  `chi-tiet` (16/09/2026), `gallery` → `khoanh-khac` (23/09/2026). File tên cũ giờ là **trang chuyển hướng — đừng xoá**, link cũ trên Facebook/Zalo/Google
  còn trỏ vào. Chúng chuyển bằng JS trước để giữ `?id=` sản phẩm (meta refresh làm rơi mất).
- **Khi có tên miền riêng**, địa chỉ `https://thangws17.github.io/ler-ther-blooming/` đang ghi cứng ở:
  thẻ `og:image` (7 trang), thẻ `canonical` (6 trang), `sitemap.xml`, `robots.txt`, 3 trang chuyển
  hướng. Tìm hết bằng `grep -rn "thangws17.github.io" --include=*.html --include=*.xml --include=*.txt .`
  Trang `chi-tiet` cố ý **không** có canonical (canonical tĩnh sẽ gộp mọi sản phẩm thành một trang).
  Lưu ý thêm: `robots.txt` chỉ có tác dụng ở GỐC tên miền — trên `github.io/ler-ther-blooming/` hiện
  Google không đọc nó; có tên miền rồi thì nó mới có tác dụng.
- **`--vvh` và `--apph` là HAI thứ khác nhau, đừng gộp.** `--vvh` = chiều cao vùng nhìn thấy
  (co lại khi bàn phím mở, nhảy mỗi frame vì iOS bắn `visualViewport scroll` liên tục) → **chỉ**
  cho modal/toast. `--apph` = `window.innerHeight`, dùng cho chiều cao `#appWrap`. Từng cho
  `#appWrap` bám `--vvh` và hậu quả trên iPhone là: cuộn thì thẻ đơn **vẽ ra trắng thông tin**,
  thanh trên **đè lên nội dung mà chạm không trúng**, và đóng bàn phím xong khung app **kẹt ở
  chiều cao lúc còn bàn phím** (iOS không bắn `resize` cuối) → nửa dưới màn hình trắng trơn.
- **Không còn `<input type="date">` nào, đừng thêm lại.** iOS vẽ ô đó bằng control riêng của hệ
  thống: không nghe padding mình đặt nên **tràn khỏi khung bo tròn**, chữ ra kiểu "ngày 15 thg 9,
  2026". Cả 4 ô ngày (`exDate`/`oeDate`/`noDate`/`clDate`) giờ là **nút + lịch tự vẽ**; giá trị thật
  nằm trong `<input type="hidden">` mang đúng id cũ. **Đổi giá trị bằng JS thì phải gọi `fdSync(id)`**,
  không thì chữ trên nút đứng yên. Nhãn phải NGẮN ("Hôm nay", "Mai") — ô ngày nằm trong cột hẹp
  ~175px, nhãn dài sẽ xuống 2 dòng làm nút cao hơn các ô khác một bậc.
- **Ô tiền phải là `type="text"` + `inputmode="numeric"`, KHÔNG dùng `type="number"`.** Ô number
  không cho hiện dấu chấm hàng nghìn — nó coi `"5.000"` là số không hợp lệ rồi xoá trắng ô. Đọc/ghi
  qua `moneyNum(id)` / `moneySet(id, v)`; ô trống trả `null` chứ không phải `0`.
- **`required` KHÔNG có hiệu lực trên input hidden và input readonly** — trình duyệt miễn kiểm tra
  chúng. Ô ngày (hidden) và ô tiền (text) vì vậy được kiểm tay trong `saveExpense`/`saveChangelog`.
- **Đừng gọi `scrollIntoView` cho phần tử trong modal mà không dọn sau.** Nó kéo mọi khung cha kể cả
  trang; trên iOS điều đó đẩy luôn lớp phủ `position: fixed` lên làm **cụt đầu form**. Có
  `resetPageScroll()` để trả độ cuộn trang về 0, và `initPageScrollGuard()` tự dọn mỗi lần **bất kỳ** ô
  nhập nào nhận/mất focus (kể cả ô ngoài modal như "Tìm mã đơn"), đồng thời đo lại vùng nhìn thấy.
- **Không dùng `100vh` cho `body` hay khung toàn màn hình.** Trên iPhone `100vh` = màn hình lúc thanh
  công cụ đã ẩn, cao hơn vùng nhìn thấy → trang có chỗ để cuộn; `overflow: hidden` không chặn được iOS
  tự cuộn khi bàn phím hiện, đóng bàn phím thì không trả lại → cả trang kẹt lệch lên, mất thanh Admin,
  đáy trống. `body` cao `var(--apph)`.
- **Bàn phím iOS đổi chiều cao mà không báo sự kiện** (chuyển giữa ô có/không có thanh gợi ý chữ) →
  `--vvh` kẹt số cũ, form dừng cách bàn phím một khúc. Vì vậy `measureViewport()` được gọi lại nhiều
  nhịp sau mỗi lần focus đổi, không chỉ chờ `visualViewport resize`.
- **Mảng `orders` CHỈ chứa trang đơn đang xem, không phải cả bảng.** Tab Đơn hàng tải theo trang
  (`ORDERS_PAGE` = 20, `buildOrdersQuery()` lọc trên server, `count: 'exact'` để đếm). **Đừng bao giờ
  `orders.filter(...)` để lọc/tìm** — sẽ chỉ tìm trong mấy chục đơn đã tải rồi báo "không có đơn nào".
  Đổi bộ lọc thì gọi `applyOrderFilters()`, không gọi `renderOrders()` suông.
- **Tra đơn theo id phải dùng `orderById(id)`**, không dùng `orders.find`. Tab Tổng quan và Lịch giao
  nạp đơn của chúng vào `_donCache` qua `cacheOrders()` và **không được gán vào `orders`** — gán là phá
  trang đang xem của tab Đơn hàng (đã từng như vậy).
- **Lịch sử mua hàng của khách (`viewCustomerOrders`) tự truy vấn theo `customer_id`**, không dùng mảng
  `orders`. Nhờ vậy phân trang không ảnh hưởng nó — giữ nguyên cách này.
- **`js/dungchung.js` giữ hàm dùng chung** (`esc`, `normalizePhone`, `isValidPhone`, `PHONE_OK`) cho CẢ
  web khách và admin. Sửa ở đây là cả 2 bên đổi theo — đừng viết lại bản riêng như trước. Nạp bằng thẻ
  `<script>` thường (không module), phải nạp TRƯỚC `js/main.js`.
- **Giá sản phẩm có loại dạng CHỮ CÓ SỐ**: `"Từ 2xx (Theo size order)"`. Viết SQL kiểu "bỏ hết ký tự
  không phải số" sẽ biến nó thành giá **2 đồng**. Xem `supabase/18_price_normalize.sql` để biết cách lọc
  đúng (chỉ đổi chuỗi thuần số tiền). **`place_order` từng dính đúng lỗi này** (đơn web đặt sản phẩm
  "Từ 2xx" bị ghi đơn giá 2đ) — đã sửa trong `15_notifications_v2.sql` bằng cùng điều kiện lọc.
- **Popover tự vẽ lại khi bấm (lịch ‹ ›) + trình xử lý "bấm ra ngoài thì đóng" = lỗi tự đóng.** Vẽ lại
  bằng `innerHTML` gỡ chính nút vừa bấm khỏi trang; khi sự kiện lan tới `document`, `closest()` trên phần tử
  đã bị gỡ trả `null` → tưởng bấm ra ngoài → đóng lịch ngay (lỗi thật 17/09: không chuyển được tháng). Trình
  xử lý chung đã chặn bằng `if (!e.target.isConnected) return`. Viết popover mới cũng phải nhớ điều này.
  **Test UI phải BẤM NÚT THẬT (`.click()`)**, đừng gọi thẳng hàm — test cũ gọi `fdStepMonth()` nên không bắt được.
- **Biểu tượng: MỘT bộ duy nhất trong `js/dungchung.js` (`BIEU_TUONG` + `ic('ten')`)**, dùng cho cả admin lẫn
  web khách; file đó tự chèn bộ `<symbol>` vào đầu `<body>`. HTML tĩnh viết `<svg class="ic"><use href="#i-ten"/></svg>`.
  **Không thêm emoji vào nút/menu nữa** (23/09/2026 đã đổi hết sang biểu tượng nét mảnh). Emoji shop tự đặt cho
  Bộ sưu tập / nhóm ảnh là NỘI DUNG — giữ ở thẻ bìa, bỏ ở nút lọc. Logo 🌸 / favicon là thương hiệu — giữ.
  Chèn `${ic(...)}` thì chuỗi bao ngoài phải là template (dấu `), chuỗi nháy đơn sẽ lỗi cú pháp cả admin.
- **Nút thao tác trong danh sách admin dùng `nutTT(ten, nhan, onclick, {xoa, tat})`**: máy tính chỉ hiện biểu
  tượng (rê chuột ra tên), thẻ điện thoại `.mc-actions` hiện cả chữ. Đừng viết lại nút "✏️ Sửa / 🗑 Xóa" kiểu cũ.
- **Thanh tab dưới đáy `.bottom-tabs` (điện thoại) cùng luật với `.admin-topbar`**: là anh em của `.content`,
  KHÔNG nằm trong khung cuộn, không fixed/sticky. Tab nào có nút ＋ nổi thì khai ở `FAB_THEO_TAB`.
- **Tên class đặt lên `<body>` không được trùng class dùng cho phần tử.** Lỗi thật 23/09: `body.co-fab` trùng
  `.co-fab { display:none }` → mở tab Đơn hàng trên điện thoại là cả trang trắng. Giờ là `body.dang-co-nut-noi`
  và `.an-tren-dt`; test-khung-man-hinh kiểm từng tab.
- **`<td>` không được `display:flex`** — rớt khỏi bố cục bảng, cột nút lệch/tràn mép (lỗi cũ của `.actions`).
- **Form Thêm đơn + Thêm chi phí kiểu mới** (chip, mục gấp `.fx-more`, ô ẩn giữ đúng id cũ): chip chọn giá trị
  qua `segSet(id, v)` (trạng thái đơn, loại chi phí), ngày nhanh qua `qdPick` và `fdSync` tự tô chip. `form.reset()`
  KHÔNG đặt lại ô hidden → mở form phải tự `segSet` về mặc định. Chip do JS xử lý không bắn `input` nên tự gọi
  `danhDauDangNhap(el)` để cảnh báo "đang nhập dở" còn chạy. Ô đơn giá / phí ship của form thêm đơn giờ là ô tiền
  có dấu chấm (`moneyNum`), không còn `type="number"`.
- **Số đỏ trên biểu tượng** (menu bên + thanh dưới) đều do `refreshNewOrderBadge()` vẽ: Đơn hàng = đơn chưa giao ("Mới" + "Đã xác nhận", `BADGE_DON_STATUSES`);
  Lịch giao = đơn giao hôm nay + mai chưa xong. Thêm số đếm mới thì dùng `ganSoDem([...], n)`.
- **Tổng quan xếp theo việc cần làm**: đơn mới → Giao hôm nay → Sắp giao (3 ngày, chia theo ngày, `ngayNhan()`) →
  số liệu tháng (gọn) → công cụ. Khung sao lưu giữ id `backupBox/backupLast/backupStatus/backupBtn` + chữ nút
  "Tải file sao lưu" (test-sao-luu kiểm).
- **Xem admin với dữ liệu giả**: `/demo/xem-admin.html?v=tq|ds|don|sua|ct|lg|ex|chi|nl|nls|menu` (thư mục `demo/`
  không lên git). Thay `sb.from` bằng bản giả, không đụng Supabase — dùng để chụp màn hình kiểm giao diện.
  Trình duyệt chạy ngầm không vẽ iframe, nên trang này nạp thẳng mã admin chứ không nhúng.
- **Trang test chạy trong khung ẩn NGOÀI màn hình → trình duyệt dừng hiệu ứng chuyển động giữa chừng** (đo vị trí sai).
  Trang test web khách tự tắt hiệu ứng trong khung. Và đừng để hiệu ứng `transition: all` trên phần tử nổi (nút Zalo):
  vị trí đổi lúc tải trang sẽ thành "trượt giật" — chỉ cho chuyển động transform / bóng.
- **Ô không hợp lệ nằm trong mục đang gấp** (vd email sai trong form đặt hoa) → trình duyệt chặn gửi nhưng không tới
  được ô ẩn → khách bấm Gửi không thấy gì. Có trình bắt sự kiện `invalid` tự mở mục đó — mục gấp mới phải dùng class
  `.omx-than` (web) để được hưởng.
- **Người nhận + giờ giao nằm trong GHI CHÚ đơn, không có cột riêng.** Mẫu cố định (mỗi thứ 1 dòng đầu ghi chú):
  `Người nhận: Lan · 0912…` / `Giờ giao: 15h`. Ghép bằng `ghepGhiChuDon()`, tách bằng `tachGhiChuDon()` (js/dungchung.js)
  — web khách + form Thêm/Sửa đơn admin + chi tiết đơn + Lịch giao đều dùng 2 hàm này. **Đừng đổi chữ "Người nhận:" /
  "Giờ giao:"** — đơn cũ sẽ không tách được. Giờ chọn bằng chip `GIO_GIAO` (8h–21h), không dùng ô giờ của iOS.
- **Web khách trên điện thoại có thanh tab dưới đáy** (`veThanhTabKhach()` trong main.js chèn cho mọi trang, trừ trang
  chi tiết — đáy trang đó là thanh "Zalo + Đặt mẫu này"). Nút nổi (Zalo, lên đầu trang) phải đứng TRÊN thanh này.
- **Form đặt hoa web khách không còn `<input type="date">`**: chip Ngày mai / Ngày kia + lịch tự vẽ (`veLichGiao`),
  giá trị vẫn ở `#orderDate` (hidden). Trang chủ chỉ còn 1 ảnh to (`#heroBg`); 2 ô ảnh phụ trong admin đã ẩn.
- **Khoảnh khắc trong admin theo ALBUM** (mỗi nhóm ảnh = 1 album, `kkAlbum`/`kkMoAlbum`). Album chỉ là lớp vỏ trên
  `galleryFilterCat` cũ: tải ảnh trong album → `#galleryCategory` tự đặt = album đó.
- **Chọn mẫu hoa khi lên đơn chỉ lấy giá khi là số tiền thuần** (`!_priceIsText`). Giá "Từ 2xx" để trống — cùng
  bẫy "2 đồng" với `place_order`.
- **Đừng đặt `position: sticky` cho phần tử nằm TRONG `.content`.** `.content` là khung cuộn;
  sticky bên trong khung cuộn là chỗ iOS vẽ sai toạ độ → thấy phần tử nhưng bấm không trúng.
  `.admin-topbar` vì vậy là anh em của `.content`, không phải con.

## Quy ước khi sửa code

- **Đơn hàng chủ yếu do shop tự nhập trong admin** (khách chốt qua Facebook/Zalo rồi shop mới lên đơn). Cải tiến về nhập đơn thì làm ở **admin trước**, và **sửa web khách thì phải sửa admin cùng lúc** — đã từng bỏ sót ở cả hai chiều.
- SĐT trong admin có **3 chỗ nhập**: sửa đơn `oePhone`, thêm đơn tay `noPhone`, sổ khách `cuPhone` — đụng tới SĐT phải rà đủ cả 3.
- **Luôn `esc()`** dữ liệu người dùng nhập trước khi nhét vào HTML. Chèn vào `onclick` ở web khách thì bọc thêm `jsAttr()` (helper chỉ có trong `js/main.js`; admin chỉ có `esc()`).
- **Không thêm thư viện/framework/build step.** Giữ HTML+CSS+JS thuần.
- SQL mới phải **idempotent** (`create ... if not exists`, `add column if not exists`) — chủ shop hay chạy lại file cũ.
- Tránh UI thô: đừng dùng `prompt()`/`alert()`, đừng dùng input `date`/`month` mặc định của trình duyệt — repo đã có sẵn modal, lịch tự vẽ, bottom-sheet; dùng lại chúng. Responsive điện thoại là bắt buộc, kể cả admin.

## Quy trình làm việc

Code xong → chạy local → **mở sẵn trình duyệt** cho chủ shop tự xem (đừng chỉ dán URL) → họ xác nhận → mới push → verify bản live → soạn sẵn câu SQL `insert into changelog ...` đưa họ dán (tab 📝 Cập nhật) để Ler cùng đọc.
