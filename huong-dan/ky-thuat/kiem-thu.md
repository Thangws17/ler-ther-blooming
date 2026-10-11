# Kiểm thử (test) và xem thử bằng dữ liệu giả

<!-- Tách từ CLAUDE.md (11/10/2026). Ghi chú kỹ thuật cho người sửa code / Claude — người dùng thường
     xem huong-dan/00-bat-dau-tu-day.md. Mỗi mục: lỗi đã từng xảy ra + cách làm đúng. Thêm bẫy mới vào ĐÚNG file chủ đề. -->

## Chạy test

```bash
python serve.py                 # cửa sổ 1: chạy web ở máy
python test/chay-tat-ca.py      # cửa sổ 2: chạy CẢ 12 trang test, in bảng ✓/✕ (~4–6 phút)
python test/chay-tat-ca.py gia  # chỉ chạy trang có chữ "gia" trong tên
```

Hoặc mở <http://localhost:8765/test/> → nút **Chạy tất cả** (cho người không quen dòng lệnh).
`test/chay-tat-ca.py` đã làm sẵn mọi điều kiện ở dưới (thời gian thật, `--remote-allow-origins=*`,
`Emulation.setFocusEmulationEnabled`). Thêm trang test mới → thêm tên vào `TRANG` ở **cả** `test/chay-tat-ca.py`
và `test/index.html`.

## Các trang test (giữ nguyên từ CLAUDE.md)

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
- `/test/test-cu-phap.html` — biên dịch thử toàn bộ JS (web + admin) + kiểm MỤC LỤC đầu admin không lỗi thời. Chạy sau mọi lần sửa file lớn
- `/test/test-bao-mat.html` — nhồi MÃ ĐỘC vào mọi ô dữ liệu (database giả) rồi mở mọi tab/form admin + mọi trang web:
  không mã nào chạy, không thẻ lạ / link `javascript:` / onclick bị phá chuỗi; chữ siêu dài / ô trống không làm tràn;
  lưu thất bại phải báo thật (`ghiDb`); chống spam đơn; thư viện Supabase khoá phiên bản + integrity; `anhNho`

Chạy ngầm không cần mở tay: `chrome --headless=new --virtual-time-budget=90000 --dump-dom http://localhost:8765/test/<tên>.html`
rồi đọc `#tongket` / các `.ca.fail` (mỗi trang tự in dòng tổng kết). **Riêng `test-bao-mat` (phần E, ảnh tải lên) treo
với `--virtual-time-budget`** — `createImageBitmap`/`toBlob` không chạy trong thời gian ảo. Chạy trang đó bằng Chrome
`--remote-debugging-port` (thời gian thật, Python `websocket-client` có sẵn trên máy) rồi đọc `#tongket` qua `Runtime.evaluate`.
`test-web-khach` (~85 giây, đọc Supabase thật) cũng nên chạy kiểu thời gian thật. Chạy bằng cổng gỡ lỗi thì phải thêm
`--remote-allow-origins=*` và gọi `Emulation.setFocusEmulationEnabled` — thiếu nó `focus()` không bắn sự kiện (cửa sổ ngầm
không có tiêu điểm) → test admin "Bấm vào ô giá → hiện giá hay dùng" hỏng oan.
**Dữ liệu giả phải tính ngày theo HÔM NAY**, đừng ghi cứng ngày (01/10/2026 hai test tự hỏng: BST hẹn "2026-10-01", và
chi phí "1–3 ngày trước" rơi sang tháng trước trong khi tab Chi phí xem tháng này → dùng `ngayTrongThang()`).

Trang test **bốc hàm/DOM thật ra khỏi `admin/index.html`** chứ không copy code, nên sửa admin là test
biết ngay. Không nối Supabase để ghi, chạy bao nhiêu lần cũng không đụng dữ liệu thật.

Ngoài 12 trang test, `chay-tat-ca.py` còn kiểm **file `.md`** (xem bẫy Jekyll ở [dung-chung.md](dung-chung.md)).

Công cụ xem thử (không phải test, không tự chấm điểm):
- `/test/xem-admin.html?v=…` — admin với dữ liệu giả (danh sách `?v=` ở đầu file).
- `/test/xem-web.html?trang=…` — web khách mở sẵn form đặt hoa / màn "Đã nhận đơn" (không gửi đơn thật).

## Bẫy khi viết test

- **Xem admin với dữ liệu giả**: `/test/xem-admin.html?v=tq|ds|don|sua|ct|lg|ex|chi|nl|nls|bc|menu` (đưa vào git 11/10/2026;
  `/demo/xem-admin.html` cũ chỉ còn chuyển hướng sang). Thay `sb.from` / `sb.rpc` / `sb.storage` bằng bản giả, không đụng Supabase — dùng để chụp màn hình kiểm giao diện.
  Trình duyệt chạy ngầm không vẽ iframe, nên trang này nạp thẳng mã admin chứ không nhúng.
  Web khách tương tự: `/test/xem-web.html?trang=san-pham&dat=1` (mở sẵn form đặt hoa), `?xong=1` (màn "Đã nhận đơn",
  không gửi đơn thật). Tên / SĐT trong dữ liệu giả phải là tên BỊA — file nằm trong git = công khai trên web.
- **Trang test chạy trong khung ẩn NGOÀI màn hình → trình duyệt dừng hiệu ứng chuyển động giữa chừng** (đo vị trí sai).
  Trang test web khách tự tắt hiệu ứng trong khung. Và đừng để hiệu ứng `transition: all` trên phần tử nổi (nút Zalo):
  vị trí đổi lúc tải trang sẽ thành "trượt giật" — chỉ cho chuyển động transform / bóng.
- **Trang test cắt code admin theo DÒNG MỐC** (`test-gia-san-pham`: `// ── Ô giá sản phẩm` → `function openModal(`;
  `test-form-chi-phi`: `// ── Ô tiền trong form…` → `// ── Lịch lọc ngày…`) và lấy chỗ xuất hiện ĐẦU TIÊN. 11/10/2026 mục lục
  đầu admin chép nguyên dòng mốc → test cắt nhầm vào mục lục, báo "Không nạp được code". Mục lục giờ chỉ ghi TÊN mục;
  test-cu-phap báo đỏ nếu mục lục chứa `// ──`. Đổi chữ ở dòng mốc thì sửa luôn hằng `MOC_` trong 2 trang test đó.
- **Đừng chạy 2 lượt `chay-tat-ca.py` cùng lúc** trên cùng máy với bản cũ (cổng cố định 9333): lượt sau giành trình
  duyệt của lượt trước → đọc nhầm kết quả. Bản hiện tại tự xin cổng trống, nhưng 2 lượt song song vẫn tranh CPU làm
  test đo thời gian chậm sai — chạy lần lượt.
- **Test chạy trên trình duyệt THẬT của shop khác chạy ngầm** (lỗi thật 11/10/2026, shop bấm "Chạy tất cả" ra 7 ca đỏ oan):
  (1) trang test cùng nguồn localhost với admin → `localStorage` có sẵn cờ của máy shop (`lt_mayCuaShop`…). Test đụng cờ nào
  thì ghi nhớ lúc đầu, gỡ ra, xong TRẢ LẠI y nguyên (test-do-luong, test-bao-mat đã làm). (2) Khung test phải nằm TRONG vùng
  nhìn thấy: hàng BST chỉ tự trôi khi đang hiện trên màn hình → `test/index.html` cho khung chạy phủ kín màn hình.
  Kiểm lại kiểu này: chạy `test/index.html` qua CDP, bấm `#nutChay` thật, có đặt sẵn cờ shop trong `localStorage`.
