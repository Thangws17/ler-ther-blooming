# Admin — từng tab (Đơn hàng, Báo cáo, Khách hàng, Sản phẩm…)

<!-- Tách từ CLAUDE.md (11/10/2026). Ghi chú kỹ thuật cho người sửa code / Claude — người dùng thường
     xem huong-dan/00-bat-dau-tu-day.md. Mỗi mục: lỗi đã từng xảy ra + cách làm đúng. Thêm bẫy mới vào ĐÚNG file chủ đề. -->

Cách từng tab tải và vẽ dữ liệu, các quy ước riêng của mỗi tab.

- **Mảng `orders` CHỈ chứa trang đơn đang xem, không phải cả bảng.** Tab Đơn hàng tải theo trang
  (`ORDERS_PAGE` = 20, `buildOrdersQuery()` lọc trên server, `count: 'exact'` để đếm). **Đừng bao giờ
  `orders.filter(...)` để lọc/tìm** — sẽ chỉ tìm trong mấy chục đơn đã tải rồi báo "không có đơn nào".
  Đổi bộ lọc thì gọi `applyOrderFilters()`, không gọi `renderOrders()` suông.
  **Lọc ngày giao là 1 ngày HOẶC khoảng ngày (07/10/2026)**: `#orderDateFilter` = ngày (hoặc ngày đầu), `#orderDateTo` = ngày
  cuối (trống = đúng 1 ngày). Đặt cả hai bằng `ordSetRange(tu, den)`, đọc bằng `ordRange()`. Chip "Tháng này" + nút "Cả tháng"
  trong lịch = khoảng ngày 1 → cuối tháng (`thangDauCuoi`). Lịch KHÔNG có nút chọn kiểu (shop chê rườm rà): bấm 1 ngày =
  lọc luôn ngày đó, lịch vẫn mở (`_ln[k].tam`); bấm thêm ngày nữa = cả khoảng, dải nối liền loé sáng rồi đóng (`LN_TRE_DONG`).
  Dải nối cần `.ln-luoi` (column-gap 0 + ô cao cố định — `.cal-day` gốc có aspect-ratio + max-height làm ô hẹp, hở khe).
  Dải vẽ bằng `::before` PHÍA SAU ô (lưới là lớp riêng, ô KHÔNG đặt z-index) để ô giữ viền bo tròn — đừng đổi border-radius của ô.
  **Lịch lọc ngày là bộ DÙNG CHUNG `LOC_NGAY` + `lnMo/lnChon/lnVe(k)`** (`k` = `'don'` Đơn hàng, `'chi'` Sổ chi phí; trạng thái
  ở `_ln[k]`). Nơi mới cần lọc ngày thì khai thêm 1 mục trong `LOC_NGAY`, đừng chép lại lịch.
  **Sổ chi phí**: KHÔNG có nút "Chọn ngày" riêng — bấm chính ô tháng `#expenseMonthDisplay` (nút) mở lịch; "Xóa lọc" = `exXoaLoc()`
  (về tháng này + bỏ tìm/loại). Kỳ = cả tháng `expenseMonth` hoặc khoảng tự chọn `exTu`/`exDen` (`exKy()`; chọn trúng trọn 1 tháng thì
  `exSetRange` tự quy về xem tháng đó). Doanh thu/lãi tính theo kỳ (`_statCtxEx.ky`). Chip loại + ô tìm (`exLocDanhSach`) chỉ
  lọc DANH SÁCH ở máy, không đổi số tổng hợp phía trên (lọc loại mà đổi tổng thì "Lãi gộp" sai).
- **Tab Báo cáo (`panelReports`, 11/10/2026)**: `loadBaoCao()` tải HẾT đơn từng trang 1.000 (`bcLayDon`) + chi phí + BST, rồi
  `bcVe()` tính ở máy. Kỳ = ô ẩn `bcTu`/`bcDen` (trống = tháng này): chip `BC_KY` (chip sáng khi khoảng trùng), ‹ › `bcBuoc` (trọn
  tháng → lùi đúng số tháng), lịch dùng chung `LOC_NGAY.bc`. So kỳ liền trước / cùng kỳ năm ngoái (`bcSoSanh`); kỳ chưa hết thì kỳ so
  chỉ lấy số ngày đã qua (`bcKhoang`). Lọc thêm nguồn / BST (`bcQuaLoc`) → không tính lãi (chi phí không chia nhóm được).
  Sắc thái: dải nhận xét `bcDanhGia` (tốt/ổn/cần chú ý/lỗ, luôn kèm chữ + biểu tượng) + ô số tô nền theo ngưỡng `BC_NGUONG_TANG/GIAM`.
  Doanh thu cùng luật Tổng quan. Máy tính lưới 3 cột; điện thoại dưới biểu đồ chỉ 1 khối (`.an-dt`, thanh tab `bcTabDt`).
  Bấm số/dòng/cột nào cũng mở danh sách đơn qua `bcMo(khoa)` (dùng chung `statDetailModal`).
- **Tra đơn theo id phải dùng `orderById(id)`**, không dùng `orders.find`. Tab Tổng quan và Lịch giao
  nạp đơn của chúng vào `_donCache` qua `cacheOrders()` và **không được gán vào `orders`** — gán là phá
  trang đang xem của tab Đơn hàng (đã từng như vậy).
- **Lịch sử mua hàng của khách (`viewCustomerOrders`) tự truy vấn theo `customer_id`**, không dùng mảng
  `orders`. Nhờ vậy phân trang không ảnh hưởng nó — giữ nguyên cách này.
- **Số đỏ trên biểu tượng** (menu bên + thanh dưới) đều do `refreshNewOrderBadge()` vẽ: Đơn hàng = đơn chưa giao ("Mới" + "Đã xác nhận", `BADGE_DON_STATUSES`);
  Lịch giao = đơn giao hôm nay + mai chưa xong. Thêm số đếm mới thì dùng `ganSoDem([...], n)`.
- **Tổng quan xếp theo việc cần làm**: đơn mới → Giao hôm nay → Sắp giao (3 ngày, chia theo ngày, `ngayNhan()`) →
  số liệu tháng (gọn) → công cụ. Khung sao lưu giữ id `backupBox/backupLast/backupStatus/backupBtn` + chữ nút
  "Tải file sao lưu" (test-sao-luu kiểm).
- **Khoảnh khắc trong admin theo ALBUM** (mỗi nhóm ảnh = 1 album, `kkAlbum`/`kkMoAlbum`). Album chỉ là lớp vỏ trên
  `galleryFilterCat` cũ: tải ảnh trong album → `#galleryCategory` tự đặt = album đó.
- **Tab Sản phẩm kiểu danh sách gọn (24/09/2026)**: bấm cả hàng = mở form sửa, ngôi sao = `featured` (đổi tại chỗ,
  không tải lại), nút Xoá nằm cuối form (`fXoaMau`), thêm mẫu bằng nút ＋ nổi. Trang chủ web chỉ lấy **4** mẫu nổi bật
  (`.limit(4)` trong `loadFeatured`) — `SP_TRANG_CHU` trong admin phải khớp số đó. Thứ tự đổi bằng chế độ **Sắp xếp**
  (`spDoiCho`/`spLenDau` đánh số lại `order_index` 0,1,2…); ô `fOrder` giờ là input hidden, mẫu mới lấy số nhỏ nhất − 1
  để lên đầu. Nút lọc BST **không** kèm emoji (test-admin-giao-dien kiểm).
- **Tab Khách hàng kiểu danh bạ gọn (24/09/2026)**: mỗi khách 1 hàng (chữ cái đầu tên · tên · SĐT · số đơn), bấm cả hàng =
  thẻ khách (`viewCustomerOrders`, dùng chung modal `customerOrdersModal` với chi tiết đơn): Gọi / Zalo / Sửa, các đơn đã mua
  (bấm = `viewOrderDetail`), Xoá ở cuối. Số đơn / đã mua / lần cuối đếm trong `khTinhSo()` (bỏ đơn "Đã hủy"); chip lọc
  Tất cả · Khách quen (`KH_QUEN` = từ 2 đơn) · Chưa có đơn. Thêm khách bằng nút ＋ nổi (`FAB_THEO_TAB.Customers`).
- **Chọn mẫu hoa khi lên đơn chỉ lấy giá khi là số tiền thuần** (`!_priceIsText`). Giá "Từ 2xx" để trống — cùng
  bẫy "2 đồng" với `place_order`. Form Thêm đơn (`no`) và Sửa đơn (`oe`) dùng CHUNG bộ chọn
  `showProdSuggest(k)` / `pickProduct(id, k)` / `renderPickedProduct(p, k)` — thêm ô ở form này thì thêm cả form kia.
  **Chỉ MỘT ô tên hoa (09/10/2026)** `noProductName`/`oeProductName`: gõ = vừa tìm mẫu vừa là tên trên đơn; không chọn
  mẫu = món lẻ (dòng `.prod-le` cuối gợi ý). Không còn ô tìm `ProdSearch` riêng. Enter/Esc khi gợi ý mở chỉ đóng gợi ý (`prodPhim`).
- **Bảng mã QR mở được từ 2 nơi (09/10/2026)**: chi tiết đơn (`moQrCk(id)`) và form Sửa đơn (`#oeQrNut` → `moQrCk(id, true)`).
  Mở từ form Sửa đơn: số tiền tính theo form ĐANG sửa (`conThuForm`), "Đã nhận tiền" chỉ ĐIỀN vào form (`ghiNhanCkVaoForm`),
  không ghi database — ghi thẳng thì form giữ chip cũ, bấm Lưu đơn sẽ đè mất khoản tiền. Máy tính ≥760px bảng QR 2 cột
  (`.qr-luoi`, grid-area), điện thoại 1 cột. Bảng đơn máy tính: bấm cả hàng = chi tiết (`bamDongDon`, bỏ qua nút/select).
  Sửa đơn: chọn mẫu giá chữ thì GIỮ giá đã chốt; `oeProductPick` giữ `product_id` cũ kể cả khi danh sách mẫu chưa tải.
- **Nút "Ghi chú" trên thẻ Lịch giao + bảng/thẻ Đơn hàng (12/10/2026)**: `nutGhiChu(o, xemTruoc)` — chỉ hiện khi đơn có
  ghi chú TỰ DO (`tachGhiChuDon(o.note).ghiChu`; dòng "Người nhận:"/"Giờ giao:" không tính). Máy tính rê chuột = hiện ô nổi
  `#gcPop` (dùng chung, gắn vào `body`, `position: fixed` — nằm trong bảng thì bị khung cuộn ngang cắt), rời chuột = ẩn;
  bấm/chạm = ghim tới khi bấm ra ngoài / cuộn / Esc / `closeAllModals`. Nút là `<span role="button">` vì thẻ Lịch giao đã là
  `<button>`; `onclick` phải `stopPropagation` để không mở chi tiết đơn. Điện thoại cũng bắn `mouseenter` khi chạm →
  `reGhiChu` chỉ chạy khi `(hover: hover)`. Cột Ghi chú làm bảng thành 11 cột: ≤1400px đệm ô còn 7px và nút chỉ còn biểu
  tượng (test "bảng đơn không rộng hơn khung" ở 1280px); rộng hơn thì xem trước 2 dòng (`.gc-xem`).
  Vị trí shop chốt: thẻ Lịch giao = GÓC PHẢI DƯỚI thẻ kể cả khi thẻ bị kéo cao theo thẻ bên cạnh (`.dv:has(.gc-nut)` giãn
  thân thẻ, `.dv-duoi > .gc-nut` bám đáy); thẻ Đơn hàng điện thoại = ngay TRÊN ngày giao (`.oc-meta` xếp dọc).
