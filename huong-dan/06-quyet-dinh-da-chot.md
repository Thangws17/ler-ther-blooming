# Những điều shop đã quyết

Mỗi dòng là một lựa chọn **shop đã cân nhắc và chốt**, kèm lý do. Đọc trước khi định đề xuất đổi hướng, để khỏi hỏi lại
điều đã trả lời. Muốn đổi thì cứ hỏi shop, nhưng nên biết vì sao lần trước họ chọn như vậy.

## Hạ tầng và chi phí

| Quyết định | Ngày | Lý do |
|---|---|---|
| Đặt web trên **GitHub Pages**, chỉ mua tên miền (`lertherblooming.vn`, PA Việt Nam), **không thuê hosting** | 29/09/2026 | Miễn phí, đủ dùng. Đã thử Netlify (hết hạn mức miễn phí) |
| **Không dùng Cloudflare** (Pages lẫn proxy "đám mây cam") | 29/09/2026 | Shop từng dùng: ở nhà mạng Việt Nam lúc vào được lúc không |
| Supabase **gói miễn phí** → ảnh nhỏ do admin tự làm khi đăng ảnh (không dùng tính năng thu nhỏ ảnh của gói Pro) | 25/09 + 01/10/2026 | Tiết kiệm. Nếu sau này cần chi tiền, ưu tiên nâng Supabase Pro trước |
| **Không thêm thư viện / framework / bước build**: HTML + CSS + JS thuần | từ đầu | Dễ bảo trì cho 2 người, không bị "thư viện hết hạn" |
| Email qua **Brevo**, bỏ Telegram / Resend | 25–26/09/2026 | Một kênh cho cả mail khách lẫn mail shop |

## Cách quản lý

| Quyết định | Ngày | Lý do |
|---|---|---|
| **Admin là nơi lên đơn chính** (khách chốt qua Facebook/Zalo rồi shop nhập). Cải tiến nhập đơn làm ở admin trước | 30/08/2026 | Đơn web chỉ là nguồn nhỏ |
| Sửa web khách thì **sửa admin cùng lúc** (và ngược lại) | 30/08/2026 | Đã 2 lần lệch nhau sinh lỗi |
| **Không quản lý tồn kho / giá vốn**, chỉ ghi Sổ chi phí theo dòng tiền | trước 09/2026 | Quá phức tạp cho 2 người bán thời gian |
| Doanh thu tính theo **ngày giao**, mốc ghi nhận là "Giao thành công" | trước 09/2026 | Khớp với lúc thật sự nhận tiền |
| **Cọc không bắt buộc, không có chip gợi ý 30% / 50%**, shop tự gõ số tiền. Không có nút "đã hoàn cọc" | 08/10/2026 | Mỗi đơn mỗi khác. Đơn huỷ thì trả tiền lại, đã không tính doanh thu |
| Trạng thái **thanh toán tách riêng** trạng thái đơn (Chưa / Đã cọc / Đã thanh toán), mã QR qua VietQR, shop tự bấm "Đã nhận tiền" | 08/10/2026 | Tự nhận biết tiền về (SePay/Casso) để sau, khi thật cần |
| Báo cáo là **tab riêng**, ít chữ, giải thích để sau nút (i) | 11/10/2026 | "Nhìn phát là rõ vấn đề" |
| **Bỏ tab Tổng quan**: admin mở vào Đơn hàng, việc gấp (trễ hẹn, đơn mới, chưa sao lưu) thành dải nhắc ở đầu Đơn hàng; Công cụ dời xuống cuối Báo cáo | 06/11/2026 | Trang cũ chỉ chép lại Lịch giao + Báo cáo, "vào không biết để làm gì". Đã thử 3 hướng (Việc cần làm / Nhịp tuần / Bỏ), chọn Bỏ |
| Admin **"Nội dung nổi"**: menu bên trên nền kem đậm, phần làm việc là 1 tấm sáng bo góc | 06/11/2026 | Menu cùng màu nội dung thì không biết đâu là menu. Đã thử Menu trắng / xanh rêu / nội dung nổi |
| **Nguồn khách** chọn bằng chip (Facebook / Instagram / Zalo / Web / Giới thiệu / Khác) | 11/10/2026 | |
| Hoãn: nhập đơn bằng giọng nói | 28/06/2026 | Để sau. Nếu làm thì làm kiểu "mic cho từng ô", miễn phí |
| Hoãn: tối ưu cho >1.000 đơn ở Lịch giao | 07/10/2026 | Làm khi shop có khoảng 600 đơn (tab Báo cáo đã tự xử lý) |
| Không làm nút "AI tự viết mô tả mẫu" trong admin | 24/09/2026 | Cần khoá AI trả phí, mà khoá đặt trong trình duyệt là lộ. Nhờ Claude viết theo đợt |

## Giao diện

| Quyết định | Ngày |
|---|---|
| Phong cách **tối giản**; biểu tượng nét mảnh, **không dùng emoji trong nút / menu** (emoji shop đặt cho BST/album là nội dung, vẫn giữ) | 23/09/2026 |
| Biểu tượng đổi sang **Hai tông** (Phosphor duotone) cho cả web lẫn admin; dấu thao tác (＋ − ✕ ✓, mũi tên, ☰) giữ nét trơn vì lớp nền vuông trên nút xanh "trông kì". Đã so: nét mảnh cũ / Tròn mềm / Đặc / Hai tông | 07/11/2026 |
| Web khách **màu "Vườn kem" như admin** (nền kem, thẻ trắng nổi, tiêu đề xanh rêu). Bố cục **phương án A "Làm gọn"**: giữ bố cục cũ, chỉ bỏ trùng; đã xem B "Mở là thấy hoa" (danh sách mẫu ngay trang chủ, lọc giá) nhưng chưa cần đổi | 07/11/2026 |
| Bỏ mục **"Tại sao chọn chúng tôi"** ở trang chủ (lặp 3 cam kết dưới ảnh đầu trang) | 07/11/2026 |
| **Logo chữ 2 tầng** như admin, bỏ bông hoa 🌸 ở thanh menu + chân trang (favicon vẫn hoa). Có logo thật thì tính tiếp | 07/11/2026 |
| **Thanh tab dưới kiểu app Facebook**: viên bo tròn nổi giữa đáy, chỉ biểu tượng, mục đang xem có nền nhạt — cả web khách lẫn admin. Admin 5 mục: Đơn hàng · Lịch giao · Sản phẩm · Chi phí · Menu. ☰ web điện thoại chỉ còn Câu chuyện + Chính sách | 07/11/2026 |
| Chuyển động theo skill Emil: hiện dần nhanh + ngắn, nút lún 97% mọi máy, form đặt hoa điện thoại trượt cả tấm từ đáy. "Wao" lấy 3: ảnh hiện từ nhoè sang nét, trang chủ chào khách lần đầu, cánh hoa rơi khi đặt xong — **bỏ ảnh bay sang trang chi tiết** | 07/11/2026 |
| Ảnh trang chi tiết **vuốt tay được, không tự chuyển** (trước tự nhảy 5 giây). Shop bảo "sửa luôn" nhưng chưa chọn giữa "bỏ hẳn" và "dừng khi chạm" → tạm bỏ hẳn | 07/11/2026 |
| Không dùng ô chọn ngày/tháng mặc định của trình duyệt, không dùng hộp `alert` / `prompt`, mà dùng lịch tự vẽ, bảng trượt từ dưới lên | từ 09/2026 |
| Web **thuần Việt**: trang ảnh tên "Khoảnh khắc" (không "Gallery"), không viết "danh mục" | 23/09/2026 |
| Font phương án **B "dịu mắt"**: Nunito (tiêu đề) + Be Vietnam Pro (nội dung); admin dùng Be Vietnam Pro | 24/09/2026 |
| Trang chủ: **1 ảnh to** đầu trang; web khách có **thanh tab dưới đáy** trên điện thoại | 23/09/2026 |
| Bộ sưu tập trang chủ: **1 hàng ngang tự trôi chậm** (20px/giây), rê chuột chỉ chậm lại chứ **không dừng**; mép mờ 2 bên giữ 30px (đã thử 12px, shop bỏ) | 05–08/10/2026 |
| Giờ giao chọn bằng **bánh xe cuộn giờ \| phút** (kiểu A), 8h–21h, phút bước 5. Theo giờ, **không theo buổi** | 23–26/09/2026 |
| Khoảnh khắc trong admin theo **album** (phương án B) | 23/09/2026 |
| Tab Sản phẩm admin: **danh sách gọn** (phương án A). Form sửa mẫu **kiểu C** (xếp giống trang chi tiết web) | 24/09 + 02/10/2026 |
| Tab Khách hàng: **danh bạ gọn** (phương án A) | 24/09/2026 |
| Lọc ngày: bấm 1 ngày = xem ngày đó, bấm thêm ngày nữa = cả khoảng, **không** có nút chọn kiểu | 07/10/2026 |
| "Phù hợp tặng…" + dòng riêng từng mẫu: giữ trên web, chưa có ô sửa (cách "a") | 02/10/2026 |

## Nội dung

| Quyết định | Ngày |
|---|---|
| Mô tả mẫu hoa theo **khuôn "tạp chí"**: “Biệt danh” / thành phần cách bằng · / 3 chữ khoá — / "Phù hợp tặng …" | 24/09/2026 |
| Dùng **tên gọi hoa của shop**: cẩm chướng = **"phăng"** (phăng đơn / phăng chùm), cỏ lăn tăn / "tua tua" = **"cỏ suối"**, bông trắng nhuỵ vàng = **"hoa khô"** | 07–09/10/2026 |
| Trang **Câu chuyện** (cắm chéo gốc): **lời văn do shop tự viết**, giọng kể chuyện mềm ("hai đứa"). Chỉ được chỉnh bố cục, không sửa chữ | 07/10/2026 |
| "Thông tin chung" dưới mọi mẫu (giao miễn phí, COD, ảnh duyệt, theo size, tặng túi + thiệp) sửa ở admin, không ghi cứng | 02/10/2026 |

## Cách làm việc với Claude

- Claude **chỉ đẩy lên mạng khi được bảo rõ** ("push đi"). Chọn phương án hay nói "làm đi" chưa phải lệnh push. *(24/09/2026)*
- Làm xong: chạy kiểm tra → **mở sẵn trình duyệt** đúng màn hình cho shop xem (không chỉ dán link) → chờ duyệt.
- Cần shop thử lại / mô tả lỗi → mở sẵn đúng màn đó **trước** rồi mới hỏi. *(09/10/2026)*
- **Chỉ sửa đúng phần được nhờ**; muốn đổi thêm chỗ khác thì hỏi trước. Bản xem thử dựng trên admin thật, phần khác giữ y nguyên. *(07/10/2026)*
- Shop gõ tiếng Việt bằng **Unikey/EVKey**: ô nhập nào tự xử lý phím phải thử với bộ gõ (đã từng mất dữ liệu vì phím xoá). *(03/10/2026)*
- Shop báo "đã chạy SQL" là tin luôn, không hỏi lại. Mỗi lần đưa lên mạng thì soạn sẵn câu nhật ký cập nhật cho shop dán.
