# Admin — khung màn hình, iPhone, ô nhập, form

<!-- Tách từ CLAUDE.md (11/10/2026). Ghi chú kỹ thuật cho người sửa code / Claude — người dùng thường
     xem huong-dan/00-bat-dau-tu-day.md. Mỗi mục: lỗi đã từng xảy ra + cách làm đúng. Thêm bẫy mới vào ĐÚNG file chủ đề. -->

Những lỗi hiển thị trên iPhone đã gặp, cách làm ô ngày / ô tiền / chip / popover, luật đặt class và bố cục.

- **Admin có CSP bằng thẻ `<meta>`** (GH Pages không cho header): chỉ nạp/gửi tới chính web + Supabase + jsDelivr + Google
  Fonts. Thêm dịch vụ ngoài mới cho admin (ảnh từ tên miền khác, API…) thì PHẢI thêm tên miền vào CSP, không là bị chặn
  âm thầm (test-bao-mat mở mọi tab và bắt `securitypolicyviolation`). Có `'unsafe-eval'` vì trang test gọi `eval()` trong
  khung. Kèm mã chặn bị nhúng vào khung web lạ (khung cùng nguồn — trang test — vẫn được). Admin + trang test có `noindex`.
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
- **Bàn phím đang mở → `body.phim-dang-mo` (21/10/2026)**: `measureViewport()` bật class khi vùng nhìn thấy thấp hơn
  `innerHeight` > 150px và KHÔNG đang phóng to 2 ngón (`visualViewport.scale < 1.05`). CSS (khối ≤820px, cạnh thanh tab dưới):
  form bung kín phần trên bàn phím (`.modal-box` cao `--vvh`, bỏ bo góc + tay nắm), tiêu đề + chân form 1 dòng mảnh, ẩn
  `.fx-con` ("Còn thu khi giao"), ẩn thanh tab dưới / nút ＋ / nút lên đầu. Trước đó trên iPhone tiêu đề + chân form ăn gần
  hết chỗ, chỉ thấy ~2 ô (shop: "giao diện còn xíu"). Bật class xong / đổi ô khi đang mở → `giuONhapTrongTam()` cuộn RIÊNG
  `.modal-body` cho ô đang gõ nằm 1/3 trên (không `scrollIntoView`). Test giả bàn phím bằng `Object.defineProperty(w,
  'visualViewport', …)` rồi gọi `measureViewport()` (test-admin-giao-dien nhóm 5d) — nhớ trả descriptor gốc sau đó.
- **Đừng đặt `position: sticky` cho phần tử nằm TRONG `.content`.** `.content` là khung cuộn;
  sticky bên trong khung cuộn là chỗ iOS vẽ sai toạ độ → thấy phần tử nhưng bấm không trúng.
  `.admin-topbar` vì vậy là anh em của `.content`, không phải con.
- **Popover tự vẽ lại khi bấm (lịch ‹ ›) + trình xử lý "bấm ra ngoài thì đóng" = lỗi tự đóng.** Vẽ lại
  bằng `innerHTML` gỡ chính nút vừa bấm khỏi trang; khi sự kiện lan tới `document`, `closest()` trên phần tử
  đã bị gỡ trả `null` → tưởng bấm ra ngoài → đóng lịch ngay (lỗi thật 17/09: không chuyển được tháng). Trình
  xử lý chung đã chặn bằng `if (!e.target.isConnected) return`. Viết popover mới cũng phải nhớ điều này.
  **Test UI phải BẤM NÚT THẬT (`.click()`)**, đừng gọi thẳng hàm — test cũ gọi `fdStepMonth()` nên không bắt được.
- **Thanh tab dưới đáy `.bottom-tabs` (điện thoại) cùng luật với `.admin-topbar`**: là anh em của `.content`,
  KHÔNG nằm trong khung cuộn, không fixed/sticky. Tab nào có nút ＋ nổi thì khai ở `FAB_THEO_TAB`.
- **Thứ "ẩn bằng cách trượt ra ngoài màn" phải trượt HẲN ra** (06/11/2026): thanh chọn nhiều ảnh `.bulk-bar` ẩn bằng
  `translate(-50%, 160%)` — trên điện thoại nó đứng cao 74px (trên thanh tab) nên ở khổ 600–900px còn lòi lên ~13px, che
  chữ thanh tab ở MỌI tab. Giờ là `calc(100% + 140px)`. Cùng kiểu: menu bên đóng (`.sidebar` trượt -100%) vẫn đổ bóng
  thành dải xám mép trái → bóng chỉ đặt ở `.sidebar.open`.
- **Bộ mặt "Vườn kem" + "Nội dung nổi" (06/11/2026)** nằm ở khối CSS CUỐI CÙNG trong `<style>` của admin (Ctrl+F
  `Bộ mặt "Vườn kem"`): menu bên trên nền kem đậm `#EAE2D0`, phần làm việc `.content` là tấm sáng `#F8F5EE` — máy tính
  thêm bo 22px + bóng + lề 10px (shop chê menu cùng màu nội dung, không biết đâu là menu); thẻ trắng bo 18px + bóng nâu
  nhạt, tiêu đề Nunito. Thanh trên điện thoại + `theme-color` cùng màu tấm `#F8F5EE`. (Dải chào `#dbChao` đã bỏ cùng
  Tổng quan.) Nó thắng nhờ đứng SAU (cùng độ ưu tiên), không dùng
  `!important` — nên quy tắc trạng thái (`:hover`, `.active`, `.qua-han`) vẫn thắng nó. Thêm loại thẻ trắng mới → thêm
  class vào nhóm "thẻ nổi" ở đó. `.dv` có viền trái màu nên chỉ đổi màu 3 cạnh còn lại (đừng `border-color` cả 4).
  Ô modal trên điện thoại giữ bo góc riêng (bo 18px chỉ áp từ 821px).
- **Tên class đặt lên `<body>` không được trùng class dùng cho phần tử.** Lỗi thật 23/09: `body.co-fab` trùng
  `.co-fab { display:none }` → mở tab Đơn hàng trên điện thoại là cả trang trắng. Giờ là `body.dang-co-nut-noi`
  và `.an-tren-dt`; test-khung-man-hinh kiểm từng tab.
- **`<td>` không được `display:flex`** — rớt khỏi bố cục bảng, cột nút lệch/tràn mép (lỗi cũ của `.actions`).
- **Form Thêm đơn + Thêm chi phí kiểu mới** (chip, mục gấp `.fx-more`, ô ẩn giữ đúng id cũ): chip chọn giá trị
  qua `segSet(id, v)` (trạng thái đơn, loại chi phí), ngày nhanh qua `qdPick` và `fdSync` tự tô chip. `form.reset()`
  KHÔNG đặt lại ô hidden → mở form phải tự `segSet` về mặc định. Chip do JS xử lý không bắn `input` nên tự gọi
  `danhDauDangNhap(el)` để cảnh báo "đang nhập dở" còn chạy. Ô đơn giá / phí ship của form thêm đơn giờ là ô tiền
  có dấu chấm (`moneyNum`), không còn `type="number"`.
- **Nút thao tác trong danh sách admin dùng `nutTT(ten, nhan, onclick, {xoa, tat})`**: máy tính chỉ hiện biểu
  tượng (rê chuột ra tên), thẻ điện thoại `.mc-actions` hiện cả chữ. Đừng viết lại nút "✏️ Sửa / 🗑 Xóa" kiểu cũ.
- **Dải trượt ngang + chuột**: hàng chip trên máy tính phải xuống dòng (CSS `(hover: hover) and (pointer: fine)`), hàng thẻ
  thì nhấn-giữ-kéo được nhờ `keoNgangBangChuot()` (dungchung.js) — dải trượt ngang mới thêm vào `KEO_NGANG`.
