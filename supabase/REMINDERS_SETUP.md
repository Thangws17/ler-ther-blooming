# Hướng dẫn bật cảnh báo chuẩn bị hàng (Telegram + Email)

Cảnh báo gửi mỗi sáng **8:30** (giờ VN), liệt kê đơn cần giao **ngày mai**.
Toàn bộ chạy trong Supabase — không cần server riêng.

---

## Bước 1 — Tạo bot Telegram (lấy bot token + chat id)

1. Mở Telegram, tìm **@BotFather** → gửi `/newbot` → đặt tên + username bot.
   BotFather trả về **bot token** dạng `123456:ABC-DEF...` → lưu lại.
2. Tìm bot vừa tạo (theo username), bấm **Start** và nhắn cho nó 1 tin bất kỳ ("hi").
3. Lấy **chat id**: mở trình duyệt, vào:
   `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
   (thay `<BOT_TOKEN>` bằng token ở bước 1). Tìm `"chat":{"id":123456789` →
   số đó là **chat id**.

> Muốn gửi vào nhóm (cả 2 vợ chồng cùng nhận): tạo nhóm, thêm bot vào nhóm,
> nhắn 1 tin trong nhóm rồi xem `getUpdates` — chat id nhóm là số âm (vd `-100...`).

## Bước 2 — Đăng ký Resend (lấy API key cho email)

1. Vào https://resend.com → đăng ký (miễn phí).
2. Vào **API Keys** → tạo key → lưu lại (dạng `re_...`).
3. Giai đoạn đầu cứ để người gửi là `onboarding@resend.dev` — Resend cho gửi tới
   chính email tài khoản của bạn mà không cần xác minh tên miền. (Sau này muốn
   gửi từ địa chỉ riêng thì verify domain trong Resend.)

## Bước 3 — Chạy SQL

Mở `supabase/reminders_setup.sql`, copy toàn bộ, dán vào **Supabase → SQL Editor** → Run.
(Bật sẵn extension `pg_cron`, `pg_net`, tạo bảng cấu hình, hàm gửi, và hẹn giờ 8:30.)

## Bước 4 — Điền token

Chạy tiếp đoạn này trong SQL Editor (thay giá trị thật):

```sql
update app_settings set
  telegram_bot_token = 'PASTE_BOT_TOKEN',
  telegram_chat_id   = 'PASTE_CHAT_ID',
  resend_api_key     = 're_PASTE_API_KEY',
  reminder_email     = 'email_cua_ban@gmail.com'
where id = 1;
```

> Chỉ muốn dùng Telegram (bỏ email): để trống `resend_api_key`/`reminder_email`.
> Ngược lại chỉ muốn email: để trống 2 trường telegram.

## Bước 5 — Test ngay

1. Trong Admin, sửa 1 đơn đặt **ngày giao = ngày mai**.
2. Chạy trong SQL Editor: `select send_delivery_reminders();`
3. Kiểm tra Telegram + hộp mail (cả thư mục Spam lần đầu).

Nếu nhận được → xong, từ giờ 8:30 mỗi sáng tự gửi. Nếu không có đơn ngày mai thì
không gửi gì (tránh làm phiền).

---

## Ghi chú
- Đổi giờ gửi: sửa lịch cron. VD 20:00 VN = 13:00 UTC →
  `select cron.schedule('daily-delivery-reminder','0 13 * * *',$$select send_delivery_reminders();$$);`
- Token nằm trong bảng `app_settings` đã khóa RLS (không lộ ra ngoài web).
- Xem lịch sử chạy cron: bảng `cron.job_run_details`.
