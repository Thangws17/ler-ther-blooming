-- ════════════════════════════════════════════════════════════════
-- NHẮC TRƯỚC GIỜ GIAO 2 TIẾNG — qua email của shop (Brevo, như mail 8:30)
-- Chạy trong Supabase SQL Editor. Chạy lại nhiều lần không lỗi.
-- CẦN CHẠY FILE 15 TRƯỚC (hàm notify_shop + cấu hình Brevo / reminder_email).
--
-- Cách chạy (26/09/2026):
--   • Giờ giao vẫn ghi trong GHI CHÚ đơn như cũ: "Giờ giao: 15h30" (phút 00 ghi "15h").
--     Không thêm cột giờ, không đổi place_order → web khách + đơn cũ giữ nguyên.
--   • Mỗi 5 phút database tự xem: đơn nào giao HÔM NAY, còn ≤ 2 tiếng, chưa đi giao
--     (trạng thái Mới / Đã xác nhận) và chưa nhắc → gửi 1 mail cho shop.
--   • Cột orders.nhac_gio_da_gui nhớ "đã nhắc cho giờ giao nào". Đổi giờ giao sau khi
--     đã nhắc → tới giờ mới sẽ nhắc lại. Đơn tạo khi đã sát giờ (còn < 2 tiếng) → nhắc ngay.
--   • Đơn không ghi giờ → không có mail này (vẫn có mail 8:30 sáng như cũ).
--
-- Đổi 2 tiếng thành số khác: sửa v_truoc bên dưới VÀ NHAC_TRUOC_PHUT trong admin/index.html
-- (admin hiện "Mail nhắc lúc …" dưới ô giờ + nhãn "còn 1g20" trên thẻ đơn).
-- ════════════════════════════════════════════════════════════════

create extension if not exists pg_net;
create extension if not exists pg_cron;

alter table orders add column if not exists nhac_gio_da_gui timestamptz;

-- ── 1) Đọc giờ giao từ ghi chú đơn → kiểu time. Không có / sai mẫu → null ──
-- Mẫu PHẢI khớp MAU_GIO trong js/dungchung.js ("15h", "15h30"; mỗi thứ 1 dòng, cờ 'n' = ^ $ theo từng dòng)
create or replace function gio_giao_cua(p_note text) returns time
language sql immutable as $$
  select case when m is not null and m[1]::int <= 23 and coalesce(m[2], '0')::int <= 59
              then make_time(m[1]::int, coalesce(m[2], '0')::int, 0) end
  from (select regexp_match(coalesce(p_note, ''), '^Giờ giao:[ \t]*(\d{1,2})h(\d{2})?[ \t\r]*$', 'n') as m) x
$$;

-- ── 2) Gửi mail nhắc ──
create or replace function nhac_truoc_gio_giao() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_truoc   interval := interval '2 hours';   -- khớp NHAC_TRUOC_PHUT (120) trong admin
  v_hom_nay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  r record;
  v_con int;
  v_con_txt text;
  v_gio_txt text;
  v_ma text;
  v_nhan text;
  v_ghichu text;
  v_msg text;
begin
  for r in
    select o.*,
           nullif(concat_ws(' · ', coalesce(o.customer_name, c.name), coalesce(o.customer_phone, c.phone)), '') as khach,
           ((o.delivery_date + gio_giao_cua(o.note)) at time zone 'Asia/Ho_Chi_Minh') as moc
    from orders o
    left join customers c on c.id = o.customer_id
    where o.delivery_date between v_hom_nay - 1 and v_hom_nay + 1   -- chỉ quanh hôm nay, không quét cả bảng
      and o.status in ('Mới', 'Đã xác nhận')                         -- Đang giao / xong / huỷ → khỏi nhắc
      and gio_giao_cua(o.note) is not null
  loop
    continue when now() < r.moc - v_truoc or now() >= r.moc;          -- chưa tới lúc nhắc / đã qua giờ giao
    continue when r.nhac_gio_da_gui is not distinct from r.moc;        -- đã nhắc đúng giờ này rồi

    -- Còn bao lâu, làm tròn 5 phút (cron chạy 5 phút/lần → 1g58 thành "2 tiếng")
    v_con := (round(extract(epoch from r.moc - now()) / 300.0) * 5)::int;
    v_con_txt := case
      when v_con >= 60 then (v_con / 60) || ' tiếng' || case when v_con % 60 > 0 then ' ' || (v_con % 60) || ' phút' else '' end
      else greatest(v_con, 1) || ' phút' end;
    v_gio_txt := regexp_replace(to_char(r.moc at time zone 'Asia/Ho_Chi_Minh', 'FMHH24"h"MI'), 'h00$', 'h');
    v_ma := '#LT-' || lpad(r.id::text, 4, '0');
    v_nhan := trim((regexp_match(coalesce(r.note, ''), '^Người nhận:[ \t]*([^\r\n]*)', 'n'))[1]);
    v_ghichu := trim(regexp_replace(coalesce(r.note, ''), '^(Người nhận|Giờ giao):[^\n]*\n?', '', 'gn'));

    -- concat_ws bỏ qua ô null → dòng nào trống thì biến mất, không làm mất cả mail
    v_msg := concat_ws(E'\n',
      'Còn ' || v_con_txt || ' nữa giao đơn ' || v_ma || ' — ' || v_gio_txt || ' hôm nay',
      case when r.status = 'Mới' then '⚠️ Đơn này CHƯA XÁC NHẬN với khách' end,
      '',
      'Mẫu: ' || coalesce(r.product_name, '(chưa ghi mẫu)') || ' ×' || coalesce(r.quantity, 1),
      'Khách: ' || r.khach,
      'Người nhận: ' || nullif(v_nhan, ''),
      'Giao tới: ' || nullif(trim(r.delivery_address), ''),
      'Lời nhắn thiệp: ' || nullif(trim(r.message_card), ''),
      'Ghi chú: ' || nullif(v_ghichu, '')
    );

    perform notify_shop(
      v_msg,
      '⏰ ' || v_gio_txt || ' giao ' || v_ma || ' — ' || left(coalesce(r.product_name, 'đơn hoa'), 60) || ' (còn ' || v_con_txt || ')',
      -- tên khách / ghi chú do khách gõ trên web → phải lọc trước khi thành HTML email
      '<div style="font-family:inherit;font-size:15px;line-height:1.55;white-space:pre-wrap">' || html_esc(v_msg) || '</div>'
      || '<p style="margin-top:18px"><a href="https://thangws17.github.io/ler-ther-blooming/admin/#Delivery" '
      || 'style="background:#2E7D32;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">'
      || 'Mở Lịch giao</a></p>'
    );

    update orders set nhac_gio_da_gui = r.moc where id = r.id;
  end loop;
end;
$$;

-- Chỉ cron được gọi — chặn gọi công khai qua API (như send_delivery_reminders)
revoke execute on function nhac_truoc_gio_giao() from public, anon, authenticated;

-- ── 3) Lịch: 5 phút/lần — đặt lại cho chắc ──
do $$
begin
  perform cron.unschedule('nhac-truoc-gio-giao');
exception when others then null;
end $$;
select cron.schedule('nhac-truoc-gio-giao', '*/5 * * * *', $$select nhac_truoc_gio_giao();$$);

-- ════════════════════════════════════════════════════════════════
-- KIỂM TRA SAU KHI CHẠY (không bắt buộc):
-- ════════════════════════════════════════════════════════════════
-- Đọc giờ có đúng không (phải ra 15:30:00 và 09:00:00):
--   select gio_giao_cua(E'Người nhận: Lan · 0912345678\nGiờ giao: 15h30\nKèm thiệp'), gio_giao_cua('Giờ giao: 9h');
--
-- Thử thật: tạo 1 đơn giao HÔM NAY, giờ giao cách bây giờ chưa tới 2 tiếng → trong vòng 5 phút có mail.
-- Hoặc gọi tay ngay (SQL Editor chạy quyền admin nên gọi được):
--   select nhac_truoc_gio_giao();
--
-- Xem lịch có chạy không:
--   select status, return_message, start_time from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'nhac-truoc-gio-giao')
--   order by start_time desc limit 5;
