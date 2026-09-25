-- ════════════════════════════════════════════════════════════════
-- NỀN cho thông báo: extension pg_cron/pg_net + bảng cấu hình app_settings (khoá kín).
-- (Tên file giữ nguyên cho khỏi lạc; phần gửi tin nằm ở file 15.)
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
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

-- 3) Hàm nhắc lịch + hẹn giờ 8:30: ĐÃ CHUYỂN sang 15_notifications_v2.sql (gửi qua Brevo).
--    Bản cũ (Telegram + Resend) từng nằm ở đây — chạy lại file này là ĐÈ bản mới, trong khi
--    token Telegram/Resend đã xoá → mất luôn email nhắc hằng ngày. Đã gỡ (25/09/2026).
--    File này giờ chỉ còn tạo nền (an toàn chạy lại bất cứ lúc nào).

-- ════════════════════════════════════════════════════════════════
-- SAU KHI CHẠY
-- ════════════════════════════════════════════════════════════════
-- Cấu hình email (Brevo) + test nhắc lịch: xem cuối file 15_notifications_v2.sql.
