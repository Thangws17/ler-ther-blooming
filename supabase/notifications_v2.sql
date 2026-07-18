-- ════════════════════════════════════════════════════════════════
-- THÔNG BÁO v2 — chạy trong Supabase SQL editor, chạy lại nhiều lần không lỗi.
--
-- Gồm 3 việc:
--  1) ĐƠN MỚI: khách đặt hàng thành công → gửi Telegram + Email cho SHOP ngay lập tức
--  2) NHẮC LỊCH GIAO: 8:30 sáng mỗi ngày, nhắc các đơn giao trong 2 NGÀY TỚI
--     (trước đây chỉ nhắc trước 1 ngày)
--  3) VÁ BẢO MẬT: khóa quyền gọi công khai hàm nhắc lịch (trước đây ai cầm
--     key public cũng kích hoạt được → có thể bị spam)
--
-- Cần chạy reminders_setup.sql trước (đã chạy từ trước — bảng app_settings).
-- Token Telegram/Resend điền ở cuối file nếu chưa điền.
-- ════════════════════════════════════════════════════════════════

-- ── Hàm gửi tin cho SHOP (Telegram + Email) — dùng chung ─────────
create or replace function notify_shop(p_text text, p_subject text, p_html text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s app_settings;
begin
  select * into s from app_settings where id = 1;

  if s.telegram_bot_token is not null and s.telegram_chat_id is not null then
    perform net.http_post(
      url     := 'https://api.telegram.org/bot' || s.telegram_bot_token || '/sendMessage',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('chat_id', s.telegram_chat_id, 'text', p_text)
    );
  end if;

  if s.resend_api_key is not null and s.reminder_email is not null then
    perform net.http_post(
      url     := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' || s.resend_api_key,
                                    'Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'from',    coalesce(s.reminder_from, 'onboarding@resend.dev'),
        'to',      (select coalesce(jsonb_agg(trim(e)), '[]'::jsonb)
                    from unnest(string_to_array(s.reminder_email, ',')) e
                    where length(trim(e)) > 0),
        'subject', p_subject,
        'html',    p_html
      )
    );
  end if;
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

-- ── 1) place_order: tạo đơn + BÁO SHOP + GỬI MAIL XÁC NHẬN CHO KHÁCH ──
-- Đổi chữ ký hàm (thêm p_email) → phải drop bản cũ trước
drop function if exists place_order(text, text, text, bigint, text, int, date, text, text, text);

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
  v_customer_id bigint;
  v_order_id bigint;
  v_qty int := greatest(coalesce(p_quantity, 1), 1);
  v_unit_price numeric;
  v_total_txt text;
  v_msg text;
  v_code text;
  v_html text;
begin
  -- Khách: có SĐT → định danh theo SĐT; không ghi đè thông tin khách đã có
  if p_phone is not null and length(trim(p_phone)) > 0 then
    select id into v_customer_id from customers where phone = p_phone;
    if v_customer_id is null then
      insert into customers (phone, name, address)
      values (p_phone, p_name, p_address)
      returning id into v_customer_id;
    else
      update customers
        set address    = coalesce(nullif(address, ''), p_address),
            updated_at = now()
      where id = v_customer_id;
    end if;
  else
    v_customer_id := null;
  end if;

  -- Tự lấy giá niêm yết của sản phẩm (tách số từ chuỗi giá)
  if p_product_id is not null then
    select nullif(regexp_replace(coalesce(price, ''), '[^0-9]', '', 'g'), '')::numeric
      into v_unit_price
    from products
    where id = p_product_id;
  end if;

  insert into orders (customer_id, customer_name, product_id, product_name, quantity,
                      unit_price, customer_email,
                      delivery_address, delivery_area, delivery_date, message_card, note)
  values (v_customer_id, p_name, p_product_id, p_product_name, v_qty,
          v_unit_price, nullif(trim(coalesce(p_email, '')), ''),
          p_address, p_delivery_area, p_delivery_date, p_message_card, p_note)
  returning id into v_order_id;

  -- Gửi thông báo — lỗi gửi tin KHÔNG được làm hỏng việc tạo đơn
  begin
    v_code := '#LT-' || lpad(v_order_id::text, 4, '0');
    v_total_txt := case when v_unit_price is null then 'Chưa định giá'
      else replace(to_char(v_unit_price * v_qty, 'FM999,999,999'), ',', '.') || 'đ' end;

    -- (a) Báo SHOP
    v_msg := '🌸 ĐƠN MỚI ' || v_code
      || E'\n👤 ' || coalesce(p_name, '—') || coalesce(' · ' || nullif(trim(p_phone), ''), '')
      || coalesce(E'\n✉️ ' || nullif(trim(p_email), ''), '')
      || E'\n💐 ' || coalesce(p_product_name, '—') || ' ×' || v_qty || ' — ' || v_total_txt
      || E'\n📅 Giao: ' || coalesce(to_char(p_delivery_date, 'DD/MM/YYYY'), 'chưa hẹn')
      || coalesce(' · ' || nullif(trim(p_delivery_area), ''), '')
      || coalesce(E'\n📍 ' || nullif(trim(p_address), ''), '')
      || coalesce(E'\n💌 "' || nullif(trim(p_message_card), '') || '"', '')
      || coalesce(E'\n📝 ' || nullif(trim(p_note), ''), '');
    perform notify_shop(
      v_msg,
      '🌸 Đơn mới ' || v_code || ' — ' || coalesce(p_name, ''),
      '<pre style="font-family:inherit;font-size:15px">' || v_msg || '</pre>'
    );

    -- (b) Mail XÁC NHẬN cho KHÁCH (chỉ khi khách để lại email)
    if nullif(trim(coalesce(p_email, '')), '') is not null then
      v_html := '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;color:#1A2E1A;">'
        || '<h2 style="color:#2E7D32;margin-bottom:4px;">🌸 Ler &amp; Ther Blooming</h2>'
        || '<p>Chào <b>' || coalesce(p_name, 'bạn') || '</b>, cảm ơn bạn đã đặt hoa!</p>'
        || '<p>Đơn <b style="color:#2E7D32;">' || v_code || '</b> đã được ghi nhận:</p>'
        || '<table style="border-collapse:collapse;width:100%;font-size:14px;">'
        || '<tr><td style="padding:6px 0;color:#7A9879;">Sản phẩm</td><td style="text-align:right;"><b>'
          || coalesce(p_product_name, '—') || ' ×' || v_qty || '</b></td></tr>'
        || '<tr><td style="padding:6px 0;color:#7A9879;">Tạm tính</td><td style="text-align:right;"><b>'
          || v_total_txt || '</b></td></tr>'
        || '<tr><td style="padding:6px 0;color:#7A9879;">Ngày giao mong muốn</td><td style="text-align:right;">'
          || coalesce(to_char(p_delivery_date, 'DD/MM/YYYY'), 'Shop sẽ hẹn khi gọi xác nhận') || '</td></tr>'
        || coalesce('<tr><td style="padding:6px 0;color:#7A9879;">Khu vực</td><td style="text-align:right;">'
          || nullif(trim(p_delivery_area), '') || '</td></tr>', '')
        || coalesce('<tr><td style="padding:6px 0;color:#7A9879;">Lời nhắn trên thiếp</td><td style="text-align:right;">&ldquo;'
          || nullif(trim(p_message_card), '') || '&rdquo;</td></tr>', '')
        || '</table>'
        || '<p style="margin-top:14px;">Shop sẽ gọi/Zalo cho bạn trong <b>15&ndash;30 phút</b> để xác nhận đơn và chốt phí giao (nếu có). '
        || 'Hoa sẽ được chụp ảnh gửi bạn duyệt trước khi giao 🌷</p>'
        || '<p style="color:#7A9879;font-size:12px;margin-top:18px;">Ler &amp; Ther Blooming — Hoa tươi trao yêu thương</p>'
        || '</div>';
      perform send_customer_email(
        p_email,
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
  select count(*),
         string_agg('• ' || to_char(delivery_date, 'DD/MM') || ' — '
                    || coalesce(customer_name, '—') || ' — ' || product_name
                    || coalesce(' (' || delivery_area || ')', '') || ' ×' || quantity,
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
    '<pre style="font-family:inherit;font-size:15px">' || v_msg || '</pre>'
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
-- SAU KHI CHẠY: điền token (thay giá trị thật, dòng nào chưa có thì bỏ qua):
-- ════════════════════════════════════════════════════════════════
-- update app_settings set
--   -- Báo SHOP qua Telegram (khuyên dùng — miễn phí, tức thì):
--   telegram_bot_token = 'PASTE_BOT_TOKEN',      -- tạo bot: nhắn @BotFather trên Telegram
--   telegram_chat_id   = 'PASTE_CHAT_ID',        -- lấy id: nhắn @userinfobot
--   -- Báo SHOP qua email (tùy chọn, Resend chỉ gửi về email chủ tài khoản khi chưa có tên miền):
--   resend_api_key     = 're_PASTE_API_KEY',     -- key MỚI (key cũ từng lộ, phải thu hồi)
--   reminder_email     = 'email_cua_ban@gmail.com',
--   -- Mail XÁC NHẬN cho KHÁCH qua Brevo (brevo.com — miễn phí 300 mail/ngày):
--   -- đăng ký Brevo → Senders: thêm + xác minh email người gửi → SMTP & API: tạo API key
--   brevo_api_key      = 'xkeysib-PASTE_KEY',
--   brevo_from_email   = 'email_da_xac_minh@gmail.com',
--   brevo_from_name    = 'Ler & Ther Blooming'
-- where id = 1;
--
-- Test nhắc lịch ngay không cần chờ 8:30 (SQL editor chạy quyền admin nên gọi được):
-- select send_delivery_reminders();
-- Test đơn mới + mail khách: đặt thử 1 đơn trên website CÓ điền email → xem hộp thư.
