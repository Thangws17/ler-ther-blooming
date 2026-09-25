-- ════════════════════════════════════════════════════════════════
-- THÔNG BÁO v2 — chạy trong Supabase SQL editor, chạy lại nhiều lần không lỗi.
--
-- Gồm 4 việc (tất cả email đi qua BREVO — không dùng Telegram/Resend nữa):
--  1) ĐƠN MỚI: khách đặt hàng thành công → EMAIL báo SHOP ngay lập tức
--  2) MAIL XÁC NHẬN cho KHÁCH (nếu khách để lại email — không bắt buộc)
--  3) NHẮC LỊCH GIAO: 8:30 sáng mỗi ngày, nhắc các đơn giao trong 2 NGÀY TỚI
--  4) VÁ BẢO MẬT: khóa quyền gọi công khai các hàm gửi tin
--
-- Cấu hình Brevo + email nhận báo điền ở cuối file.
-- Hàm nhắc lịch send_delivery_reminders() CHỈ định nghĩa ở file này (file 16 cũ
-- đã bỏ bản Telegram/Resend — trước đây chạy lại 16 là đè mất bản mới).
-- ════════════════════════════════════════════════════════════════

-- Nền (trước ở file 16): extension + bảng cấu hình khoá kín — tự đủ, không phụ thuộc thứ tự
create extension if not exists pg_cron;
create extension if not exists pg_net;
create table if not exists app_settings (
  id int primary key default 1,
  telegram_bot_token text,
  telegram_chat_id   text,
  resend_api_key     text,
  reminder_email     text,
  reminder_from      text default 'onboarding@resend.dev',
  constraint single_row check (id = 1)
);
insert into app_settings (id) values (1) on conflict (id) do nothing;
alter table app_settings enable row level security;

-- ── Hàm gửi tin cho SHOP — qua EMAIL (Brevo), gửi tới các địa chỉ trong
--    reminder_email (nhiều mail cách nhau dấu phẩy). Không dùng Telegram/Resend. ──
create or replace function notify_shop(p_text text, p_subject text, p_html text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s app_settings;
  v_to jsonb;
begin
  select * into s from app_settings where id = 1;
  if s.brevo_api_key is null or s.brevo_from_email is null or s.reminder_email is null then
    return;   -- chưa cấu hình → bỏ qua êm ái
  end if;

  -- reminder_email có thể nhiều địa chỉ (cách nhau dấu phẩy) → mảng người nhận Brevo
  select coalesce(jsonb_agg(jsonb_build_object('email', trim(e))), '[]'::jsonb)
    into v_to
  from unnest(string_to_array(s.reminder_email, ',')) e
  where length(trim(e)) > 0;
  if v_to = '[]'::jsonb then return; end if;

  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', s.brevo_api_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'sender',      jsonb_build_object('email', s.brevo_from_email,
                                        'name', coalesce(s.brevo_from_name, 'Ler & Ther Blooming')),
      'to',          v_to,
      'subject',     p_subject,
      'htmlContent', p_html
    )
  );
end;
$$;

-- Chỉ hệ thống (cron / các hàm khác) được gọi — chặn gọi công khai qua API
revoke execute on function notify_shop(text, text, text) from public, anon, authenticated;

-- ── Email KHÁCH (không bắt buộc): cột lưu + cấu hình Brevo ───────
-- Brevo (brevo.com) gửi mail cho khách lạ KHÔNG cần tên miền riêng —
-- chỉ cần xác minh email người gửi. Miễn phí 300 mail/ngày.
alter table orders add column if not exists customer_email text;
alter table app_settings add column if not exists brevo_api_key text;
alter table app_settings add column if not exists brevo_from_email text;
alter table app_settings add column if not exists brevo_from_name text default 'Ler & Ther Blooming';

create or replace function send_customer_email(p_to text, p_subject text, p_html text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s app_settings;
begin
  select * into s from app_settings where id = 1;
  if s.brevo_api_key is null or s.brevo_from_email is null
     or p_to is null or length(trim(p_to)) = 0 then
    return;   -- chưa cấu hình / khách không để email → bỏ qua êm ái
  end if;
  perform net.http_post(
    url     := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object('api-key', s.brevo_api_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'sender',      jsonb_build_object('email', s.brevo_from_email,
                                        'name', coalesce(s.brevo_from_name, 'Ler & Ther Blooming')),
      'to',          jsonb_build_array(jsonb_build_object('email', trim(p_to))),
      'subject',     p_subject,
      'htmlContent', p_html
    )
  );
end;
$$;
revoke execute on function send_customer_email(text, text, text) from public, anon, authenticated;

-- ── Chặn HTML lạ trong email: khách gõ "<a href=…>" vào tên/lời nhắn thì email
--    chỉ hiện đúng chữ đó, không thành link/ảnh thật (kiểm tra bảo mật 25/09/2026) ──
create or replace function html_esc(t text) returns text
language sql immutable as $$
  select replace(replace(replace(replace(replace(t, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;')
$$;

-- ── 1) place_order: tạo đơn + BÁO SHOP + GỬI MAIL XÁC NHẬN CHO KHÁCH ──
-- Đổi chữ ký hàm (thêm p_email) → phải drop bản cũ trước
drop function if exists place_order(text, text, text, bigint, text, int, date, text, text, text);

-- GIA CỐ 25/09/2026 (đây là cửa DUY NHẤT người lạ ghi được vào database):
--  • Cắt độ dài từng ô (chặn dán cả trang chữ làm nặng database / email)
--  • Email khách sai định dạng → bỏ qua, không gửi
--  • Mọi chữ khách gõ đều qua html_esc() trước khi vào email
--  • Chống spam (chỉ áp cho web khách; admin đã đăng nhập thì không bị chặn):
--      - 1 SĐT tối đa 3 đơn / 10 phút
--      - cả web tối đa 20 đơn / 10 phút
--      - 1 email khách nhận tối đa 3 mail xác nhận / ngày (đơn vẫn ghi, chỉ không gửi mail)
--    Bị chặn → lỗi có chữ QUA_NHIEU_DON, web khách hiện lời mời nhắn Zalo (js/main.js).
--  • Web khách: tên mẫu lấy theo database (không tin tên gửi lên), số lượng 1–99,
--    ngày giao trong quá khứ / quá 1 năm → bỏ trống cho shop gọi hẹn lại.
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
  v_admin boolean := coalesce(auth.role(), '') = 'authenticated';
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
begin
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
    select id into v_customer_id from customers where phone = v_phone;
    if v_customer_id is null then
      insert into customers (phone, name, address)
      values (v_phone, v_name, v_addr)
      returning id into v_customer_id;
    else
      update customers
        set address    = coalesce(nullif(address, ''), v_addr),
            updated_at = now()
      where id = v_customer_id;
    end if;
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

grant execute on function place_order to anon;

-- ── 2) Nhắc lịch giao: các đơn giao trong 2 NGÀY TỚI (8:30 sáng) ──
create or replace function send_delivery_reminders() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_from date := (now() at time zone 'Asia/Ho_Chi_Minh')::date + 1;  -- ngày mai
  v_to   date := v_from + 1;                                          -- ngày kia
  v_count int;
  v_lines text;
  v_msg text;
begin
  -- coalesce từng ô: chỉ 1 ô trống (vd đơn chưa ghi tên mẫu) là CẢ DÒNG thành null và
  -- bị string_agg bỏ qua → email ghi "Cần giao 3 đơn" mà chỉ liệt kê 2 (sửa 25/09/2026)
  select count(*),
         string_agg('• ' || to_char(delivery_date, 'DD/MM') || ' — '
                    || coalesce(customer_name, '—') || ' — ' || coalesce(product_name, '(chưa ghi mẫu)')
                    || coalesce(' (' || delivery_area || ')', '') || ' ×' || coalesce(quantity, 1),
                    E'\n' order by delivery_date, delivery_area nulls last)
    into v_count, v_lines
  from orders
  where delivery_date between v_from and v_to
    and status not in ('Đã hủy', 'Giao thành công', 'Hoàn thành');

  if coalesce(v_count, 0) = 0 then
    return;  -- 2 ngày tới không có đơn → không gửi
  end if;

  v_msg := '🌸 Chuẩn bị hàng — 2 NGÀY TỚI (' || to_char(v_from, 'DD/MM')
        || ' & ' || to_char(v_to, 'DD/MM') || ')'
        || E'\nCần giao ' || v_count || ' đơn:' || E'\n' || v_lines;

  perform notify_shop(
    v_msg,
    '🌸 Chuẩn bị hàng 2 ngày tới: ' || v_count || ' đơn',
    -- tên khách / tên mẫu do khách gõ trên web → phải lọc trước khi thành HTML email
    '<pre style="font-family:inherit;font-size:15px;white-space:pre-wrap">' || html_esc(v_msg) || '</pre>'
  );
end;
$$;

-- ── 3) VÁ BẢO MẬT: chặn gọi công khai hàm nhắc (chỉ cron chạy được) ──
revoke execute on function send_delivery_reminders() from public, anon, authenticated;

-- Lịch 8:30 sáng VN (= 1:30 UTC) — đặt lại cho chắc
do $$
begin
  perform cron.unschedule('daily-delivery-reminder');
exception when others then null;
end $$;
select cron.schedule('daily-delivery-reminder', '30 1 * * *', $$select send_delivery_reminders();$$);

-- ════════════════════════════════════════════════════════════════
-- SAU KHI CHẠY: cấu hình (thay giá trị thật nếu chưa điền):
-- ════════════════════════════════════════════════════════════════
-- update app_settings set
--   -- Brevo (brevo.com — dùng cho CẢ mail khách lẫn mail báo shop):
--   brevo_api_key      = 'xkeysib-PASTE_KEY',     -- SMTP & API → API Keys
--   brevo_from_email   = 'email_da_xac_minh',     -- Senders: email đã xác minh
--   brevo_from_name    = 'Ler & Ther Blooming',
--   -- Email NHẬN thông báo của shop (nhiều mail cách nhau dấu phẩy):
--   reminder_email     = 'thangvh@sapo.vn, lept2@sapo.vn',
--   -- Không dùng Telegram/Resend nữa → dọn sạch:
--   telegram_bot_token = null,
--   telegram_chat_id   = null,
--   resend_api_key     = null
-- where id = 1;
--
-- Test nhắc lịch ngay không cần chờ 8:30 (SQL editor chạy quyền admin nên gọi được):
-- select send_delivery_reminders();
-- Test đơn mới + mail khách: đặt thử 1 đơn trên website CÓ điền email → xem hộp thư.
