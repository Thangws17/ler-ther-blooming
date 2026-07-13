-- ════════════════════════════════════════════════════════════════
-- Gộp danh mục: Sản phẩm và Gallery dùng CHUNG bảng gallery_categories.
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
--
-- Việc file này làm: mọi danh mục đang gán trên sản phẩm (products.category)
-- mà chưa có trong gallery_categories sẽ được thêm vào (emoji 🌸, xếp cuối),
-- để không sản phẩm nào bị "mồ côi" danh mục sau khi gộp.
-- Cần chạy gallery_categories_setup.sql trước (đã chạy từ đợt Gallery tự quản).
-- ════════════════════════════════════════════════════════════════

insert into gallery_categories (name, emoji, order_index)
select v.cat,
       case v.cat
         when 'Hoa bó'     then '🌹'
         when 'Giỏ hoa'    then '🌻'
         when 'Hoa để bàn' then '💐'
         when 'Hoa cưới'   then '👰'
         else '🌸'
       end,
       (select coalesce(max(order_index), 0) from gallery_categories) + v.rn
from (
  select cat, row_number() over (order by cat) as rn
  from (
    select distinct trim(category) as cat
    from products
    where category is not null and trim(category) <> ''
  ) d
) v
where not exists (
  select 1 from gallery_categories g
  where lower(trim(g.name)) = lower(v.cat)
);

-- Kiểm tra sau khi chạy: danh sách danh mục chung hiện có
-- select name, emoji, order_index from gallery_categories order by order_index;
