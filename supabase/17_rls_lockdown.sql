-- ════════════════════════════════════════════════════════════════
-- Siết RLS các bảng gốc: PUBLIC chỉ ĐỌC, chỉ ADMIN (đã đăng nhập) GHI.
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
--
-- Vì sao cần: các bảng này có từ sớm, không chắc policy cũ có "hở" cho
-- ghi công khai không. Block dưới đây XÓA SẠCH policy cũ (bất kể tên) rồi
-- tạo lại đúng chuẩn → về trạng thái an toàn dù trước đó thế nào.
--
-- KHÔNG đụng tới: customers, orders, expenses, app_settings,
-- gallery_categories (đã có policy riêng, khóa đúng ở file khác).
-- ════════════════════════════════════════════════════════════════

do $$
declare
  t text;
  pol record;
  tables text[] := array['products', 'gallery', 'contact', 'testimonials'];
begin
  foreach t in array tables loop
    -- Bỏ qua bảng chưa tồn tại (an toàn)
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- Xóa mọi policy hiện có trên bảng
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    -- Public chỉ được đọc
    execute format(
      'create policy %I on public.%I for select using (true)',
      'public read ' || t, t
    );
    -- Chỉ authenticated (admin) được thêm/sửa/xóa
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      'admin write ' || t, t
    );
  end loop;
end $$;

-- Kiểm tra lại sau khi chạy (tùy chọn):
-- select tablename, policyname, cmd, roles
-- from pg_policies
-- where tablename in ('products','gallery','contact','testimonials')
-- order by tablename, cmd;
