-- ════════════════════════════════════════════════════════════════
--  20. Mã công cụ đo lường truy cập (Google Analytics 4 + Microsoft Clarity)
--  Chạy được nhiều lần, chạy lại không hỏng gì (idempotent).
-- ════════════════════════════════════════════════════════════════
--
--  Thêm 2 ô vào bảng cài đặt `contact` để shop dán mã đo lường ngay trong
--  admin (tab ⚙️ Liên hệ), không phải sửa code:
--    ga4_id     — dạng "G-XXXXXXXXXX"  (Google Analytics 4)
--    clarity_id — dạng "abcd1234ef"    (Microsoft Clarity)
--
--  Bảng contact vốn cho khách đọc công khai — không sao: 2 mã này đằng nào
--  cũng hiện trong mã nguồn trang web, không phải thông tin bí mật.
--  Để TRỐNG thì web không nạp công cụ đo lường nào.

alter table contact add column if not exists ga4_id text;
alter table contact add column if not exists clarity_id text;
