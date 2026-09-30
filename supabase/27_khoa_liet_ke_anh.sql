-- ════════════════════════════════════════════════════════════════
-- KHOÁ "XEM DANH SÁCH FILE" TRONG KHO ẢNH — chỉ quản trị mới liệt kê được.
-- Chạy trong Supabase SQL Editor. Chạy lại nhiều lần không lỗi.
-- CẦN CHẠY FILE 24 TRƯỚC (hàm la_quan_tri + bảng quan_tri).
--
-- VÌ SAO CẦN (kiểm tra bảo mật 01/10/2026):
--   Kho ảnh "images" để công khai (web khách phải xem được ảnh hoa). Nhưng ngoài
--   việc XEM ảnh khi biết link, người lạ còn gọi được lệnh LIỆT KÊ toàn bộ file
--   trong kho — kể cả thư mục expenses/ (ảnh hoá đơn chi phí, không lên web) —
--   rồi tải về hết. File này chặn lệnh liệt kê với mọi người trừ quản trị.
--
--   Ảnh trên web KHÔNG bị ảnh hưởng: link ảnh công khai (/object/public/…) của kho
--   công khai không đi qua luật này. Admin vẫn tải lên / xoá ảnh như cũ.
--
-- Tên luật bắt đầu bằng "chi quan tri" như file 24 → file 17 / 21 chạy lại không xoá mất.
-- ════════════════════════════════════════════════════════════════

do $$
begin
  drop policy if exists "chi quan tri select" on storage.objects;
  -- RESTRICTIVE: dù có luật cũ nào cho phép đọc, vẫn phải qua thêm luật này.
  -- Chỉ khoá kho "images"; kho khác (nếu sau này tạo) không bị đụng tới.
  create policy "chi quan tri select" on storage.objects
    as restrictive for select to anon, authenticated
    using (bucket_id <> 'images' or la_quan_tri());
exception when insufficient_privilege then
  raise notice 'Không có quyền sửa luật kho ảnh — báo lại shop dev nhé.';
end $$;

-- KẾT QUẢ: các luật đang có trên kho ảnh (phải thấy dòng "chi quan tri select")
select policyname as ten_luat, cmd as lenh, permissive as loai, roles as ai
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
