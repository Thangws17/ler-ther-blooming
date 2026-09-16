-- ════════════════════════════════════════════════════════════════
--  18. Chuẩn hoá GIÁ SẢN PHẨM về số trần
--  Chạy được nhiều lần, chạy lại không hỏng gì (idempotent).
-- ════════════════════════════════════════════════════════════════
--
--  VÌ SAO: cột products.price là TEXT và đang lẫn 2 kiểu —
--    "350000"      (số trần, kiểu mới admin đang lưu)
--    "350,000đ"    (kiểu cũ, còn 8 sản phẩm)
--  Lẫn nhau thì không sắp theo giá, không tính tổng được.
--
--  ⚠️ CHỈ đổi những giá THUẦN SỐ TIỀN. Shop còn dùng giá dạng chữ:
--     "Liên hệ", "Từ 2xx (Theo size order)" — mấy giá này PHẢI giữ
--     nguyên. Nếu làm kiểu "bỏ hết ký tự không phải số" thì
--     "Từ 2xx (Theo size order)" sẽ thành giá 2 đồng.
--
--  Điều kiện lọc bên dưới: chuỗi phải bắt đầu bằng chữ số và chỉ gồm
--  số / dấu chấm / dấu phẩy / khoảng trắng, cho phép chữ "đ" hoặc "d"
--  ở cuối. Có bất kỳ chữ nào khác là bỏ qua, không đụng tới.

-- ── Xem trước sẽ đổi những dòng nào (chạy riêng câu này nếu muốn kiểm) ──
-- select id, name, price as gia_cu,
--        regexp_replace(price, '[^0-9]', '', 'g') as gia_moi
--   from products
--  where price ~ '^[0-9][0-9.,[:space:]]*((đ|Đ|d|D)[[:space:]]*)?$'
--    and price !~ '^[0-9]+$';

-- ── Đổi thật ──
update products
   set price = regexp_replace(price, '[^0-9]', '', 'g')
 where price ~ '^[0-9][0-9.,[:space:]]*((đ|Đ|d|D)[[:space:]]*)?$'   -- thuần số tiền
   and price !~ '^[0-9]+$'                                          -- chưa phải số trần
   and regexp_replace(price, '[^0-9]', '', 'g') <> '';              -- bỏ trường hợp rỗng

-- ── Kiểm lại sau khi chạy: còn bao nhiêu dòng mỗi kiểu ──
select case
         when price ~ '^[0-9]+$' then 'số trần (đã chuẩn)'
         when price ~ '[0-9]'    then 'giá dạng chữ có số (giữ nguyên)'
         else 'giá dạng chữ (giữ nguyên)'
       end as kieu,
       count(*) as so_san_pham
  from products
 group by 1
 order by 2 desc;
