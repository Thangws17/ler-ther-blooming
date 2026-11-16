-- 35 · Kiểm quyền + chống spam khi nhiều yêu cầu tạo đơn đồng thời.
-- Chạy sau 15 và 24. Chạy lại được, không đổi cấu trúc hay cách dùng SĐT.
-- Chỉ thay hàm place_order; bản hàm phải GIỐNG file 15 (test kiểm tự động).
-- Không sửa RLS hay cấu hình email. Nên thử trên database thử nghiệm trước.
begin;
do $$ begin
  if to_regprocedure('public.la_quan_tri()') is null then
    raise exception 'Cần chạy supabase/24_chi_quan_tri.sql trước';
  end if;
end $$;

create or replace function place_order(
  p_phone text,
  p_name text,
  p_address text,
  p_product_id bigint,
  p_product_name text,
  p_quantity int,
  p_delivery_date date,
  p_message_card text,
  p_note text,
  p_delivery_area text,
  p_email text default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin boolean := public.la_quan_tri();
  v_phone text := nullif(left(norm_phone(trim(coalesce(p_phone, ''))), 20), '');
  v_name  text := nullif(left(trim(coalesce(p_name, '')), 100), '');
  v_addr  text := nullif(left(trim(coalesce(p_address, '')), 300), '');
  v_pname text := nullif(left(trim(coalesce(p_product_name, '')), 200), '');
  v_card  text := nullif(left(trim(coalesce(p_message_card, '')), 500), '');
  v_note  text := nullif(left(trim(coalesce(p_note, '')), 1000), '');
  v_area  text := nullif(left(trim(coalesce(p_delivery_area, '')), 100), '');
  v_email text := nullif(left(trim(coalesce(p_email, '')), 200), '');
  v_date  date := p_delivery_date;
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_customer_id bigint;
  v_order_id bigint;
  v_qty int := least(greatest(coalesce(p_quantity, 1), 1), 99);
  v_unit_price numeric;
  v_db_name text;
  v_total_txt text;
  v_msg text;
  v_code text;
  v_html text;
  v_ct jsonb;
  v_ck text;
begin
  if coalesce(auth.role(), '') = 'authenticated' and not v_admin then
    raise exception 'KHONG_CO_QUYEN: tài khoản không thuộc quản trị shop' using errcode = '42501';
  end if;
  -- Cùng một khoá cho MỌI lượt tạo đơn, giữ tới COMMIT/ROLLBACK. Sau khi chờ,
  -- các SELECT ở READ COMMITTED thấy đơn vừa commit của lượt trước.
  perform pg_advisory_xact_lock(72638135::bigint);

  if v_email is not null and v_email !~* '^[^@[:space:]<>",;]+@[^@[:space:]<>",;]+\.[a-z]{2,}$' then
    v_email := null;
  end if;

  if not v_admin then
    -- Chống spam đơn ảo
    if v_phone is not null and (
         select count(*) from orders o join customers c on c.id = o.customer_id
         where c.phone = v_phone and o.created_at > now() - interval '10 minutes') >= 3 then
      raise exception 'QUA_NHIEU_DON: số này vừa đặt nhiều đơn liền';
    end if;
    if (select count(*) from orders where created_at > now() - interval '10 minutes') >= 20 then
      raise exception 'QUA_NHIEU_DON: web đang nhận quá nhiều đơn';
    end if;
    -- Ngày giao vô lý → để trống, shop gọi hẹn lại
    if v_date < v_today or v_date > v_today + 365 then
      v_date := null;
    end if;
  end if;

  -- Khách: có SĐT → định danh theo SĐT; không ghi đè thông tin khách đã có
  if v_phone is not null then
    insert into customers (phone, name, address)
    values (v_phone, coalesce(v_name, ''), v_addr)
    on conflict (phone) do update
      set address = coalesce(nullif(customers.address, ''), excluded.address),
          updated_at = now()
    returning id into v_customer_id;
  else
    v_customer_id := null;
  end if;

  -- Tự lấy giá niêm yết — CHỈ khi giá là SỐ TIỀN THUẦN ("350000", "350,000đ").
  -- Giá dạng chữ ("Liên hệ", "Từ 2xx (Theo size order)") → để trống = "Chưa định giá",
  -- shop tự chốt giá khi xác nhận đơn.
  -- ⚠️ ĐỪNG quay lại kiểu "bỏ hết ký tự không phải số": "Từ 2xx" sẽ thành đơn giá
  -- 2 ĐỒNG, email xác nhận gửi khách cũng ghi sai (lỗi thật, sửa 16/09/2026).
  -- Điều kiện lọc giống hệt supabase/18_price_normalize.sql.
  if p_product_id is not null then
    select case
             when price ~ '^[0-9][0-9.,[:space:]]*((đ|Đ|d|D)[[:space:]]*)?$'
             then nullif(regexp_replace(price, '[^0-9]', '', 'g'), '')::numeric
           end,
           name
      into v_unit_price, v_db_name
    from products
    where id = p_product_id;
    -- Web khách: tên mẫu theo database. Admin: giữ tên shop gõ (có thể thêm "+ thiệp"…)
    if not v_admin and v_db_name is not null then v_pname := v_db_name; end if;
  end if;

  insert into orders (customer_id, customer_name, product_id, product_name, quantity,
                      unit_price, customer_email,
                      delivery_address, delivery_area, delivery_date, message_card, note)
  values (v_customer_id, v_name, p_product_id, v_pname, v_qty,
          v_unit_price, v_email,
          v_addr, v_area, v_date, v_card, v_note)
  returning id into v_order_id;

  -- Gửi thông báo — lỗi gửi tin KHÔNG được làm hỏng việc tạo đơn
  begin
    v_code := '#LT-' || lpad(v_order_id::text, 4, '0');
    v_total_txt := case when v_unit_price is null then 'Chưa định giá'
      else replace(to_char(v_unit_price * v_qty, 'FM999,999,999'), ',', '.') || 'đ' end;

    -- (a) Báo SHOP (chữ thường → escape cả khối trước khi bọc <pre>)
    v_msg := '🌸 ĐƠN MỚI ' || v_code
      || E'\n👤 ' || coalesce(v_name, '—') || coalesce(' · ' || v_phone, '')
      || coalesce(E'\n✉️ ' || v_email, '')
      || E'\n💐 ' || coalesce(v_pname, '—') || ' ×' || v_qty || ' — ' || v_total_txt
      || E'\n📅 Giao: ' || coalesce(to_char(v_date, 'DD/MM/YYYY'), 'chưa hẹn')
      || coalesce(' · ' || v_area, '')
      || coalesce(E'\n📍 ' || v_addr, '')
      || coalesce(E'\n💌 "' || v_card || '"', '')
      || coalesce(E'\n📝 ' || v_note, '');
    perform notify_shop(
      v_msg,
      '🌸 Đơn mới ' || v_code || ' — ' || left(coalesce(v_name, ''), 60),
      '<pre style="font-family:inherit;font-size:15px;white-space:pre-wrap">' || html_esc(v_msg) || '</pre>'
    );

    -- (b) Mail XÁC NHẬN cho KHÁCH (chỉ khi email hợp lệ; tối đa 3 mail/ngày/địa chỉ)
    if v_email is not null and (
         select count(*) from orders
         where lower(customer_email) = lower(v_email) and created_at > now() - interval '1 day') <= 3 then
      -- Chuyển khoản trước (không bắt buộc) + CẢNH BÁO LỪA ĐẢO (08/10/2026, SQL 31).
      -- Đọc bảng contact qua to_jsonb: chưa chạy SQL 31 (chưa có cột ck_*) cũng KHÔNG lỗi, chỉ bỏ khối tài khoản.
      select to_jsonb(c) into v_ct from contact c where c.id = 1;
      v_ck := case when coalesce(v_ct->>'ck_so_tk', '') ~ '^[0-9]{4,20}$' and coalesce(v_ct->>'ck_ngan_hang', '') ~ '^[0-9]{6}$' then
          '<div style="margin-top:14px;padding:12px 14px;border:1px solid #C8E6C9;border-radius:10px;font-size:14px;">'
        || '<b>Muốn chuyển khoản trước?</b> Không bắt buộc — cọc một phần hay trả đủ đều được.<br>'
        || '<img src="https://img.vietqr.io/image/' || (v_ct->>'ck_ngan_hang') || '-' || (v_ct->>'ck_so_tk') || '-compact.png?addInfo=LT' || v_order_id
        || '" alt="Mã QR chuyển khoản" width="200" style="display:block;margin:10px 0;">'
        || 'Số tài khoản: <b>' || (v_ct->>'ck_so_tk') || '</b>'
        || coalesce('<br>Chủ tài khoản: <b>' || html_esc(nullif(v_ct->>'ck_chu_tk', '')) || '</b>', '')
        || '<br>Nội dung: <b>LT' || v_order_id || '</b> (giữ nguyên để shop đối chiếu đúng đơn)</div>'
        else '' end
        || '<div style="margin-top:12px;padding:12px 14px;border-radius:10px;background:#FFF4E5;color:#7A4100;font-size:13px;line-height:1.55;">'
        || '⚠️ <b>Cẩn thận lừa đảo:</b> Ler &amp; Ther chỉ nhận tiền vào <b>đúng tài khoản ghi trên web và trong mail này</b>'
        || coalesce(' (tên người nhận <b>' || html_esc(nullif(v_ct->>'ck_chu_tk', '')) || '</b>)', '') || '. '
        || 'Shop <b>không bao giờ</b> gọi điện / nhắn tin bảo bạn chuyển vào tài khoản khác, chuyển gấp hay chuyển thêm tiền. '
        || 'Gặp trường hợp đó, đừng chuyển — nhắn Zalo shop để kiểm tra nhé.</div>';
      v_html := '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;color:#1A2E1A;">'
        || '<h2 style="color:#2E7D32;margin-bottom:4px;">🌸 Ler &amp; Ther Blooming</h2>'
        || '<p>Chào <b>' || html_esc(coalesce(v_name, 'bạn')) || '</b>, cảm ơn bạn đã đặt hoa!</p>'
        || '<p>Đơn <b style="color:#2E7D32;">' || v_code || '</b> đã được ghi nhận:</p>'
        || '<table style="border-collapse:collapse;width:100%;font-size:14px;">'
        || '<tr><td style="padding:6px 0;color:#7A9879;">Sản phẩm</td><td style="text-align:right;"><b>'
          || html_esc(coalesce(v_pname, '—')) || ' ×' || v_qty || '</b></td></tr>'
        || '<tr><td style="padding:6px 0;color:#7A9879;">Tạm tính</td><td style="text-align:right;"><b>'
          || v_total_txt || '</b></td></tr>'
        || '<tr><td style="padding:6px 0;color:#7A9879;">Ngày giao mong muốn</td><td style="text-align:right;">'
          || coalesce(to_char(v_date, 'DD/MM/YYYY'), 'Shop sẽ hẹn khi gọi xác nhận') || '</td></tr>'
        || coalesce('<tr><td style="padding:6px 0;color:#7A9879;">Khu vực</td><td style="text-align:right;">'
          || html_esc(v_area) || '</td></tr>', '')
        || coalesce('<tr><td style="padding:6px 0;color:#7A9879;">Lời nhắn trên thiếp</td><td style="text-align:right;">&ldquo;'
          || html_esc(v_card) || '&rdquo;</td></tr>', '')
        || '</table>'
        || '<p style="margin-top:14px;">Shop sẽ gọi/Zalo cho bạn trong <b>15&ndash;30 phút</b> để xác nhận đơn và chốt phí giao (nếu có). '
        || 'Hoa sẽ được chụp ảnh gửi bạn duyệt trước khi giao 🌷</p>'
        || v_ck
        || '<p style="color:#7A9879;font-size:12px;margin-top:18px;">Ler &amp; Ther Blooming — Hoa tươi trao yêu thương</p>'
        || '</div>';
      perform send_customer_email(
        v_email,
        '🌸 Ler & Ther Blooming — Đã nhận đơn ' || v_code,
        v_html
      );
    end if;
  exception when others then null;
  end;

  return v_order_id;
end;
$$;

revoke execute on function place_order(text, text, text, bigint, text, int, date, text, text, text, text) from public;
grant execute on function place_order(text, text, text, bigint, text, int, date, text, text, text, text) to anon, authenticated;

commit;
