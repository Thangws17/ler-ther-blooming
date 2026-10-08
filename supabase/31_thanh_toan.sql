-- 31 · Trạng thái THANH TOÁN (tách riêng trạng thái đơn) + tài khoản nhận chuyển khoản — 08/10/2026
-- Chạy trong Supabase SQL Editor. Chạy lại bao nhiêu lần cũng được.
-- Cần các file đã chạy trước: 15 (html_esc, notify_shop) và 24 (la_quan_tri). Sau đó nên chạy lại 15 để
-- email xác nhận gửi khách có thông tin chuyển khoản + cảnh báo lừa đảo.
--
-- • orders.thanh_toan : 'Chưa thanh toán' | 'Đã cọc' | 'Đã thanh toán' — phải khớp TT_TRANG_THAI trong admin.
--   Đổi / thêm giá trị: sửa file này TRƯỚC rồi mới sửa admin (ngược lại thì lưu đơn bị từ chối).
-- • orders.tien_coc   : số tiền khách đã cọc (shop tự gõ). "Còn thu khi giao" = total − tien_coc (admin tự tính).
-- • orders.ngay_tt / cach_tt : lần nhận tiền gần nhất — ngày, 'Chuyển khoản' | 'Tiền mặt'.
--   Doanh thu KHÔNG đổi — vẫn tính theo cột total + trạng thái đơn như cũ.
-- • contact.ck_*      : tài khoản nhận chuyển khoản để tạo mã QR (VietQR). Bảng contact ai cũng đọc được —
--   cố ý: web khách cần số tài khoản để hiện mã QR sau khi đặt hoa.
--
-- Khách trên web KHÔNG tự đánh dấu "đã trả" được: chỉ admin đăng nhập mới ghi được bảng orders
-- (luật 17 + 24), còn place_order không nhận tham số thanh toán → đơn mới luôn là "Chưa thanh toán".

alter table orders add column if not exists thanh_toan text;
alter table orders add column if not exists tien_coc   numeric;
alter table orders add column if not exists ngay_tt    date;
alter table orders add column if not exists cach_tt    text;

-- Đơn CŨ (trước khi có cột này): đã giao xong coi như đã thanh toán, còn lại là chưa thanh toán.
-- Chỉ điền ô đang trống → chạy lại không đè lên trạng thái shop đã chỉnh.
update orders
   set thanh_toan = case when status in ('Giao thành công', 'Hoàn thành') then 'Đã thanh toán' else 'Chưa thanh toán' end
 where thanh_toan is null;

alter table orders alter column thanh_toan set default 'Chưa thanh toán';
alter table orders alter column thanh_toan set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_thanh_toan_check') then
    alter table orders add constraint orders_thanh_toan_check
      check (thanh_toan in ('Chưa thanh toán', 'Đã cọc', 'Đã thanh toán'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_tien_coc_khong_am') then
    alter table orders add constraint orders_tien_coc_khong_am check (tien_coc is null or tien_coc >= 0);
  end if;
end $$;

alter table contact add column if not exists ck_ngan_hang text;   -- mã BIN ngân hàng, vd 970436 = Vietcombank
alter table contact add column if not exists ck_so_tk     text;
alter table contact add column if not exists ck_chu_tk    text;   -- HOA không dấu, như trên thẻ

-- ════════════════════════════════════════════════════════════════
-- LỚP BẢO VỆ TÀI KHOẢN NHẬN TIỀN
-- Mối nguy lớn nhất của mục thanh toán: kẻ gian lấy được quyền admin (lộ mật khẩu, mượn máy
-- đang đăng nhập) rồi ĐỔI số tài khoản → tiền khách chuyển vào túi kẻ gian. Các lớp dưới đây
-- nằm TRONG DATABASE nên không thể bỏ qua từ trình duyệt:
--   1. Chỉ nhận đúng định dạng (6 số BIN, 4–20 chữ số, tên HOA không dấu) — chặn chèn mã / link lạ
--   2. Mỗi lần đổi đều ghi NHẬT KÝ (ai, lúc nào, cũ → mới). Nhật ký KHÔNG sửa / xoá được qua web,
--      kể cả bằng tài khoản admin — kẻ gian không xoá được dấu vết
--   3. Gửi MAIL CẢNH BÁO ngay cho shop (địa chỉ reminder_email, như mail nhắc giao — cần file 15)
-- ════════════════════════════════════════════════════════════════
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'contact_ck_dinh_dang') then
    alter table contact add constraint contact_ck_dinh_dang check (
          (ck_ngan_hang is null or ck_ngan_hang ~ '^[0-9]{6}$')
      and (ck_so_tk     is null or ck_so_tk     ~ '^[0-9]{4,20}$')
      and (ck_chu_tk    is null or ck_chu_tk    ~ '^[A-Z0-9 .]{1,60}$'));
  end if;
end $$;

create table if not exists nhat_ky_tai_khoan (
  id      bigint generated always as identity primary key,
  luc     timestamptz not null default now(),
  ai      text,              -- email tài khoản admin đã đổi (trống = đổi trong SQL Editor)
  cu      text,              -- "970436 · 0123456789 · NGUYEN VAN A"
  moi     text
);
alter table nhat_ky_tai_khoan enable row level security;
-- Đọc: chỉ quản trị (luật thường + luật RESTRICTIVE "chi quan tri" như file 24).
-- KHÔNG có luật insert/update/delete → không ai ghi/sửa/xoá được qua web; chỉ hàm bên dưới ghi.
drop policy if exists "Admin doc nhat ky" on nhat_ky_tai_khoan;
create policy "Admin doc nhat ky" on nhat_ky_tai_khoan for select to authenticated using (true);
drop policy if exists "chi quan tri" on nhat_ky_tai_khoan;
create policy "chi quan tri" on nhat_ky_tai_khoan as restrictive for all to authenticated
  using (la_quan_tri()) with check (la_quan_tri());

create or replace function canh_bao_doi_tai_khoan() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_cu  text := case when old.ck_so_tk is null then '(chưa có)'
                 else coalesce(old.ck_ngan_hang, '—') || ' · ' || old.ck_so_tk || ' · ' || coalesce(old.ck_chu_tk, '—') end;
  v_moi text := case when new.ck_so_tk is null then '(đã xoá)'
                 else coalesce(new.ck_ngan_hang, '—') || ' · ' || new.ck_so_tk || ' · ' || coalesce(new.ck_chu_tk, '—') end;
  v_ai  text := coalesce(auth.jwt() ->> 'email', 'SQL Editor / hệ thống');
  v_luc text := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY');
begin
  insert into nhat_ky_tai_khoan (ai, cu, moi) values (v_ai, v_cu, v_moi);
  begin   -- gửi mail lỗi (chưa cấu hình Brevo…) KHÔNG được chặn việc lưu
    perform notify_shop(
      'Tài khoản nhận tiền vừa đổi',
      '⚠️ Tài khoản nhận tiền trên web vừa bị ĐỔI — ' || v_luc,
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;color:#1A2E1A;">'
      || '<h2 style="color:#BF360C;">⚠️ Tài khoản nhận chuyển khoản vừa được đổi</h2>'
      || '<p>Lúc <b>' || v_luc || '</b>, bởi <b>' || html_esc(v_ai) || '</b></p>'
      || '<p>Cũ: <b>' || html_esc(v_cu) || '</b><br>Mới: <b style="color:#BF360C;">' || html_esc(v_moi) || '</b></p>'
      || '<p style="background:#FBE9E7;padding:10px 12px;border-radius:8px;">Nếu <b>KHÔNG phải bạn hoặc Ler</b> đổi: đăng nhập trang quản lý, '
      || 'nhập lại tài khoản đúng ngay, rồi đổi mật khẩu đăng nhập. Khách quét mã QR trên web lúc này sẽ chuyển vào tài khoản MỚI ở trên.</p>'
      || '</div>');
  exception when others then null;
  end;
  return new;
end $$;
revoke execute on function canh_bao_doi_tai_khoan() from public, anon, authenticated;

drop trigger if exists canh_bao_doi_tai_khoan on contact;
create trigger canh_bao_doi_tai_khoan
  after update of ck_ngan_hang, ck_so_tk, ck_chu_tk on contact
  for each row
  when (old.ck_ngan_hang is distinct from new.ck_ngan_hang
     or old.ck_so_tk     is distinct from new.ck_so_tk
     or old.ck_chu_tk    is distinct from new.ck_chu_tk)
  execute function canh_bao_doi_tai_khoan();

-- Kiểm tra: đơn theo từng trạng thái thanh toán
select thanh_toan, count(*) as so_don from orders group by 1 order by 1;
