-- ════════════════════════════════════════════════════════════════
-- Chuẩn hoá SỐ ĐIỆN THOẠI trong sổ khách (chạy trong Supabase SQL editor).
-- Chạy lại nhiều lần được — lần 2 trở đi sẽ không đổi gì nữa.
--
-- VÌ SAO CẦN:
--   Cùng một người, gõ "0912 345 678" lần này và "+84912345678" lần sau
--   sẽ thành HAI khách khác nhau trong sổ → lịch sử mua hàng bị xé đôi,
--   tra cứu không ra, đếm khách quen sai.
--
-- LÀM GÌ:
--   1. Đưa mọi SĐT về một dạng: bỏ dấu cách/chấm/gạch/ngoặc, +84… → 0…
--   2. Nếu sau khi chuẩn hoá có nhiều khách trùng số → GỘP làm một:
--      giữ bản ghi CŨ NHẤT, chuyển hết đơn về đó, xoá bản ghi thừa.
--      Tên/địa chỉ của bản ghi cũ được giữ; chỉ điền thêm nếu đang trống.
--
-- AN TOÀN: chỉ đụng bảng customers và cột orders.customer_id.
--          KHÔNG xoá đơn hàng nào.
-- ════════════════════════════════════════════════════════════════

-- Hàm chuẩn hoá dùng chung (đặt tên riêng để không đụng hàm sẵn có)
create or replace function norm_phone(p text)
returns text
language sql
immutable
as $$
  select case
    when p is null then null
    else (
      with cleaned as (
        select regexp_replace(p, '[\s.\-()]', '', 'g') as s
      )
      select case
        when s like '+84%' then '0' || substr(s, 4)
        when s like '84%' and length(s) >= 10 then '0' || substr(s, 3)
        else s
      end
      from cleaned
    )
  end
$$;

do $$
declare
  r record;
  v_keep bigint;
  v_moved int := 0;
  v_merged int := 0;
  v_renamed int := 0;
begin
  -- ── Bước 1: gộp các khách sẽ bị trùng số sau khi chuẩn hoá ──
  for r in
    select norm_phone(phone) as np, array_agg(id order by id) as ids
    from customers
    where phone is not null and length(trim(phone)) > 0
    group by norm_phone(phone)
    having count(*) > 1
  loop
    v_keep := r.ids[1];   -- giữ bản ghi cũ nhất (id nhỏ nhất)

    -- Chuyển toàn bộ đơn của các bản ghi thừa về bản ghi giữ lại
    update orders
       set customer_id = v_keep
     where customer_id = any(r.ids)
       and customer_id <> v_keep;
    get diagnostics v_moved = row_count;

    -- Bổ sung tên/địa chỉ nếu bản ghi giữ lại đang trống
    update customers c
       set name    = coalesce(nullif(trim(c.name), ''),    d.name),
           address = coalesce(nullif(trim(c.address), ''), d.address)
      from (
        select name, address from customers
        where id = any(r.ids) and id <> v_keep
          and (nullif(trim(name), '') is not null or nullif(trim(address), '') is not null)
        order by id limit 1
      ) d
     where c.id = v_keep;

    delete from customers where id = any(r.ids) and id <> v_keep;
    v_merged := v_merged + array_length(r.ids, 1) - 1;

    raise notice 'Gop % ban ghi trung so % (giu id %), chuyen % don',
      array_length(r.ids, 1) - 1, r.np, v_keep, v_moved;
  end loop;

  -- ── Bước 2: ghi lại số đã chuẩn hoá cho những dòng còn khác ──
  update customers
     set phone = norm_phone(phone)
   where phone is not null
     and phone <> norm_phone(phone);
  get diagnostics v_renamed = row_count;

  raise notice '── XONG: gop % khach trung, chuan hoa % so ──', v_merged, v_renamed;
end $$;

-- ── Kiểm tra lại: sau khi chạy, câu này phải trả về 0 dòng ──
select norm_phone(phone) as so_chuan, count(*) as so_ban_ghi
from customers
where phone is not null and length(trim(phone)) > 0
group by norm_phone(phone)
having count(*) > 1;
