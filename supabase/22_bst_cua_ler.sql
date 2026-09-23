-- ════════════════════════════════════════════════════════════════
-- 4 BỘ SƯU TẬP THẬT (tên do Ler đặt) — thay cho 5 danh mục cũ đã chuyển sang ở file 21.
-- Chạy trong Supabase SQL editor, SAU file 21. Chạy lại nhiều lần không lỗi.
--
-- Việc file này làm (CHỈ làm ở lần chạy đầu tiên, nhận biết qua "BST Trông Trăng" chưa có):
--   1. Tạo 4 BST: 🌕 Trông Trăng · 💝 20/10 · ✨ Em Xinh · 🎤 Anh Trai
--   2. Gán mẫu hoa theo bản demo (gán tạm theo tone màu) — anh/Ler chỉnh lại trong
--      admin → tab 🌿 Bộ sưu tập
--   3. TẮT (không xoá) 5 BST cũ: Hoa bó, Sự kiện, Hoa tốt nghiệp, Đèn lồng nở hoa, Khác.
--      Mẫu hoa bên trong vẫn nằm ở nút "🌸 Tất cả", không mất mẫu nào.
--   4. Hẹn ngày: Trông Trăng tự ẩn sau 26/09 (Trung thu 25/09/2026);
--      20/10 tự hiện 01/10 → tự ẩn sau 21/10. Đổi được trong admin.
--
-- Chạy lại lần 2 trở đi: không làm gì cả → không đạp lên chỉnh sửa của anh trong admin
-- (bật lại BST cũ, gỡ/thêm mẫu, đổi ngày… đều được giữ nguyên).
-- ════════════════════════════════════════════════════════════════

do $$
begin
  if exists (select 1 from collections where lower(btrim(name)) = lower('BST Trông Trăng')) then
    raise notice 'Đã có 4 BST của Ler rồi — bỏ qua, không đổi gì.';
    return;
  end if;

  -- ── 1. Tắt 5 BST cũ (chuyển từ danh mục) ──
  update collections set active = false
  where lower(btrim(name)) in (lower('Hoa bó'), lower('Sự kiện'), lower('Hoa tốt nghiệp'),
                               lower('Đèn lồng nở hoa'), lower('Khác'));

  -- ── 2. Tạo 4 BST mới, xếp trước các BST cũ ──
  insert into collections (name, slug, emoji, tagline, order_index, active, start_date, end_date)
  values
    ('BST Trông Trăng', slug_vi('BST Trông Trăng'), '🌕', 'Trung thu này, để hoa thay đèn lồng',       -4, true, null,         '2026-09-26'),
    ('BST 20/10',       slug_vi('BST 20/10'),       '💝', 'Gửi người phụ nữ của bạn một lời cảm ơn',   -3, true, '2026-10-01', '2026-10-21'),
    ('BST Em Xinh',     slug_vi('BST Em Xinh'),     '✨', 'Pastel ngọt ngào, dành cho nàng',           -2, true, null,         null),
    ('BST Anh Trai',    slug_vi('BST Anh Trai'),    '🎤', 'Tone trầm, dứt khoát, tặng chàng',          -1, true, null,         null);

  -- ── 3. Gán mẫu hoa (bỏ qua mã mẫu nào đã bị xoá) ──
  insert into collection_products (collection_id, product_id, order_index)
  select c.id, p.id, v.thu_tu
  from (values
    ('BST Trông Trăng', 1, 0), ('BST Trông Trăng', 10, 1), ('BST Trông Trăng', 8, 2),
    ('BST Trông Trăng', 28, 3), ('BST Trông Trăng', 5, 4), ('BST Trông Trăng', 23, 5),
    ('BST 20/10', 9, 0), ('BST 20/10', 15, 1), ('BST 20/10', 30, 2),
    ('BST 20/10', 4, 3), ('BST 20/10', 25, 4), ('BST 20/10', 12, 5),
    ('BST Em Xinh', 25, 0), ('BST Em Xinh', 6, 1), ('BST Em Xinh', 32, 2),
    ('BST Em Xinh', 26, 3), ('BST Em Xinh', 16, 4), ('BST Em Xinh', 2, 5),
    ('BST Anh Trai', 4, 0), ('BST Anh Trai', 17, 1), ('BST Anh Trai', 21, 2),
    ('BST Anh Trai', 31, 3), ('BST Anh Trai', 11, 4)
  ) as v(ten, ma_mau, thu_tu)
  join collections c on c.name = v.ten
  join products p on p.id = v.ma_mau
  on conflict (collection_id, product_id) do nothing;

  -- ── 4. Ảnh bìa tạm = ảnh mẫu đầu tiên (đổi lại được trong admin) ──
  update collections c set cover_url = (
    select p.image
    from collection_products cp
    join products p on p.id = cp.product_id
    where cp.collection_id = c.id and btrim(coalesce(p.image, '')) <> ''
    order by cp.order_index, p.id
    limit 1
  )
  where c.name in ('BST Trông Trăng', 'BST 20/10', 'BST Em Xinh', 'BST Anh Trai')
    and btrim(coalesce(c.cover_url, '')) = '';

  raise notice 'Xong: đã tạo 4 BST của Ler và tắt 5 BST cũ.';
end $$;

-- ══ Kiểm tra sau khi chạy (tùy chọn) ══
-- select c.emoji, c.name, c.slug, c.active, c.start_date, c.end_date,
--        (select count(*) from collection_products x where x.collection_id = c.id) as so_mau
-- from collections c order by c.order_index, c.id;
