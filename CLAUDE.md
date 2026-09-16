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
- `/test/test-khung-man-hinh.html` — khung màn hình admin trên iPhone (xem "Bẫy đã biết")
- `/test/test-form-chi-phi.html` — ô ngày + ô tiền trong form chi phí
- `/test/test-phan-trang-don.html` — phân trang đơn: kiểm đúng URL truy vấn gửi lên Supabase

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

**Ảnh:** upload nào cũng đi qua `compressImage()` trong admin — thu về ≤1600px, xuất WebP q0.78 (fallback JPEG), bỏ qua file <300KB; rồi `sb.storage.from('images').upload(path, file, { cacheControl: '31536000' })`. Thư mục trong bucket: `products/`, `gallery/`, `hero/`, `expenses/` (ảnh hoá đơn không lên web công khai). `optimizeOldImages()` là nút chạy một lần cho ảnh cũ, nhận diện ảnh đã tối ưu qua `_optw_` / đuôi `.webp`.

**Doanh thu** tính theo **ngày giao** (trống thì lấy ngày tạo). Trạng thái nào được tính nằm ở `REVENUE_STATUSES` / `DONE_STATUSES` (`admin/index.html`, gần dòng 3850). Vòng đời: `Mới → Đã xác nhận → Đang giao → Giao thành công → Hoàn thành` (khoá sửa) hoặc `Đã hủy`.

## Bẫy đã biết

- **`place_order` được định nghĩa lại ở 4 file SQL.** Bản hiện hành là `supabase/15_notifications_v2.sql` (11 tham số, có `p_email`). Ba bản cũ (10 tham số) đã dồn vào `supabase/da-thay-the/` — chạy vào là **lùi** hàm về bản cũ. Sửa RPC thì sửa trong `15_notifications_v2.sql`.
- **File SQL đánh số theo thứ tự chạy** (`01_` → `17_`); `17_rls_lockdown.sql` luôn chạy cuối cùng khi dựng lại DB. Đổi tên file SQL thì phải sửa cả 2 thông báo trong `admin/index.html` đang nhắc tên file (`14_changelog_setup`, `03_order_phone_snapshot`).
- **Trạng thái đơn bị database khoá chỉ nhận 6 giá trị** (`supabase/19_order_status_check.sql`), phải
  khớp y hệt `ORDER_STATUSES` trong admin. Thêm/đổi tên trạng thái: sửa SQL **trước**, rồi mới sửa JS —
  ngược lại thì lưu đơn bị từ chối. Mọi chỗ ghi status đều phải lấy từ `ORDER_STATUSES`, đừng gõ tay chuỗi.
- **Giá sản phẩm lưu dạng TEXT** (`"600,000đ"`, `"Liên hệ"`, `"Từ 2xx (Theo size order)"`) — luôn qua `fmtPrice()`, đừng coi là số.
- **`data/*.json`, `admin/config.yml`, `images/uploads/`, `demo-*.html` đã bị xoá** (16/09/2026) — di sản Decap CMS và bản nháp, không còn trong repo. Đừng tạo lại.
- **Không đặt được HTTP header trên GitHub Pages.** `_headers`/`netlify.toml` đã xoá vì GH Pages không đọc (đã kiểm: bản live không trả về `X-Frame-Options`). Đừng tạo lại — muốn có header bảo mật thật thì phải đổi hosting.
- **Chạy local bằng `python serve.py`, KHÔNG dùng `python -m http.server`.** Web bỏ đuôi `.html` trong
  link (`/san-pham`); GitHub Pages tự hiểu, còn server có sẵn của Python thì không → báo 404 khắp nơi dù
  web thật vẫn chạy. `serve.py` bắt chước đúng GitHub Pages (URL không đuôi + trả `404.html`).
- **Link nội bộ KHÔNG ghi đuôi `.html`.** Trang chủ là `./`, các trang khác `san-pham`, `chi-tiet?id=…`.
  Menu tô sáng mục đang xem bằng `tenTrang()` trong `js/main.js` (bỏ đuôi .html khi so) — đừng quay lại
  so nguyên tên file. Trang 404 dùng `data-to=""` cho trang chủ vì JS tự ghép tiền tố repo.
- **2 trang đã đổi tên (16/09/2026):** `dang-sau-nhung-bo-hoa` → `cau-chuyen`, `san-pham-chi-tiet` →
  `chi-tiet`. File tên cũ giờ là **trang chuyển hướng — đừng xoá**, link cũ trên Facebook/Zalo/Google
  còn trỏ vào. Chúng chuyển bằng JS trước để giữ `?id=` sản phẩm (meta refresh làm rơi mất).
- **Khi có tên miền riêng**, địa chỉ `https://thangws17.github.io/ler-ther-blooming/` đang ghi cứng ở:
  thẻ `og:image` (7 trang), thẻ `canonical` (6 trang), `sitemap.xml`, `robots.txt`, 2 trang chuyển
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
  đúng (chỉ đổi chuỗi thuần số tiền).
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
