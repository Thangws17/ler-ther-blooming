# Áp dụng bản vá tạo đơn 35

> **Đã áp dụng:** shop chạy file 35 trên database thật ngày 16/11/2026.

Bản vá giữ cách dùng hiện tại: SĐT lấy từ sổ khách, sửa một lần thì đơn cũ cập nhật theo.
Không thêm bước nhập liệu hay yêu cầu shop sửa từng đơn.

## Thay đổi

- `place_order` kiểm `la_quan_tri()` để xác định đặc quyền. Tài khoản đăng nhập ngoài danh sách shop bị từ chối.
- Mọi lượt gọi hàm cùng lấy khoá giao dịch `72638135` trước khi đếm đơn. Ở READ COMMITTED, lượt đang chờ sẽ đếm
  cả đơn mà lượt trước vừa commit. Shop vẫn được miễn quota; khoá áp dụng cả shop để các lần tạo khách không chen nhau.
- Thêm khách bằng `on conflict (phone)` để không lỗi trùng số nếu máy khác vừa thêm cùng lúc. Giữ tên/địa chỉ cũ,
  chỉ bổ sung địa chỉ trống, giống quy tắc trước.
- Admin kiểm dòng được ghi khi lưu khách, sửa liên hệ hay xoá khách. Lưu liên hệ thất bại không thay bộ nhớ QR,
  không xoá dấu chưa lưu. Không đổi danh sách trạng thái hay cách ghi nhận thanh toán.

## Kiểm trước khi đưa lên

1. Chạy bộ kiểm thử giao diện, gồm `test-do-tin-cay` mới. Trang này chỉ kiểm mã nguồn phần SQL.
2. Trên **database thử nghiệm** đã có cấu trúc hiện tại, chạy `supabase/35_gia_co_tao_don.sql`.
3. Chạy cả `test/kiem-tra-tao-don.sql` bằng SQL Editor. File cô lập quota bằng cách xoá đơn trong giao dịch,
   kiểm quyền khách / người ngoài / shop, giới hạn 3 và 20 đơn, rồi rollback. Không chạy file test trên database thật.
4. Kiểm đồng thời trên database thử nghiệm, bằng hai kết nối riêng, mức cô lập READ COMMITTED:
   - Chuẩn bị 19 đơn có `created_at` trong 10 phút gần đây, không có thao tác tạo đơn khác.
   - Kết nối A chạy khối dưới. Trong 10 giây chờ, kết nối B chạy cùng khối nhưng bỏ dòng `pg_sleep(10)`.
   - A tạo đơn thứ 20. B phải chờ A commit rồi nhận lỗi `QUA_NHIEU_DON`, tổng vẫn là 20.
   - Lặp lại với 2 đơn gần đây của cùng một SĐT; thay tham số đầu bằng SĐT đó ở cả A/B. Tổng của số đó phải là 3.
   - Chỉ dùng cấu hình mail thử nghiệm vì bài kiểm đồng thời có commit.

```sql
begin;
set local transaction isolation level read committed;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select public.place_order(null, 'Khách thử đồng thời', null, null,
  'Mẫu thử', 1, null, null, null, null);
select pg_sleep(10);
commit;
```

Kiểm quyền bằng claims trong SQL Editor xác minh logic của hàm. Khi có môi trường thử nghiệm nối web,
cần kiểm thêm đăng nhập thật và gọi RPC qua API để xác minh cả cấu hình Auth/RLS.

## Đưa lên shop

Sau khi thử đạt, sao lưu dữ liệu và giữ bản định nghĩa hàm hiện tại trước khi thay:

```sql
select pg_get_functiondef(
  'public.place_order(text,text,text,bigint,text,integer,date,text,text,text,text)'::regprocedure
);
```

Chạy **file 35** trên Supabase SQL Editor; không cần chạy lại toàn bộ file 15 hay các file cũ.
File có giao dịch, lỗi thì rollback, chạy lại được. Sau đó mới đưa thay đổi admin lên web theo quy trình repo.
Kiểm một đơn do shop nhập và cách sửa SĐT như cũ. Cập nhật trạng thái file 35 trong `supabase/README.md` khi đã áp dụng.

Chưa có kiểm chứng database thật chỉ từ việc bộ kiểm thử giao diện đạt; cần ghi kết quả test SQL riêng.
