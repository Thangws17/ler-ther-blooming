-- ════════════════════════════════════════════════════════════════
--  19. Khoá TRẠNG THÁI ĐƠN: database chỉ nhận đúng 6 giá trị
--  Chạy được nhiều lần, chạy lại không hỏng gì (idempotent).
-- ════════════════════════════════════════════════════════════════
--
--  VÌ SAO: cột orders.status là chữ và trước giờ nhận BẤT KỲ chữ nào.
--  Lỡ ghi "Hoàn Thành" (chữ T hoa) hay "Đã huỷ" (dấu đặt khác chỗ) thì
--  vẫn lưu được, nhưng đơn đó KHÔNG được tính doanh thu, không hiện đúng
--  bộ lọc — mà chẳng có báo lỗi nào. Khoá lại thì ghi sai là bị từ chối ngay.
--
--  ⚠️ Danh sách 6 giá trị dưới đây PHẢI khớp y hệt ORDER_STATUSES trong
--  admin/index.html. Thêm/đổi tên trạng thái thì sửa CẢ HAI chỗ, và
--  sửa trong file SQL này TRƯỚC (không thì admin ghi giá trị mới sẽ lỗi).

-- ── 1. Xem trước: hiện đang có những trạng thái nào ──
select status, count(*) as so_don
  from orders
 group by status
 order by so_don desc;

-- ── 2. Sửa những chỗ lệch nhẹ về đúng chữ chuẩn ──
--  Bắt: thừa khoảng trắng, sai hoa/thường, "huỷ" ↔ "hủy" (2 kiểu đặt dấu),
--  và chữ tiếng Việt lưu dạng tách dấu (normalize NFC).
update orders o
   set status = v.chuan
  from (values
         ('mới',             'Mới'),
         ('đã xác nhận',     'Đã xác nhận'),
         ('đang giao',       'Đang giao'),
         ('giao thành công', 'Giao thành công'),
         ('hoàn thành',      'Hoàn thành'),
         ('đã hủy',          'Đã hủy'),
         ('đã huỷ',          'Đã hủy')
       ) as v(thuong, chuan)
 where lower(btrim(normalize(o.status, NFC))) = v.thuong
   and o.status <> v.chuan;

-- ── 3. Gắn khoá ──
--  "not valid" = khoá có hiệu lực NGAY cho mọi lần ghi mới, kể cả khi dữ liệu
--  cũ còn sót giá trị lạ (bước 4 sẽ báo). Không có "not valid" thì chỉ cần
--  một đơn cũ sai là cả câu lệnh thất bại, không khoá được gì.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_status_hop_le') then
    alter table orders
      add constraint orders_status_hop_le
      check (status in ('Mới', 'Đã xác nhận', 'Đang giao', 'Giao thành công', 'Hoàn thành', 'Đã hủy'))
      not valid;
  end if;
end $$;

-- ── 4. Kiểm cả dữ liệu cũ ──
--  Nếu còn đơn mang trạng thái lạ thì KHÔNG lỗi, chỉ hiện thông báo —
--  xem danh sách ở câu cuối rồi sửa tay trong admin.
do $$
begin
  alter table orders validate constraint orders_status_hop_le;
  raise notice 'OK: mọi đơn đều mang trạng thái hợp lệ, khoá đã kiểm xong cả dữ liệu cũ.';
exception when check_violation then
  raise notice 'CÒN đơn có trạng thái lạ — xem danh sách ở câu truy vấn cuối file. Đơn MỚI vẫn đã được khoá.';
end $$;

-- ── 5. Đơn còn trạng thái lạ (rỗng = tốt) ──
select id, status, created_at
  from orders
 where status not in ('Mới', 'Đã xác nhận', 'Đang giao', 'Giao thành công', 'Hoàn thành', 'Đã hủy')
 order by created_at desc;
