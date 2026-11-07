# Web khách (7 trang + js/main.js)

<!-- Tách từ CLAUDE.md (11/10/2026). Ghi chú kỹ thuật cho người sửa code / Claude — người dùng thường
     xem huong-dan/00-bat-dau-tu-day.md. Mỗi mục: lỗi đã từng xảy ra + cách làm đúng. Thêm bẫy mới vào ĐÚNG file chủ đề. -->

Trang khách xem: đọc dữ liệu, bảo mật CSP, đo lường, bộ sưu tập, iPhone, đường dẫn, tên miền.

- **Web khách cũng có CSP bằng `<meta>` (08/10/2026)** — 8 trang (7 trang + 404) dùng CÙNG MỘT chuỗi (test-bao-mat kiểm giống
  hệt nhau, không có `*` / `https:` trần). Cho phép: chính web, Supabase, Google Fonts, `img.vietqr.io`, bản đồ Google (khung),
  GA4 (`googletagmanager`, `*.google-analytics.com`, `*.analytics.google.com`, `*.g.doubleclick.net`, `*.google.com(.vn)`) và
  Clarity (`*.clarity.ms`, `c.bing.com`). Thêm dịch vụ ngoài cho web khách → sửa cả 8 trang; test-web-khach bắt
  `securitypolicyviolation` ở mọi trang. GA/Clarity không chạy ở localhost nên test KHÔNG kiểm được chúng — đổi CSP thì kiểm
  tay: gọi `initDoLuong(contactInfo, 'lertherblooming.vn')` trong trang và xem bảng điều khiển có lỗi CSP không.
- **Đọc `localStorage`/`sessionStorage` ở web khách phải bọc `try`** (`docNho()`): máy chặn cookie → đọc là NÉM LỖI. Trước
  08/10/2026 `primeHero()` lỗi ở đó làm trang chủ chỉ còn khung chờ xám. `DOMContentLoaded` giờ chạy từng phần qua
  `chayRieng()` (1 phần lỗi không kéo phần sau chết theo); test-web-khach mục 5 dựng trang chủ với bộ nhớ bị khoá.
- **Đo lường (GA4 + Clarity):** mã nhập ở admin tab Liên hệ → cột `contact.ga4_id` / `contact.clarity_id`
  (SQL 20). Web khách chỉ nạp khi mã khớp `MA_GA4` / `MA_CLARITY` — 2 regex này nằm DUY NHẤT ở
  `js/dungchung.js` (từ 11/10/2026; test-do-luong báo đỏ nếu admin/main.js khai lại — trùng tên `const` là lỗi cả trang). Không đếm khi chạy ở localhost/IP, và máy đã đăng nhập admin
  (cờ `lt_mayCuaShop`, đặt trong `showApp()`). Ghi thao tác bằng `doLuong(ten, thamSo)` — gọi sớm cũng được,
  nó tự xếp hàng chờ tới khi biết có bật hay không. Lưu form Liên hệ phải bỏ cột database chưa có
  (`_contactCot`), không thì chưa chạy SQL 20 là hỏng cả form.
  **Script GA4/Clarity nạp TRỄ (11/10/2026)**: `initDoLuong` dựng hàng chờ ngay nhưng script chỉ gắn vào trang sau `load` + lúc
  rảnh (≤ 4 giây) hoặc khi khách chạm/gõ (`henNapDoLuong` / `napScriptDoLuong`) — nạp sớm làm điện thoại chậm bị chặn ~1 giây.
- **Tắt một BST KHÔNG được làm mất mẫu hoa.** Nút "🌸 Tất cả" trên trang Sản phẩm luôn hiện
  **mọi** mẫu, kể cả mẫu không thuộc BST nào — đây là lá chắn duy nhất sau khi bỏ danh mục, đừng
  viết lại bộ lọc thành "phải thuộc một BST". Admin cũng cảnh báo mẫu chưa thuộc BST nào.
  "Sản phẩm liên quan" ở trang chi tiết lấy theo BST, không có thì lùi về mẫu mới nhất — không
  bao giờ để trống.
- **`bstDangHien()` giờ chỉ CÒN 1 BẢN ở `js/dungchung.js`** (11/10/2026 — trước đó viết 2 lần ở admin và main.js).
  Đừng viết lại bản riêng: lệch là admin báo một đằng web hiện một nẻo (test-bo-suu-tap báo đỏ nếu có bản riêng).
  Tương tự: `slugVi()` trong JS phải cho ra kết quả giống hàm `slug_vi()` trong SQL 21.
- **Hàng Bộ sưu tập trang chủ tự trôi (05/10/2026, `bstTuTruot()` main.js)**: 1 hàng ngang ở MỌI khổ (trước là lưới,
  bộ thứ 5 rớt xuống hàng 2). Không vừa khung thì JS bọc thẻ vào băng chuyền `.bst-ray`, nối đuôi 1 bản sao (`.bst-sao`,
  aria-hidden, tabindex −1) và trôi `BST_TRUOT_TOC_DO` (20px/giây) vòng liền; vừa khung thì đứng yên, bản sao ẩn.
  **Trôi bằng `ray.animate()` (transform, card đồ hoạ lo), KHÔNG bằng `scrollLeft`** — scrollLeft làm tròn điểm ảnh nên
  chậm thì nhích từng nấc + khựng khi trang bận (shop chê "chưa mượt" 05/10). Khách chạm / nhấn chuột / lăn / Tab → `veTay()`
  bỏ hiệu ứng, chuyển sang cuộn thường đúng chỗ đang thấy; buông 1,5 giây → `veTroi()`. Rê chuột chỉ chậm còn ½, KHÔNG dừng
  (shop muốn luôn tự trôi). Vị trí thật = `scrollLeft − m41 của transform .bst-ray`. Chỉ chạy khi hàng trên màn hình, tắt
  khi máy bật "giảm chuyển động". Đếm thẻ thật phải lọc `:not(.bst-sao)`.
  Hiệu ứng "hiện dần" đặt cho CẢ HÀNG (`#bstGrid.reveal`), đừng gắn lại cho từng thẻ (thẻ khuất bên phải sẽ trồi lên).
- **iPhone bắn `resize` liên tục chỉ vì đổi CHIỀU CAO** (thanh địa chỉ thu/hiện khi cuộn, bàn phím bật). Trình nghe
  `resize` nào vẽ lại / đo lại thứ theo bề ngang thì phải bỏ qua khi `innerWidth` không đổi (BST tự trôi, lưới Khoảnh
  khắc) — trước 08/10 chúng chạy lại mỗi lần đó → shop báo web "nhấp nháy" khi xem BST / khi bàn phím hiện.
  `--vvh/--vvtop` của web khách ghi lên `.order-overlay` (gộp theo khung hình), KHÔNG ghi lên `:root`.
- **Trang ảnh tên là "Khoảnh khắc" (`khoanh-khac`), không còn chữ "Gallery" nào khách/admin thấy** (web thuần Việt,
  23/09/2026). Trong code và database vẫn tên `gallery` (bảng, hàm `loadGallery`, `data-tab="Gallery"`) — cố ý
  giữ, đừng đổi tên bảng. Chữ mới hiện ra thì viết "Khoảnh khắc" / "nhóm ảnh", đừng viết "Gallery" / "danh mục".
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
- **Tên miền riêng `lertherblooming.vn` (01/10/2026)**: file `CNAME` ở gốc repo do GitHub tạo — **đừng xoá**
  (xoá là mất tên miền). DNS ở PA Việt Nam: 4 bản ghi A `185.199.108–111.153` + `www` CNAME `thangws17.github.io`,
  không proxy. Link cũ `thangws17.github.io/ler-ther-blooming/…` được GitHub tự chuyển 301 sang tên miền.
  Địa chỉ tuyệt đối ghi cứng ở: thẻ `og:image` (7 trang), thẻ `canonical` (6 trang), `sitemap.xml`, `robots.txt`,
  3 trang chuyển hướng, nút "Mở Lịch giao" trong mail nhắc (`supabase/25_nhac_truoc_gio_giao.sql`). Đổi tên miền lần
  nữa: `grep -rn "lertherblooming.vn" --include=*.html --include=*.xml --include=*.txt --include=*.sql .`
  Trang `chi-tiet` cố ý **không** có canonical (canonical tĩnh sẽ gộp mọi sản phẩm thành một trang).
  `localStorage` theo từng tên miền → cờ `lt_mayCuaShop` / `lt_saoLuuCuoi` / phiên đăng nhập admin bên github.io
  không mang sang; mỗi máy của shop phải đăng nhập admin lại 1 lần trên tên miền mới.
- **Ô không hợp lệ nằm trong mục đang gấp** (vd email sai trong form đặt hoa) → trình duyệt chặn gửi nhưng không tới
  được ô ẩn → khách bấm Gửi không thấy gì. Có trình bắt sự kiện `invalid` tự mở mục đó — mục gấp mới phải dùng class
  `.omx-than` (web) để được hưởng.
- **Web khách trên điện thoại có thanh tab dưới đáy** (`veThanhTabKhach()` trong main.js chèn cho mọi trang, trừ trang
  chi tiết — đáy trang đó là thanh "Zalo + Đặt mẫu này"). Nút nổi (Zalo, lên đầu trang) phải đứng TRÊN thanh này.
  **Từ 07/11/2026 là viên bo tròn nổi giữa đáy, chỉ biểu tượng** (kiểu app Facebook, shop chọn): chữ trong `<span>` vẫn còn,
  chỉ ẩn bằng mắt (`clip-path: inset(50%)`) cho trình đọc màn hình + test "nút có tên" — đừng xoá `<span>`. Admin cùng kiểu.
  Nút ☰ điện thoại chỉ còn mục KHÔNG có ở thanh tab (Câu chuyện + "Chính sách" do `initNav()` chèn, class `.chi-dt`); trang
  chi tiết không có thanh tab (`body` không có `.co-w-tabs`) nên ☰ ở đó vẫn đủ mục.
- **Form đặt hoa web khách không còn `<input type="date">`**: chip Ngày mai / Ngày kia + lịch tự vẽ (`veLichGiao`),
  giá trị vẫn ở `#orderDate` (hidden). Trang chủ chỉ còn 1 ảnh to (`#heroBg`); 2 ô ảnh phụ trong admin đã ẩn.
- **Chống xô lệch bố cục (CLS, đo 11/10/2026)**: khối ở màn đầu trang KHÔNG được ẩn sẵn (`display:none`) rồi JS mới bật — giữ chỗ
  trước: `#bstSection` hiện sẵn khung chờ `.sk-box` (không có bộ nào mới ẩn), `#heroPriceHint` có chữ mẫu + `visibility:hidden`,
  khung chờ trang chi tiết cao sẵn (`#detailContent > .loading`). Trước đó trang chủ xô 0,4, trang chi tiết 0,6 (chuẩn tốt < 0,1).
  Đo lại: CDP + PerformanceObserver `layout-shift` (giả lập điện thoại CPU ×4).
- **Trang chủ hỏi contact SỚM ngay trong `<head>` (07/11/2026)** — đoạn `<script>` nhỏ trong `index.html`: lần 2 trở đi
  xin tải luôn ảnh nền đã nhớ (`heroImageUrl`), đồng thời hỏi bảng contact; biết link ảnh là thêm
  `<link rel="preload" as="image" fetchpriority="high">`. `loadContact()` (main.js) dùng lại kết quả qua
  `window.__contactSom` rồi đặt về null (không hỏi lần 2). Trước đó ảnh nền chỉ bắt đầu tải khi main.js tải + chạy xong
  rồi mới hỏi contact, lại giành mạng với ảnh mẫu hoa → 4G chậm ảnh hiện ở giây ~6,3; giờ ~2,5–3,8 giây.
  Bẫy: (1) đoạn này phải đứng TRƯỚC thẻ `<link rel="stylesheet">` — script nằm sau file CSS phải chờ CSS tải xong mới
  chạy (test-web-khach mục 6 kiểm thứ tự); (2) khoá công khai Supabase giờ ghi ở **3 chỗ**: `js/main.js`, `admin/index.html`
  và `index.html` — đổi khoá thì sửa cả 3; (3) hỏi sớm hỏng / quá 15 giây → trả null, main.js tự hỏi lại như cũ.
- **Ảnh ở màn đầu được ưu tiên (07/11/2026)**: 4 thẻ đầu trang Sản phẩm `fetchpriority="high"` (các thẻ sau `loading="lazy"`);
  Khoảnh khắc: ~2 hàng đầu xin tải trước (cả lúc đo tỉ lệ ảnh `getImageRatio(url, uuTien)` — bước đo dùng `new Image()`
  nên trước đây 12 ảnh cùng giành mạng, bỏ qua cả "tải khi cuộn tới"). Trang chủ: mẫu nổi bật KHÔNG được ưu tiên
  (nhường ảnh nền) — `productCardHTML(p, uuTien)` chỉ nhận `true` thật, `data.map(productCardHTML)` truyền số thứ tự
  vào tham số 2 nên phải so `=== true`.
- **Màu "Vườn kem" như admin (07/11/2026, phương án A "Làm gọn")**: token ở `:root` đầu `css/style.css` (`--bg` kem
  `#F8F5EE`, `--kem-dam`, `--heading` xanh rêu `#1f3a22`, `--text-mid` `#557355`, `--shadow` bóng nâu nhạt). Thẻ trắng nổi
  = nhóm "Thẻ nổi" ở phần 13. Tiêu đề xanh rêu chỉ đặt cho tiêu đề trên nền SÁNG (danh sách ở phần 1) — đặt chung `h1, h2`
  là chìm chữ trắng ở ảnh đầu trang + dải "Có dịp đặc biệt?". Không còn `style="background:#fff"` viết tay ở các `<section>`
  (cả trang một màu kem). Logo là chữ 2 tầng (`.logo > span` xếp dọc, `.logo-accent` = BLOOMING nhỏ), không còn bông hoa.
- **Mọi `:hover` của web khách bọc `@media (hover: hover) and (pointer: fine)` (07/11/2026)** — như admin. Chạm trên điện
  thoại là `:hover` DÍNH (nút ± số lượng xanh đặc mãi, mũi tên ảnh phóng to không về…). Viết hover mới cũng phải bọc. Bấm
  là nút lún `scale: .97` trên mọi máy (khối cuối phần 13); iPhone chỉ hiện `:active` khi trang có nghe `touchstart`
  (main.js có 1 trình nghe rỗng, passive — đừng xoá). `html` bỏ mảng xám lóe khi chạm (`-webkit-tap-highlight-color`).
- **Thẻ viewport có `viewport-fit=cover` (07/11/2026, 8 trang)** — thiếu nó thì mọi `env(safe-area-inset-*)` = 0, các chỗ
  "chừa vạch home iPhone" (thanh tab, nút "Đặt mẫu này", form) KHÔNG có tác dụng. Có nó thì trang vẽ tràn tai thỏ khi xoay
  ngang → `.container` lấy lề `max(20px, env(safe-area-inset-left/right))`. Ô nhập trên điện thoại phải ≥ 16px (ô tìm Sản
  phẩm từng 15,2px → iPhone tự phóng to cả trang).
- **Ảnh trượt trang chi tiết = khung cuộn ngang bắt dính (07/11/2026)**: `#carouselTrack` `overflow-x: auto` +
  `scroll-snap-type: x mandatory` → khách vuốt tay; mũi tên / ảnh nhỏ gọi `_carGoTo(i)` = `scrollTo`, ảnh nhỏ sáng theo vị
  trí cuộn (`_carTheoDoi`), vị trí hiện tại = `_carIdx()` (hàm, không còn là biến). BỎ tự chuyển 5 giây. Đừng quay lại
  dịch bằng `transform` (không vuốt được — lỗi thật trước 07/11).
- **Trang chủ "chào khách" lần đầu (07/11/2026)**: đoạn script đầu `index.html` (đã có sẵn — hỏi contact sớm) đặt
  `html.chao` khi `sessionStorage.lt_chao` chưa có + máy không bật giảm chuyển động. CSS phần 5: chữ / nút / 3 cam kết hiện lần
  lượt; ảnh nền vẽ lại bằng `.hero-card::before` (`background: inherit` mượn ảnh của khung, khung tự `background-size: 0 0`)
  rồi hiện dần + thu 108% → 100% khi `_setHeroImg()` gắn `.da-tai` (ảnh tải xong). Ảnh nền VẪN ghi ở `#heroBg.style`
  (test + thẻ preload so khớp chỗ đó) — đừng dời sang phần tử khác. Đặt xong đơn: `veDatXong()` gọi `canhHoaRoi()` (26 cánh
  hoa `animate()`, tự gỡ sau ~4,6 giây); dấu tích hé dần bằng `clip-path` (biểu tượng vẽ bằng mảng tô, không chạy nét được).
- **Dải thông báo đầu trang nhớ trong máy (07/11/2026, `lt_banner`)**: dải `#siteBanner` hiện SAU khi tải contact (~2,5 giây)
  → đẩy cả trang xuống 73px (xô bố cục ở mọi trang khi shop bật thông báo). `primeBanner()` lúc mở trang hiện ngay chữ đã
  nhớ, `loadBanner()` tải xong thì sửa cho đúng (đổi chữ / shop tắt → ẩn + quên). Lần ĐẦU vào web vẫn xô ở các trang
  khác trang chủ (trang chủ đã có contact sớm). Khách bấm ✕ → `banner_dismissed` (sessionStorage) thắng mọi thứ.
