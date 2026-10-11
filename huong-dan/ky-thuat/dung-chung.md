# Dùng chung web + admin, và luật viết code

<!-- Tách từ CLAUDE.md (11/10/2026). Ghi chú kỹ thuật cho người sửa code / Claude — người dùng thường
     xem huong-dan/00-bat-dau-tu-day.md. Mỗi mục: lỗi đã từng xảy ra + cách làm đúng. Thêm bẫy mới vào ĐÚNG file chủ đề. -->

`js/dungchung.js`, biểu tượng, font, chuyển động, mô tả mẫu hoa, người nhận/giờ giao, bộ gõ tiếng Việt, các bẫy khi viết code.

- **Safari/iPhone KHÔNG xuất được WebP**: `canvas.toBlob(cb, 'image/webp')` không trả null mà lặng lẽ trả **PNG** →
  phải xét `blob.type` (`veVaXuatAnh()`). Trước 01/10 chỉ xét null nên ảnh đăng từ iPhone không được nén (có ảnh 900KB).
- **Bẫy khi ghi file: chuỗi `\u0000` có thể bị biến thành ký tự điều khiển THẬT.** Đã xảy ra với regex lọc
  ký tự cấm trong `xlsx.js` (trình duyệt đổi NUL thật thành ký tự lạ → bộ lọc hỏng mà không báo lỗi). Viết
  xong file có `\uXXXX` thì quét lại ký tự điều khiển ẩn trước khi commit.
- **Viết hàm tiện ích bằng `function`, đừng `const ten = () => …`.** `const`/`let` ở phạm vi gốc
  KHÔNG nằm trong `window`, nên trang test (chạy admin trong iframe) gọi không tới. Cần đặt
  giá trị cho biến `let` từ test thì phải dùng `khung.eval('ten = …')`, gán thẳng là vô tác dụng.
- **`data/*.json`, `admin/config.yml`, `images/uploads/`, `demo-*.html` đã bị xoá** (16/09/2026) — di sản Decap CMS và bản nháp, không còn trong repo. Đừng tạo lại.
- **`js/dungchung.js` giữ hàm dùng chung** (`esc`, `jsAttr`, `linkAnToan`, `noAccent`, `bstDangHien`, `MA_GA4`/`MA_CLARITY`, `anhNho`/`srcNho`, `normalizePhone`, `isValidPhone`, `PHONE_OK`…) cho CẢ
  web khách và admin. Sửa ở đây là cả 2 bên đổi theo — đừng viết lại bản riêng như trước. Nạp bằng thẻ
  `<script>` thường (không module), phải nạp TRƯỚC `js/main.js`.
- **Biểu tượng: MỘT bộ duy nhất trong `js/dungchung.js` (`BIEU_TUONG` + `ic('ten')`)**, dùng cho cả admin lẫn
  web khách; file đó tự chèn bộ `<symbol>` vào đầu `<body>`. HTML tĩnh viết `<svg class="ic"><use href="#i-ten"/></svg>`.
  **Không thêm emoji vào nút/menu nữa** (23/09/2026 đã đổi hết sang biểu tượng nét mảnh). Emoji shop tự đặt cho
  Bộ sưu tập / nhóm ảnh là NỘI DUNG — giữ ở thẻ bìa, bỏ ở nút lọc. Logo 🌸 / favicon là thương hiệu — giữ.
  Chèn `${ic(...)}` thì chuỗi bao ngoài phải là template (dấu `), chuỗi nháy đơn sẽ lỗi cú pháp cả admin.
- **Người nhận + giờ giao nằm trong GHI CHÚ đơn, không có cột riêng.** Mẫu cố định (mỗi thứ 1 dòng đầu ghi chú):
  `Người nhận: Lan · 0912…` / `Giờ giao: 15h`. Ghép bằng `ghepGhiChuDon()`, tách bằng `tachGhiChuDon()` (js/dungchung.js)
  — web khách + form Thêm/Sửa đơn admin + chi tiết đơn + Lịch giao đều dùng 2 hàm này. **Đừng đổi chữ "Người nhận:" /
  "Giờ giao:"** — đơn cũ sẽ không tách được. Giờ chọn bằng **bánh xe cuộn** giờ | phút (`banhXeGio()` trong
  dungchung.js — chủ shop chọn "Kiểu A" 26/09, hiện 3 hàng cho gọn), dùng CHUNG admin + web khách (web gọi với `gon: true`: không viền, không chữ bên cạnh); kiểu CSS cũng nằm trong
  dungchung.js (`chenKieuBanhXe`). Giờ `GIO_GIAO` (8h–21h), phút `PHUT_GIAO` (00 → 55, bước 5 phút), không dùng ô giờ của iOS. Giá trị
  `"15h30"`, phút 00 ghi gọn `"15h"` (`ghepGio`/`tachGio`/`soPhutGio`). Code tự đổi ô hidden giờ → gọi lại `veGioChips(id)`
  (admin) để bánh xe quay theo. Lăn chuột 1 nấc = 1 số (tự bắt `wheel`); chỉ tính là chọn khi có tay/chuột
  chạm cột trong 2 giây (`tayLuc`) — trình duyệt có lúc tự "hít" cột về 8h khi form vừa hiện, từng đổi ngầm giờ đơn.
- **Font (24/09/2026, phương án B "dịu mắt")**: web = Nunito cho tiêu đề/nút (tối đa nét 700, không dùng 800/900 nữa)
  + **Be Vietnam Pro** cho nội dung (thay Open Sans); admin = Be Vietnam Pro toàn bộ (trước là font mặc định của máy),
  nét đậm nhất 700, `b/strong` 600. Biệt danh mẫu hoa vẫn Lora nghiêng. Be Vietnam Pro rộng hơn Segoe → bảng Đơn hàng
  đã thu gọn đệm/tiêu đề cột cho vừa khổ 1280 (test-admin-giao-dien kiểm "bảng đơn không rộng hơn khung").
- **Mô tả mẫu hoa viết theo khuôn "tạp chí"** (SQL 23, 24/09/2026): dòng 1 `“Biệt danh”`, dòng có ` · ` = thành phần,
  dòng có ` — ` = chữ khoá, `Phù hợp tặng …`, còn lại (size, kích thước) là dòng phụ. `tachCaption()` (js/dungchung.js)
  tách ra: web hiện biệt danh dưới tên (cả thẻ lẫn trang chi tiết), "Phù hợp tặng" + dòng phụ vào khung `.detail-cam`;
  admin hiện biệt danh ở danh sách Sản phẩm (`spBietDanh`). Dòng đầu không phải “…” → hiện nguyên chữ (`white-space: pre-line`).
  **Form Sản phẩm admin = phương án C (02/10/2026, shop chọn)**: xếp Y NHƯ trang chi tiết web — ảnh to (`#spcAnhTo` = ảnh
  chính, bấm ảnh nhỏ = `spLamAnhChinh`), tên + **ngôi sao** `#fSao` (giá trị thật vẫn ô tick ẩn `fFeatured`), biệt danh `fNick`,
  giá (chip "giá hay dùng" chỉ hiện khi đang ở ô giá — `spGiaNhanh`), **viên thành phần** (giá trị thật = ô ẩn `fThanhPhan`
  "a, b, c"; `spTpVe/spTpThem`, Enter/dấu phẩy = thêm viên, chữ gõ dở vẫn được lưu), cảm giác `fChuKhoa`, dòng Bộ sưu tập mở
  bảng trượt `#fBstSheet` (vẫn là `#fBstChon` + `layProductBstChon`). Không còn ô `fDesc`: mở form `spMoTaDien()` → `tachCaption`,
  Lưu `spMoTaGhep()` → `ghepCaption()` (dungchung.js) — database vẫn 1 cột `description`. "Phù hợp tặng…" + dòng phụ RIÊNG
  từng mẫu (Kích thước, Tặng kèm của đèn Trung thu) **không có ô** (shop chốt cách "a"): cất trong `_spMoTaGiu`, ghép lại y nguyên.
  Thành phần chỉ 1 thứ được ghi `X ·` (thiếu dấu · thì tachCaption không nhận). Mô tả cũ không theo khuôn → dòng "Mô tả cũ: …";
  không điền ô nào thì lưu giữ nguyên chữ cũ. Trên điện thoại admin ép mọi ô 16px (chống iOS zoom) → tên/giá form C phải `!important`.
- **"Thông tin chung" cho mọi mẫu (SQL 28, 02/10/2026)**: các dòng dưới mọi mẫu ở trang chi tiết (giao miễn phí, ảnh duyệt, COD,
  đặt theo size, tặng kèm túi giấy + thiệp) — trước ghi cứng trong main.js, giờ ở cột `contact.thong_tin_chung` (mỗi dòng 1 ý),
  shop sửa ở tab Sản phẩm → nút "Thông tin chung" (`openTtcModal`/`luuTtc`). `dongThongTinChung(giaTri)` (dungchung.js): `null`
  = chưa chạy SQL 28 → bộ `THONG_TIN_CHUNG_MAC_DINH`; chuỗi rỗng = không hiện gì. Biểu tượng tự chọn theo chữ (`bieuTuongTtc`).
  Web bỏ dòng riêng của mẫu nếu trùng dòng chung (`cungDongTtc`); SQL 28 cũng xoá dòng "Hoa có đặt theo size" cuối mô tả
  từng mẫu. "Phù hợp tặng" trên web giờ biểu tượng trái tim (quà dành cho dòng tặng kèm).
- **Bộ gõ tiếng Việt (Unikey/EVKey) TỰ GỬI chuỗi phím giả để sửa dấu** (phím xoá, bản "sửa lỗi Chrome" còn kèm ký tự tạm).
  2 lỗi thật 03/10/2026 ở ô thành phần form Sản phẩm: (1) "Backspace ở ô trống = xoá viên cuối" → mất sạch các viên;
  (2) "gõ dấu phẩy / ô có dấu phẩy / rời ô = tự thành viên" → gõ "Thắng" ra 6 viên "Tha", "ăng", "ắng"… Luật: **trong lúc
  người dùng đang gõ, KHÔNG làm trống / ghi đè / tách ô đó, KHÔNG gắn hành động xoá vào phím xoá.** Chỉ hành động chủ ý
  (Enter không đang ghép chữ — `!e.isComposing`, hoặc bấm nút) mới được chốt. Test 10b giả lập đúng chuỗi phím bộ gõ.
- **Chuyển động (rà soát 11/10/2026)**: đóng hộp thoại admin dùng **`anModal(id)`** (không gán `style.display='none'` suông
  nữa), form đặt hoa web dùng `dongCoMa()` (js/dungchung.js): ô thật ẩn NGAY (code/test thấy đã đóng như cũ), 1 bản sao
  `.lop-ma` (không id/name, `inert`) diễn cảnh đóng ~0,3 giây rồi tự gỡ — chọn phần tử bằng id thì không vướng bản sao, đếm
  `.modal-overlay` thì phải `:not(.lop-ma)`. Hiệu ứng mới dùng thuộc tính **`scale` / `translate` riêng, KHÔNG `transform`**
  (đè transform là thẻ .reveal kẹt lệch, lịch nổi điện thoại lệch tâm). Đừng đặt `transition` lên thẻ sản phẩm/BST/ảnh (đè hiệu ứng
  hiện dần). Web khách chuyển trang bằng `@view-transition` (thanh trên + thanh tab giữ yên). Cả 2 bên có khối
  `prefers-reduced-motion` tắt mọi hiệu ứng ở CUỐI file CSS — hiệu ứng JS (`animate()`) thì tự kiểm `giamChuyenDong()`.
- **Tự động, không cần sửa từng chỗ**: nút bị khoá có chữ "Đang …" tự hiện vòng xoay (`theoDoiNutCho`, dungchung.js — đặt chữ
  khác "Đang …" là không xoay). Lưu / đổi trạng thái đơn xong gọi `loeDon(id)` → hàng/thẻ đơn đó loé vàng. Ảnh thẻ mẫu hoa /
  BST / Khoảnh khắc web khách hiện dần nhờ class `.anh-mo` trên `<html>` + `.da-tai` (main.js) — thêm lưới ảnh mới thì thêm vào CSS đó.
- **File `.md` bị GitHub Pages (Jekyll) biến thành trang web công khai** (kiểm 11/10/2026: `/CLAUDE.html` mở được).
  Hệ quả: (1) gặp `{` `{` hoặc `{` `%` viết liền trong file `.md` là bộ dịch Liquid hiểu thành lệnh → **cả lần đưa lên mạng hỏng**,
  web đứng ở bản cũ (`test/chay-tat-ca.py` mục `kiem-file-md` tự quét); (2) đừng ghi mật khẩu / mã bí mật / dữ liệu khách thật vào
  file `.md` hay file test (`robots.txt` chặn Google vào `/huong-dan/` nhưng ai có link vẫn đọc được). Không thêm `.nojekyll`
  khi chưa kiểm kỹ: chưa chắc đường dẫn không đuôi `.html` còn chạy.
- **Script Python in tiếng Việt ra cửa sổ lệnh Windows bị lỗi `UnicodeEncodeError`** (bảng mã cp1252) — lệnh ghi file
  phía trước đã chạy xong, lệnh sau thì không → file sửa dở. Đặt `PYTHONIOENCODING=utf-8` hoặc `sys.stdout.reconfigure(encoding='utf-8')`
  trước khi in (serve.py và test/chay-tat-ca.py đã làm sẵn). Sửa file có `\u0300…` bằng script: viết vào file `.py` riêng, đừng
  heredoc trong bash (lớp thoát ký tự chồng nhau, 11/10/2026 từng ghi nhầm ký tự thật).
