# Hướng dẫn Codex — Ler & Ther Blooming

Áp dụng cho toàn bộ dự án. Đọc file này trước khi làm việc. Nội dung được đối chiếu với mã nguồn trong thư mục làm việc ngày **13/11/2026**, gồm cả thay đổi chưa commit; không phải xác nhận trạng thái web hay database đang chạy thật.

## 1. Làm việc với chủ shop

- Chủ shop không phải lập trình viên. Trao đổi bằng **tiếng Việt dễ hiểu**, giải thích kết quả và ảnh hưởng thực tế; chỉ dùng thuật ngữ khi cần và có giải nghĩa.
- **Chỉ sửa đúng phạm vi được yêu cầu.** Không tự thiết kế lại giao diện, đổi nghiệp vụ, tách file lớn, thêm tính năng hay dọn code phần khác. Nếu phát hiện việc ngoài phạm vi, báo rõ để shop quyết định.
- **Demo phải dựng trên giao diện hiện có.** Nhờ chỉnh bộ lọc thì chỉ thay bộ lọc; giữ menu, màu, bố cục, phần tổng hợp và danh sách. Không dựng một trang giao diện mới thay cho màn hình của shop trừ khi được yêu cầu.
- Đề xuất/demo dùng dữ liệu giả, đặt trong `demo/`; chỉ áp dụng vào ứng dụng khi shop yêu cầu. Chọn phương án hoặc nói “làm đi” **không đồng nghĩa với cho phép push**.
- Báo ngắn gọn khi bắt đầu và trong lúc làm việc dài. Khi xong, nói rõ đã thay đổi gì, ở đâu, đã kiểm tra gì và phần nào chưa kiểm được. Không báo “đã đạt” nếu lệnh bị treo hoặc chưa chạy xong.
- Với thay đổi giao diện/demo: chạy local và **mở sẵn trình duyệt đúng màn hình cho shop xem**, không chỉ đưa đường link. Cần shop thử lỗi thì mở đúng màn trước; nếu không mở được, báo rõ.
- Làm các việc đọc, sửa local và kiểm tra đã nằm trong yêu cầu; không hỏi lại cho từng bước thông thường. Tuân thủ yêu cầu cấp quyền của môi trường khi gặp giới hạn thực tế.
- Không tự commit, push, triển khai, chạy SQL trên database thật hoặc ghi dữ liệu thật khi chưa có yêu cầu rõ cho việc đó. Khi đã được cho phép, thực hiện trong đúng phạm vi, không hỏi lại điều shop đã chốt.
- Shop báo đã chạy SQL thì ghi nhận, không hỏi lại. Giữ nguyên `CLAUDE.md` khi chuyển sang Codex; chỉ sửa file đó nếu có yêu cầu riêng.
- Kiểm tra `git status` trước và sau khi sửa. Tôn trọng thay đổi có sẵn, kể cả file chưa commit; không reset, ghi đè hoặc đưa chúng vào commit của mình. Khi cần commit, chọn đúng file/phần được giao, không dùng `git add -A` một cách máy móc.

## 2. Mục đích và công nghệ

Website bán hoa và hệ quản lý của shop **Ler & Ther Blooming**, hai người làm bán thời gian. Phần lớn đơn được chốt qua Facebook/Zalo rồi nhập trong admin; form đặt hoa trên web là nguồn phụ.

- **HTML, CSS, JavaScript thuần**, không framework, không bundler, không bước build ứng dụng, không `npm install`.
- Hai giao diện tĩnh cùng gọi Supabase từ trình duyệt, không có server/API trung gian của ứng dụng. Supabase cung cấp PostgreSQL, Auth, Storage và các hàm SQL/RPC.
- Web khách dùng bộ đọc nhẹ `taoSbNhe()` trong `js/main.js`. Admin dùng Supabase JS bản cố định **2.117.1**, có `integrity`; không tự nâng phiên bản hay thêm thư viện.
- Hạ tầng đã chọn: **GitHub Pages**, tên miền `lertherblooming.vn` trong `CNAME`, Supabase gói miễn phí, email qua **Brevo**. Không tự đổi sang Cloudflare/hosting khác. GA4, Clarity và VietQR đã tích hợp.
- Không có công cụ migration CLI. SQL được chủ shop áp dụng thủ công qua Supabase SQL Editor.

## 3. Các file và thư mục quan trọng

| Đường dẫn | Vai trò / lưu ý |
|---|---|
| `index.html`, `san-pham.html`, `chi-tiet.html`, `khoanh-khac.html`, `cau-chuyen.html`, `lien-he.html`, `chinh-sach.html` | Bảy trang web khách chính. `404.html` là trang lỗi riêng. |
| `css/style.css` | CSS web khách, có mục lục theo phần giao diện. |
| `js/main.js` | Logic chung mọi trang khách. Loader `loadX()` tự thoát khi trang không có phần tử mốc; không tạo file JS riêng cho mỗi trang. |
| `js/dungchung.js` | Hàm dùng chung cho web/admin: an toàn HTML, giá, SĐT, ảnh nhỏ, biểu tượng, ghi chú người nhận, chọn giờ, báo lỗi ô nhập. Nạp trước code sử dụng. |
| `admin/index.html` | Toàn bộ admin trong một file HTML/CSS/JS, cố ý giữ như vậy. Đọc mục lục JS và CSS ở đầu file; không tự tách thành framework/module. |
| `admin/xlsx.js` | Bộ tạo Excel tự viết cho sao lưu, không thêm thư viện Excel. |
| `supabase/` | Hiện có 35 file SQL đánh số; đọc `supabase/README.md` về vai trò, phụ thuộc và tình trạng áp dụng trước khi đụng SQL. |
| `supabase/da-thay-the/` | SQL và hướng dẫn cũ chỉ để tra lịch sử, **không chạy**. |
| `test/` | 13 trang `test-*.html`, trình chạy Python, database giả và các trang xem thử. `test/kiem-tra-tao-don.sql` chỉ dùng trên database thử nghiệm. |
| `huong-dan/` | Tài liệu sử dụng; quyết định đã chốt ở `06-quyet-dinh-da-chot.md`. |
| `huong-dan/ky-thuat/` | Quy ước, lỗi từng gặp và cách tránh theo từng chủ đề. |
| `demo/` | Bản nháp local, bị `.gitignore` loại khỏi Git. Không coi file ở đây là công cụ bắt buộc có trên mọi bản checkout. |
| `images/` | Ảnh cố định; ảnh mẫu hoa do shop đăng nằm ở Supabase Storage. |
| `serve.py`, `serve.ps1` | Server local hiểu URL không đuôi `.html`; PowerShell in thêm link để thử trên điện thoại cùng mạng. |
| `CNAME`, `robots.txt`, `sitemap.xml` | Tên miền và chỉ dẫn tìm kiếm. Không tự xoá/đổi. |
| `dang-sau-nhung-bo-hoa.html`, `san-pham-chi-tiet.html`, `gallery.html` | Chuyển hướng từ link cũ; **không xoá**, phải giữ tham số như `?id=`. |
| `CLAUDE.md`, `.claude/` | Hướng dẫn và thiết lập Claude cũ; `.claude/` chỉ ở máy làm việc, không phải quyền tự động cấp cho Codex. |

Trước khi sửa một khu vực, đọc tài liệu đúng chủ đề:

- Web khách: [web-khach.md](huong-dan/ky-thuat/web-khach.md).
- Admin/bố cục/iPhone/form: [admin-khung-man-hinh.md](huong-dan/ky-thuat/admin-khung-man-hinh.md).
- Đơn hàng, chi phí, báo cáo, nguyên liệu, các tab: [admin-tung-tab.md](huong-dan/ky-thuat/admin-tung-tab.md).
- Dùng chung, CSS, biểu tượng, bộ gõ, ảnh: [dung-chung.md](huong-dan/ky-thuat/dung-chung.md).
- Database/SQL: [database-va-sql.md](huong-dan/ky-thuat/database-va-sql.md), [supabase/README.md](supabase/README.md).
- Kiểm thử: [kiem-thu.md](huong-dan/ky-thuat/kiem-thu.md). Tạo đơn/bản vá 35: [gia-co-tao-don.md](huong-dan/ky-thuat/gia-co-tao-don.md).

## 4. Chạy, xem thử và kiểm tra

Chạy lệnh từ thư mục gốc:

```powershell
python serve.py
# Web: http://localhost:8765/
# Admin: http://localhost:8765/admin/
```

`python serve.py 9000` đổi cổng; trình kiểm thử hiện mặc định dùng **8765**. `./serve.ps1` hỗ trợ xem trên điện thoại cùng mạng. Không dùng `python -m http.server` thay thế và không mở HTML bằng `file://`, vì link không đuôi và các thao tác tải file sẽ sai.

**Admin local thông thường vẫn nối dữ liệu thật.** Xem giao diện bằng công cụ giả sẵn có:

- `http://localhost:8765/test/xem-admin.html?v=ds`: Đơn hàng.
- `http://localhost:8765/test/xem-admin.html?v=ex`: Sổ chi phí; `?v=chi`: form thêm chi phí.
- `?v=bc`: Báo cáo; danh sách tham số đầy đủ ở đầu `test/xem-admin.html`. `?v=tq` là tên cũ, hiện mở Đơn hàng.
- `http://localhost:8765/test/xem-web.html?trang=san-pham&dat=1`: form đặt hoa với cơ chế xem thử.

Không có lệnh build ứng dụng. Trình kiểm thử dòng lệnh cần **Python, Google Chrome và gói Python `websocket-client`**. Nếu thiếu gói và cần chạy kiểm thử, lệnh cài là `python -m pip install websocket-client` (không phải thư viện ứng dụng); tuân thủ quyền cài đặt của môi trường.

```powershell
# Cửa sổ khác, giữ server 8765 đang chạy:
python test/chay-tat-ca.py

# Chạy trang có chuỗi tương ứng trong tên:
python test/chay-tat-ca.py cu-phap
python test/chay-tat-ca.py form-chi-phi admin-giao-dien
```

- Có **13 trang kiểm thử**, danh sách `TRANG` ở `test/chay-tat-ca.py` và `test/index.html` phải khớp nhau. Python kiểm thêm Markdown nên chạy đầy đủ hiện có **14 mục**. Mã thoát 0 là đạt, 1 là lỗi kiểm thử, 2 là thiếu điều kiện chạy.
- Có thể mở `http://localhost:8765/test/` và bấm **Chạy tất cả**. Giữ trang đang chạy ở vùng nhìn thấy.
- Chạy kiểm tra phù hợp với phần sửa; trước khi giao bản sửa ứng dụng chính thức hoặc push, chạy toàn bộ và xử lý lỗi liên quan. Không chạy nhiều lượt cùng lúc. Không báo đạt nếu thiếu Chrome, thư viện, mạng hoặc trình chạy bị treo.
- Chỉ sửa tài liệu: kiểm nội dung, đường dẫn, ký tự cấm của Jekyll và diff; không cần chạy toàn bộ test giao diện hay mở demo chỉ vì sửa Markdown.
- Test ghi dữ liệu dùng bản giả. **`test-web-khach` có đọc dữ liệu công khai thật từ Supabase**, còn phần gửi đơn dùng giả; bộ test không hoàn toàn chạy ngoại tuyến.
- `test-do-tin-cay` kiểm hàm admin bằng dữ liệu giả và đối chiếu **mã nguồn SQL**, không xác minh PostgreSQL thực thi đúng. Muốn kiểm SQL 35 phải dùng database thử nghiệm và quy trình riêng trong `gia-co-tao-don.md`; không chạy `test/kiem-tra-tao-don.sql` trên database shop.
- Test ảnh/bảo mật cần thời gian thật; không thay trình chạy bằng `--virtual-time-budget`. Giữ cơ chế focus emulation của trình chạy.
- Dữ liệu mẫu lấy ngày theo hôm nay; chi phí mẫu cần nằm trong kỳ đang xem. Dùng hàm/DOM thật của ứng dụng, không sao chép lại logic chỉ để test đạt. Khi thêm test, cập nhật cả hai danh sách `TRANG`.

## 5. Quy ước và giới hạn khi sửa code

### JavaScript, CSS và giao diện

- Giữ phong cách sẵn có của phần đang sửa; không định dạng lại cả file. Hàm tiện ích cần gọi từ test/HTML dùng khai báo `function`; biến `let`/`const` gốc không phải thuộc tính `window`.
- Dùng lại hàm trong `js/dungchung.js`, không tạo bản riêng cho web/admin. Kiểm ảnh hưởng cả hai phía khi đổi hợp đồng dữ liệu hoặc logic dùng chung; **không vì vậy mà sửa UI bên kia nếu yêu cầu chỉ ở một bên**.
- CSS đặt đúng phần trong mục lục, `@media` đi cùng phần; không dán các khối ghi đè theo từng đợt xuống cuối. Admin không thêm inline style tĩnh, trừ ẩn/hiện và giá trị tính theo dữ liệu đã dùng sẵn.
- Giữ giao diện “Vườn kem”, font và bộ biểu tượng hiện có. Dùng `ic()` / `BIEU_TUONG`, `nutTT()` cho nút thao tác; không thêm emoji hoặc ký tự thay biểu tượng trong menu/nút. Emoji thuộc nội dung BST/album vẫn giữ.
- Dùng modal, bảng trượt và lịch sẵn có; không dùng `alert()`/`prompt()`, không thêm ô ngày/tháng mặc định. Đổi ngày hidden bằng JS phải `fdSync(id)`.
- Ô tiền dùng **`type="text"` + `inputmode="numeric"`**, đọc/ghi qua `moneyNum()` / `moneySet()`, không dùng `type="number"`. Ô trống không được ngầm biến thành 0.
- Lỗi ô nhập dùng `baoLoiO()` ngay tại ô; toast chỉ dành cho kết quả thao tác/lỗi mạng. Ô lỗi đang ở phần gấp/ẩn phải được mở ra.
- Responsive điện thoại là bắt buộc. Giữ riêng `--apph` cho khung app và `--vvh` cho modal/vùng bàn phím; không dùng `100vh` cho khung admin toàn màn hình, không đặt sticky trong `.content`, không đặt `display:flex` lên `td`.
- Hover phải bọc trong `@media (hover: hover) and (pointer: fine)`. Không `transition: all`; tôn trọng giảm chuyển động. Đóng modal qua cơ chế sẵn có, dọn modal ở `closeAllModals()`.
- Không tự ghi đè/làm trống/tách ô đang gõ tiếng Việt; xét `isComposing` trước khi chốt bằng Enter. Kiểm tương tác bằng nút thật, đặc biệt lịch/popover; gọi thẳng hàm có thể bỏ sót lỗi lan truyền sự kiện.
- Link điều hướng web khách không có đuôi `.html`. Giữ ID, dòng mốc và mục lục mà test đang dùng; đổi mốc thì cập nhật test liên quan.
- Ghi UTF-8, tránh ký tự điều khiển ẩn. Đọc/ghi bộ nhớ trình duyệt có xử lý trường hợp bị chặn; script Python in tiếng Việt trên Windows dùng UTF-8.

### Dữ liệu và nghiệp vụ cần giữ

- Đơn hàng: lọc/tìm trên server qua `buildOrdersQuery()` / `applyOrderFilters()`; mảng `orders` chỉ chứa trang hiện tại. Tra theo ID dùng `orderById()`, ghi xong gọi `reloadActiveOrderViews()`.
- **Sổ chi phí:** ngày/khoảng ngày quyết định kỳ của tổng hợp và danh sách. Lọc loại/tìm chữ (`exLocDanhSach`) chỉ lọc danh sách, **không thay tổng hợp/lãi phía trên**. Bộ lọc mới phải giữ quy tắc này và tổng kết kết quả riêng.
- Doanh thu theo **ngày giao**, thiếu thì theo ngày tạo; dùng `REVENUE_STATUSES`, `DONE_STATUSES`, `ORDER_STATUSES`. Thanh toán tách riêng trạng thái đơn; tính các số tiền qua hàm chung như `tienCuaKy()`.
- SĐT dùng chung từ sổ khách là chủ ý: ưu tiên `customers.phone`, `customer_phone` là dự phòng khi xoá khách. Không tự chuyển sang lưu độc lập từng đơn. Sửa SĐT phải rà `oePhone`, `noPhone`, `cuPhone`.
- Giá mẫu hoa là **TEXT**, có thể “Liên hệ” hoặc “Từ 2xx”; dùng `hienGia()` và hàm bao hiện có. Không gom mọi chữ số thành tiền, không coi “2xx” là 2 đồng.
- Người nhận/giờ giao nằm trong ghi chú, ghép/tách bằng `ghepGhiChuDon()` / `tachGhiChuDon()`; giữ tiền tố “Người nhận:” và “Giờ giao:”. Không tự thêm cột. Lịch lọc dùng `LOC_NGAY`, không sao chép lịch.
- Sản phẩm thuộc nhiều BST qua `collection_products`; tắt BST không làm mất mẫu khỏi “Tất cả”. `gallery_categories` chỉ dùng cho album Khoảnh khắc.
- Nguyên liệu so tên qua `tenKhoa()` / `nlKhop()`, không so chuỗi bằng nhau đơn giản. Không thêm tồn kho/giá vốn: shop chỉ ghi chi phí theo dòng tiền.
- Không sửa lời văn trang Câu chuyện do shop tự viết khi chỉ được nhờ chỉnh bố cục.

### An toàn dữ liệu, ảnh và SQL

- Dữ liệu đưa vào HTML phải `esc()`; chuỗi lồng trong `onclick` dùng `jsAttr()`. Link shop nhập đi qua `linkAnToan()`; thêm chỗ hiển thị dữ liệu phải kiểm `test-bao-mat`.
- Ghi admin phải kiểm `error` **và trường hợp 0 dòng**, dùng `ghiDb()` với `.select('id')` khi phù hợp. Chỉ cập nhật cache, đóng form/xoá dấu chưa lưu, báo thành công sau khi ghi thật sự đạt.
- Khoá Supabase publishable trong frontend là chủ ý; không đưa service-role, token Brevo, mật khẩu hay dữ liệu khách thật vào mã nguồn/tài liệu/test. Không đưa `app_settings` vào sao lưu Excel.
- Đã đăng nhập không có nghĩa là quản trị. Giữ RLS và lớp restrictive `chi quan tri%` theo `quan_tri` / `la_quan_tri()`. Script dọn policy phải chừa lớp này; không nới CSP/quyền chỉ để làm test hết lỗi.
- Khách ghi đơn qua RPC `place_order`, không ghi bảng trực tiếp. Web dùng `taoSbNhe()`: nếu thiếu phép truy vấn thì mở rộng bộ đọc, không nạp thư viện Supabase đầy đủ. Lệnh đọc có giới hạn 15 giây, RPC không tự cắt giữa chừng để tránh gửi trùng.
- Đổi logic `place_order` phải giữ đồng bộ **file 15 và bản vá 35**, chạy kiểm mã nguồn và kiểm database thử nghiệm tương ứng. Trong mã hiện tại, đặc quyền dựa vào `la_quan_tri()`, khoá giao dịch `72638135` bảo vệ đếm quota đồng thời. Không tự bỏ/đổi cơ chế đó.
- SQL mới phải chạy lại được, đánh số tiếp theo và ghi mục đích/phụ thuộc. Có bảng mới: rà luật file 24 và `SAO_LUU_BANG`; có bảng/cột mới: cập nhật `SQL_DAU_HIEU`. Cập nhật mục lục SQL; không suy ra đã áp dụng thật chỉ vì file có trong repo.
- Không chạy lại SQL hàng loạt theo số một cách máy móc. File 17 được hướng dẫn chạy sau cùng khi dựng lại; file 35 yêu cầu file 15 và 24. Đọc phụ thuộc và trạng thái trong tài liệu trước khi hướng dẫn shop.
- Upload ảnh qua `taiAnhLen()`, không gọi storage upload trực tiếp. Ảnh nhỏ dùng `srcNho()`; ảnh lớn giữ ảnh gốc. `ANH_NHO_BAT=false`, bản nhỏ tự tạo rộng 640px cho gói miễn phí; không tự bật tính năng trả phí.
- GitHub Pages dùng Jekyll: **không viết hai dấu ngoặc nhọn mở liền nhau, hoặc ngoặc nhọn mở liền dấu phần trăm, trong Markdown** vì có thể bị hiểu là lệnh Liquid. Tài liệu cũng có thể được công khai thành trang web; không thêm bí mật. Không tự thêm `.nojekyll` hoặc cấu hình hosting khác.

## 6. Điểm tài liệu cũ chưa khớp mã hiện tại

Các điểm dưới đây được ghi nhận, **không sửa `CLAUDE.md` hay ứng dụng chỉ để làm tài liệu khớp**. Khi gặp mâu thuẫn khác, báo rõ nguồn và hành vi thực tế, không tự đổi nghiệp vụ.

| Tài liệu / chỗ bị cũ | Kết quả đối chiếu và cách hiểu cho Codex |
|---|---|
| `CLAUDE.md`, bản đồ thư mục và một số ghi chú nói 12 trang test; `02-viec-hay-lam.md` nêu tổng 13 mục | Hai danh sách `TRANG` hiện có 13 trang, đã thêm `test-do-tin-cay`; Python cộng kiểm Markdown là **14 mục**. |
| `README.md` nói chỉ cần Python, không phải cài gì thêm | Đúng cho server; trình kiểm thử Python còn import `websocket` và phải tìm được Chrome. |
| `CLAUDE.md`/bản đồ thư mục còn nói SQL đến 33 | Thư mục hiện có **35 file**; `supabase/README.md` ghi file 34 chờ chạy, file 35 shop đã chạy trên database thật (16/11/2026). |
| `supabase/README.md`, `04-du-lieu.md` và vài đoạn cũ nhắc tab Tổng quan; `CLAUDE.md` đặt nút tối ưu ảnh ở đó | `TAB_DAU='Orders'`; Tổng quan đã bỏ. Dải nhắc/kiểm SQL ở Đơn hàng, sao lưu và tối ưu ảnh ở **Báo cáo → Công cụ** (`#congCu`). |
| `admin-tung-tab.md` có câu thanh tab dưới còn 4 nút | HTML hiện có **5 nút**: Đơn hàng, Lịch giao, Sản phẩm, Chi phí, Menu. |
| `CLAUDE.md` mô tả miễn chống spam cho admin đã đăng nhập | SQL 15/35 trong thư mục hiện dùng **`la_quan_tri()`** và từ chối tài khoản ngoài shop. File 35 chưa được ghi nhận áp dụng; không suy ra hành vi database thật chỉ từ code local. |
| `web-khach.md` có đoạn cũ nói khoá công khai ở 3 chỗ | Code hiện có ở **9 file**: `js/main.js`, `admin/index.html` và 7 trang khách. Rà cả chín nếu có yêu cầu đổi khoá. |
| `web-khach.md` nói server hiện tại luôn trả charset | `serve.py` đang kế thừa MIME HTML của `SimpleHTTPRequestHandler`, không tự thêm charset cho HTML bình thường; nhánh 404 có charset. HTML có thẻ UTF-8; không coi header charset đã được bảo đảm. |

## 7. Quy trình giao việc và đưa lên mạng

1. Đọc yêu cầu, kiểm trạng thái Git, đọc tài liệu chủ đề, giữ thiết kế/nghiệp vụ đã chốt.
2. Sửa hoặc dựng demo đúng phần được giao. Không sửa phần khác chỉ vì đang thấy vấn đề.
3. Kiểm tra theo mục 4, xem diff; báo rõ giới hạn kiểm chứng. Với UI, mở sẵn bản local đúng màn và cho shop xem kết quả cụ thể.
4. Chỉ khi shop bảo rõ “push”/đưa lên mạng mới commit và push phần được phép; GitHub Pages tự triển khai từ `main` theo quy trình dự án. Không coi việc duyệt demo là cho phép phát hành.
5. Khi được yêu cầu phát hành, kiểm bản live và chuẩn bị câu `insert into changelog ...` bằng tiếng Việt cho shop dán, không tự ghi nhật ký vào database. Lệnh curl trên máy Windows này được tài liệu ghi cần `--ssl-no-revoke` khi gặp lỗi kiểm tra thu hồi chứng chỉ; đây không phải tuỳ chọn bắt buộc ở mọi máy.

Tài liệu nền: [README.md](README.md), [CLAUDE.md](CLAUDE.md), [bản đồ thư mục](huong-dan/01-ban-do-thu-muc.md), [việc hay làm](huong-dan/02-viec-hay-lam.md), [quyết định đã chốt](huong-dan/06-quyet-dinh-da-chot.md).
