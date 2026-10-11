# Kho dữ liệu: có gì, nằm ở đâu

Dữ liệu nằm ở **Supabase**. Hãy hình dung đó là một bộ file Excel trên mạng: mỗi **bảng** giống 1 trang tính, mỗi **cột** là 1 ô thông tin.
Xem trực tiếp: <https://supabase.com> → dự án → **Table Editor**. Nên sửa dữ liệu trong **admin** thay vì sửa thẳng ở đây,
vì admin có kiểm lỗi còn Table Editor thì không.

## Các bảng

| Bảng | Chứa gì | Ai thấy | Hiện ở đâu |
|---|---|---|---|
| `products` | Mẫu hoa: tên, giá, ảnh, mô tả, thứ tự, có lên trang chủ không (ngôi sao) | Công khai | Web: Trang chủ, Sản phẩm, Chi tiết · Admin: tab Sản phẩm |
| `collections` | **Bộ sưu tập (BST)**: tên, ảnh bìa, câu giới thiệu, bật/tắt, hẹn ngày tự hiện / tự ẩn | Công khai | Web: Trang chủ, bộ lọc Sản phẩm · Admin: tab Bộ sưu tập |
| `collection_products` | Mẫu nào thuộc BST nào (**1 mẫu nằm được trong nhiều BST**) | Công khai | (như trên) |
| `gallery` | Ảnh hoa thật đã giao + chú thích | Công khai | Web: Khoảnh khắc · Admin: tab Khoảnh khắc |
| `gallery_categories` | Nhóm ảnh (= album) của Khoảnh khắc | Công khai | (như trên) |
| `testimonials` | Lời khen của khách | Công khai | Web: Trang chủ · Admin: tab Đánh giá |
| `contact` | **1 dòng cài đặt chung**: SĐT, Zalo, mạng xã hội, ảnh đầu trang chủ, nội dung chính sách, "thông tin chung" dưới mọi mẫu, tài khoản nhận chuyển khoản, mã đo lường | Công khai | Mọi trang web · Admin: tab Liên hệ |
| `orders` | **Đơn hàng**: khách, SĐT, mẫu hoa, số lượng, giá, phí ship, tổng, địa chỉ, ngày giao, ghi chú, lời thiệp, trạng thái, thanh toán / cọc, nguồn khách | **Chỉ shop** | Admin: Tổng quan, Đơn hàng, Lịch giao, Báo cáo |
| `customers` | Sổ khách: tên, SĐT (không trùng), địa chỉ | **Chỉ shop** | Admin: tab Khách hàng |
| `expenses` | Sổ chi phí: ngày, loại, món, số lượng, đơn giá, số tiền, ảnh hoá đơn | **Chỉ shop** | Admin: Sổ chi phí, Báo cáo |
| `materials` | Sổ tay nguyên liệu: tên + giá lần mua gần nhất (gõ vài chữ là gợi ý) | **Chỉ shop** | Admin: Sổ chi phí → Nguyên liệu |
| `changelog` | Nhật ký các lần cập nhật web + góp ý | **Chỉ shop** | Admin: tab Cập nhật |
| `quan_tri` | Danh sách email được quyền vào admin | **Chỉ shop** | Thêm bằng SQL (file 24) |
| `nhat_ky_tai_khoan` | Lịch sử đổi tài khoản nhận tiền (chống bị đổi lén) | **Chỉ shop**, không ai sửa/xoá được | Admin: bảng mã QR cảnh báo nếu vừa đổi |
| `app_settings` | Mã bí mật gửi email (Brevo), email nhận báo | **Không ai** đọc được từ web, kể cả admin | Chỉ sửa trong SQL Editor |

"Công khai" nghĩa là ai cũng **đọc** được (vì web khách cần hiện ra), nhưng **không ai sửa** được nếu không đăng nhập admin.

## Kho ảnh

Supabase → **Storage** → kho `images`:

| Thư mục | Ảnh gì |
|---|---|
| `products/` | Ảnh mẫu hoa |
| `collections/` | Ảnh bìa bộ sưu tập |
| `gallery/` | Ảnh Khoảnh khắc |
| `hero/` | Ảnh to đầu trang chủ |
| `expenses/` | Ảnh hoá đơn chi phí (**không** hiện lên web) |
| `nho/` | Bản thu nhỏ (rộng 640px) của ảnh ở trên, giúp web tải nhanh. Admin tự tạo khi đăng ảnh |

Ảnh được tự nén khi đăng (tối đa 1600px), nên cứ đăng ảnh chụp từ điện thoại bình thường.

## Vòng đời một đơn hàng

```
Mới → Đã xác nhận → Đang giao → Giao thành công → Hoàn thành (khoá, không sửa được nữa)
                                       │
                                       └ từ đây mới tính vào DOANH THU
(bất cứ lúc nào) → Đã hủy  (không tính doanh thu)
```

- **Doanh thu tính theo NGÀY GIAO** (đơn không ghi ngày giao thì tính theo ngày tạo).
- **Thanh toán** theo dõi riêng: *Chưa thanh toán* → *Đã cọc* (ghi số tiền cọc) → *Đã thanh toán*.
- **Người nhận** và **giờ giao** được ghi ở đầu ô ghi chú theo mẫu cố định `Người nhận: Lan · 0912…` / `Giờ giao: 15h30`.
  Admin và email nhắc lịch đọc theo đúng mẫu đó, nên **đừng tự gõ khác đi** (dùng ô chọn trong form).
- Database chỉ nhận đúng 6 trạng thái trên, gõ sai 1 chữ là bị từ chối. Đó là cố ý, để doanh thu không bị tính sai.

## Giá mẫu hoa

Giá lưu dạng **chữ**, không phải số, để ghi được các kiểu `600000`, `Liên hệ`, `Từ 2xx (Theo size order)`.
Khi lên đơn, giá dạng chữ sẽ để trống ô đơn giá cho shop tự điền giá chốt.

## Đơn từ web vào bằng cách nào?

Khách bấm **Đặt hoa** → web gọi hàm `place_order` trong database. Hàm này: tự nhận ra khách cũ theo SĐT (không tạo trùng),
tự điền giá niêm yết, chặn spam, gửi email báo shop, và gửi email xác nhận cho khách nếu khách có để lại email. Đơn web tự ghi nguồn
**"Web"**. Shop tự lên đơn trong admin cũng đi qua đúng hàm này.
