-- ════════════════════════════════════════════════════════════════
-- CHỈ TÀI KHOẢN CỦA SHOP mới được xem đơn / sổ khách và sửa dữ liệu.
-- Chạy trong Supabase SQL Editor. Chạy lại nhiều lần không lỗi.
--
-- VÌ SAO CẦN (kiểm tra bảo mật 25/09/2026):
--   Trước giờ luật khoá chỉ hỏi "đã đăng nhập chưa?" (authenticated).
--   Nhưng Supabase đang MỞ ĐĂNG KÝ: người lạ tự tạo tài khoản bằng email
--   của họ → cũng là "đã đăng nhập" → đọc được SĐT/địa chỉ khách, sửa giá,
--   xoá đơn. File này thêm một lớp khoá: phải nằm trong DANH SÁCH QUẢN TRỊ
--   (bảng quan_tri) mới qua được — tài khoản lạ có đăng nhập cũng vô dụng.
--
--   Vẫn nên TẮT ĐĂNG KÝ trong Supabase (Authentication → Sign In / Providers
--   → tắt "Allow new users to sign up"). Hai lớp khoá độc lập nhau.
--
-- LẦN ĐẦU CHẠY: mọi tài khoản đã xác nhận email ĐANG CÓ được đưa vào danh
-- sách quản trị (tức tài khoản của shop). Kết quả cuối file liệt kê tất cả
-- tài khoản — thấy email nào LẠ thì báo lại để gỡ.
--
-- Thêm quản trị sau này (tạo tài khoản trong Authentication → Users trước):
--   insert into quan_tri (user_id, email)
--   select id, email from auth.users where email = 'email_moi@gmail.com'
--   on conflict do nothing;
-- Gỡ: delete from quan_tri where email = 'email_la@...';
--
-- File 17 và 21 xoá sạch luật cũ trên bảng của chúng rồi tạo lại — đã được
-- sửa để CHỪA luật "chi quan tri" ra. Chạy lại 17/21 cũng không mất lớp này.
-- ════════════════════════════════════════════════════════════════

-- 1) Danh sách quản trị — khoá kín: không luật nào → không ai đọc/sửa qua web
create table if not exists quan_tri (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz default now()
);
alter table quan_tri enable row level security;

-- Chỉ điền tự động ở LẦN ĐẦU (bảng còn trống). Chạy lại về sau KHÔNG tự thêm
-- ai — kẻ lạ lỡ đăng ký sau đó cũng không lọt vào danh sách.
do $$
begin
  if not exists (select 1 from quan_tri) then
    insert into quan_tri (user_id, email)
    select id, email from auth.users where email_confirmed_at is not null
    on conflict do nothing;
  end if;
end $$;

-- 2) Hàm hỏi "người đang đăng nhập có phải quản trị không?"
create or replace function la_quan_tri() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from quan_tri where user_id = auth.uid())
$$;
grant execute on function la_quan_tri() to anon, authenticated;

-- 3) Lớp khoá thêm (RESTRICTIVE = phải qua CẢ luật cũ LẪN luật này)
do $$
declare
  t text;
  lenh text;
begin
  -- Bảng riêng của shop: tài khoản không phải quản trị không đọc, không ghi
  foreach t in array array['customers', 'orders', 'expenses', 'materials', 'changelog'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists %I on public.%I', 'chi quan tri', t);
    execute format('create policy %I on public.%I as restrictive for all to authenticated '
                   'using (la_quan_tri()) with check (la_quan_tri())', 'chi quan tri', t);
  end loop;

  -- Bảng công khai (web khách đọc): ai cũng đọc được, chỉ quản trị được ghi
  foreach t in array array['products', 'gallery', 'contact', 'testimonials',
                           'gallery_categories', 'collections', 'collection_products'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    foreach lenh in array array['insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', 'chi quan tri ' || lenh, t);
      execute format('create policy %I on public.%I as restrictive for %s to authenticated %s',
        'chi quan tri ' || lenh, t, lenh,
        case lenh
          when 'insert' then 'with check (la_quan_tri())'
          when 'update' then 'using (la_quan_tri()) with check (la_quan_tri())'
          else 'using (la_quan_tri())'
        end);
    end loop;
  end loop;
end $$;

-- 4) Kho ảnh (Storage): chỉ quản trị được tải lên / thay / xoá ảnh.
--    Ảnh vẫn xem công khai như cũ (link public không đi qua luật này).
do $$
declare
  lenh text;
begin
  foreach lenh in array array['insert', 'update', 'delete'] loop
    execute format('drop policy if exists %I on storage.objects', 'chi quan tri ' || lenh);
    execute format('create policy %I on storage.objects as restrictive for %s to authenticated %s',
      'chi quan tri ' || lenh, lenh,
      case lenh
        when 'insert' then 'with check (la_quan_tri())'
        when 'update' then 'using (la_quan_tri()) with check (la_quan_tri())'
        else 'using (la_quan_tri())'
      end);
  end loop;
exception when insufficient_privilege then
  raise notice 'Không có quyền sửa luật kho ảnh — bỏ qua phần Storage (phần bảng vẫn đã khoá xong).';
end $$;

-- 5) KẾT QUẢ: mọi tài khoản đăng nhập được, ai là quản trị.
--    Cột la_quan_tri = false mà email lạ → có người lạ đã đăng ký, báo lại shop dev.
select u.email,
       u.created_at::date      as ngay_tao,
       u.last_sign_in_at::date as lan_cuoi_dang_nhap,
       (q.user_id is not null) as la_quan_tri
from auth.users u
left join quan_tri q on q.user_id = u.id
order by u.created_at;
