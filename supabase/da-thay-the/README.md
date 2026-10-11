# ⚠️ Các file đã bị thay thế — ĐỪNG chạy

3 file trong thư mục này đều định nghĩa lại hàm `place_order` theo bản **cũ** (10 tham số).
Bản đang dùng là `supabase/15_notifications_v2.sql` (11 tham số, có `p_email`).

**Chạy bất kỳ file nào ở đây sẽ LÙI hàm đặt hàng về bản cũ** → mất phần gửi email thông báo đơn mới.

Giữ lại chỉ để tra lịch sử. Khi dựng lại database, chạy các file `01_` → `33_` ở thư mục cha theo
bảng trong `supabase/README.md` — không cần và không được chạy mấy file này.

| File | Vì sao bỏ |
|---|---|
| `phase1_optional_phone.sql` | Cho phép đơn không SĐT. Cột `orders.customer_name` nó thêm thì `01_orders_setup_full.sql` đã có sẵn |
| `place_order_autoprice.sql` | Tự điền giá từ giá niêm yết — đã gộp vào bản mới |
| `place_order_hardening.sql` | Không cho ghi đè tên/địa chỉ khách cũ — đã gộp vào bản mới |
| `REMINDERS_SETUP_telegram_cu.md` | Hướng dẫn cũ nhắc lịch qua **Telegram + Resend**. Đã bỏ (25–26/09/2026), giờ mọi email đi qua **Brevo** — cấu hình ở cuối `15_notifications_v2.sql` |
