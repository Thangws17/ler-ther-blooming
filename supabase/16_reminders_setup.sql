-- ════════════════════════════════════════════════════════════════
-- Cảnh báo chuẩn bị hàng cho NGÀY MAI — gửi Telegram + Email mỗi sáng
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
--
-- Cơ chế: pg_cron hẹn giờ → gọi hàm send_delivery_reminders() →
-- query đơn ngày mai → dùng pg_net gọi thẳng API Telegram + Resend.
-- KHÔNG cần server riêng / Edge Function / CLI.
-- ════════════════════════════════════════════════════════════════

-- 1) Bật extension (hoặc bật ở Dashboard → Database → Extensions)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Bảng cấu hình token (khóa kín — RLS bật, không policy → anon/app KHÔNG đọc được)
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

-- 3) Hàm gửi cảnh báo
create or replace function send_delivery_reminders() returns void
language plpgsql security definer set search_path = public as $$
declare
  s app_settings;
  v_tomorrow date := (now() at time zone 'Asia/Ho_Chi_Minh')::date + 1;
  v_count int;
  v_lines text;
  v_msg text;
  v_html text;
begin
  select * into s from app_settings where id = 1;

  select count(*),
         string_agg('• ' || coalesce(customer_name, '—') || ' — ' || product_name ||
                    coalesce(' (' || delivery_area || ')', '') || ' ×' || quantity,
                    E'\n' order by delivery_area nulls last)
    into v_count, v_lines
  from orders
  where delivery_date = v_tomorrow
    and status not in ('Đã hủy', 'Giao thành công', 'Hoàn thành');

  if coalesce(v_count, 0) = 0 then
    return;  -- ngày mai không có đơn → không gửi
  end if;

  v_msg := '🌸 Chuẩn bị hàng cho NGÀY MAI (' || to_char(v_tomorrow, 'DD/MM') || ')' ||
           E'\nCần giao ' || v_count || ' đơn:' || E'\n' || v_lines;

  -- Telegram
  if s.telegram_bot_token is not null and s.telegram_chat_id is not null then
    perform net.http_post(
      url     := 'https://api.telegram.org/bot' || s.telegram_bot_token || '/sendMessage',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object('chat_id', s.telegram_chat_id, 'text', v_msg)
    );
  end if;

  -- Email qua Resend
  if s.resend_api_key is not null and s.reminder_email is not null then
    v_html := '<h2>🌸 Chuẩn bị hàng cho ngày mai (' || to_char(v_tomorrow, 'DD/MM') || ')</h2>' ||
              '<p>Cần giao <b>' || v_count || ' đơn</b>:</p>' ||
              '<pre style="font-family:inherit;font-size:15px">' || v_lines || '</pre>';
    perform net.http_post(
      url     := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' || s.resend_api_key,
                                    'Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'from',    coalesce(s.reminder_from, 'onboarding@resend.dev'),
        -- reminder_email có thể chứa nhiều địa chỉ cách nhau dấu phẩy → mảng người nhận
        'to',      (select coalesce(jsonb_agg(trim(e)), '[]'::jsonb)
                    from unnest(string_to_array(s.reminder_email, ',')) e
                    where length(trim(e)) > 0),
        'subject', '🌸 Chuẩn bị hàng ngày mai: ' || v_count || ' đơn',
        'html',    v_html
      )
    );
  end if;
end;
$$;

-- 4) Hẹn giờ: 8:30 sáng giờ VN = 1:30 UTC (cron của Supabase chạy theo UTC)
do $$
begin
  perform cron.unschedule('daily-delivery-reminder');
exception when others then null;  -- chưa có lịch thì bỏ qua
end $$;

select cron.schedule('daily-delivery-reminder', '30 1 * * *', $$select send_delivery_reminders();$$);

-- ════════════════════════════════════════════════════════════════
-- SAU KHI CHẠY FILE TRÊN: điền token (thay giá trị thật của bạn)
-- ════════════════════════════════════════════════════════════════
-- update app_settings set
--   telegram_bot_token = 'PASTE_BOT_TOKEN',
--   telegram_chat_id   = 'PASTE_CHAT_ID',
--   resend_api_key     = 're_PASTE_API_KEY',
--   reminder_email     = 'mail1@gmail.com, mail2@gmail.com'  -- nhiều mail: cách nhau dấu phẩy
-- where id = 1;
--
-- Test ngay (tạo trước 1 đơn có ngày giao = ngày mai):
-- select send_delivery_reminders();
