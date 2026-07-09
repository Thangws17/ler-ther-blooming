-- ════════════════════════════════════════════════════════════════
-- Nhật ký cập nhật (changelog) — ghi lại các lần uplive website.
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
-- Cả 2 admin xem được, thêm góp ý vào từng bản cập nhật.
-- ════════════════════════════════════════════════════════════════

create table if not exists changelog (
  id bigint generated always as identity primary key,
  release_date date not null default current_date,
  title text not null,          -- tóm tắt 1 dòng
  details text,                 -- chi tiết (mỗi dòng 1 mục)
  note text,                    -- góp ý / ghi chú của 2 admin (sửa được)
  created_at timestamptz default now()
);

alter table changelog enable row level security;

drop policy if exists "Admin read changelog"   on changelog;
drop policy if exists "Admin insert changelog" on changelog;
drop policy if exists "Admin update changelog" on changelog;
drop policy if exists "Admin delete changelog" on changelog;

create policy "Admin read changelog"   on changelog for select using (auth.role() = 'authenticated');
create policy "Admin insert changelog" on changelog for insert with check (auth.role() = 'authenticated');
create policy "Admin update changelog" on changelog for update using (auth.role() = 'authenticated');
create policy "Admin delete changelog" on changelog for delete using (auth.role() = 'authenticated');

-- ── Seed lịch sử các lần uplive (chỉ chạy khi bảng đang trống) ────
insert into changelog (release_date, title, details)
select * from (values
  ('2026-06-12'::date, 'Khai sinh website 🌸',
'- Tạo website Ler & Ther Blooming đầu tiên, đưa lên Netlify
- Trang chủ, sản phẩm, gallery, liên hệ
- Đăng nhập admin bằng Netlify Identity'),
  ('2026-06-14'::date, 'Chuyển sang Supabase + admin mới + nhiều nâng cấp',
'- Chuyển toàn bộ dữ liệu sang Supabase (ổn định, miễn phí)
- Làm lại trang quản trị: đăng nhập riêng, upload ảnh
- Sản phẩm hỗ trợ nhiều ảnh + carousel tự chạy ở trang chi tiết
- Gallery: danh mục, phân trang, chọn ảnh từ Gallery cho sản phẩm
- Thêm trang "Đằng sau những bó hoa", đánh giá khách hàng, banner thông báo'),
  ('2026-06-15'::date, 'Kết nối mạng xã hội + hoàn thiện trải nghiệm',
'- Liên hệ: thêm Facebook, Instagram, TikTok, Threads
- Hero dùng ảnh thật, bản đồ Google Maps, OG tags khi chia sẻ link'),
  ('2026-06-20'::date, 'Hệ thống đặt hàng + khách hàng',
'- Khách đặt hàng ngay trên web (form đặt hoa), tự lưu đơn + hồ sơ khách theo SĐT
- Hiệu ứng trượt lên mềm mại khi cuộn trang'),
  ('2026-06-21'::date, 'Trang Chính sách + FAQ + chọn khu vực giao',
'- Trang chính sách: giao hàng / thanh toán / cam kết chất lượng + FAQ
- Form đặt hàng: chọn khu vực giao (12 quận Hà Nội), lời xác nhận đơn rõ ràng
- Trang chủ tự tính "Hoa tươi chỉ từ Xđ"'),
  ('2026-06-28'::date, 'CMS quản lý bán hàng (Phase 1) + cảnh báo chuẩn bị hàng',
'- Đơn hàng có tiền: đơn giá, phí ship, tổng tự tính; sửa đơn trong admin
- Tab Tổng quan: đơn mới, cần giao hôm nay, doanh thu
- Tab Lịch giao: nhóm theo Hôm nay / Ngày mai / Sắp tới
- Thêm đơn thủ công; mã đơn #LT-xxxx
- Cảnh báo chuẩn bị hàng ngày mai: banner admin + Telegram + Email 8:30 sáng'),
  ('2026-06-29'::date, 'Sổ chi phí + chuyển nhà sang Cloudflare',
'- Tab Sổ chi phí: ghi chi tiêu theo tháng, tự tính lãi/lỗ so với doanh thu
- Doanh thu tách 2 loại: dự kiến vs thực tế (chỉ đơn Hoàn thành)
- Sửa loạt lỗi review: chống XSS, đơn trễ hạn hiện đỏ, refresh đúng tab
- Netlify hết credit miễn phí → chuyển hosting sang Cloudflare'),
  ('2026-07-02'::date, 'Gallery tự quản lý danh mục',
'- Thêm/sửa/xóa/sắp xếp danh mục ảnh ngay trong admin
- Tab lọc trang Gallery công khai tự cập nhật theo danh mục'),
  ('2026-07-03'::date, 'Tìm kiếm đơn hàng + rà soát bảo mật',
'- Thanh tìm đơn theo mã / tên khách / SĐT / sản phẩm + lọc ngày giao
- Giao diện web gọn hơn, năm © tự cập nhật
- Bảo mật: chặn ghi đè thông tin khách qua SĐT, siết quyền ghi dữ liệu, chống XSS toàn site'),
  ('2026-07-05'::date, 'Form đặt hoa mới + logo chuẩn + tăng tốc',
'- Form đặt hàng 2 cột gọn đẹp (điện thoại vẫn 1 cột), lời nhắc đặt trước 1-2 ngày
- Logo Zalo/Facebook/Instagram/TikTok/Threads dùng logo thật
- Tăng tốc: nén ảnh khi upload, hoãn tải JS, tối ưu font
- Sửa được tên/SĐT khách trong đơn; điều hướng tháng ở Sổ chi phí'),
  ('2026-07-07'::date, 'Đơn tự có giá + kéo thả Gallery + tối ưu ảnh cũ',
'- Đơn khách đặt tự lấy giá niêm yết sản phẩm (hết "Chưa định giá")
- Giá hiển thị thống nhất kiểu 550.000đ ở mọi nơi
- Gallery admin: kéo thả sắp xếp ảnh
- Ảnh bật cache 1 năm + nút "Tối ưu ảnh cũ" 1 chạm (web nhanh hơn hẳn)'),
  ('2026-07-08'::date, 'Admin dùng mượt trên điện thoại + ảnh đơn hàng + sang GitHub Pages',
'- Admin responsive: menu trượt, đơn/khách/sản phẩm dạng thẻ, chi tiết trượt từ dưới lên
- Đơn hàng có ảnh đại diện (tự lấy ảnh sản phẩm; đơn tay gắn ảnh riêng, tự thêm vào Gallery)
- Sổ chi phí: đính ảnh hoá đơn cho từng dòng (chụp từ điện thoại)
- workers.dev bị nhà mạng chặn → chuyển hosting sang GitHub Pages (thangws17.github.io/ler-ther-blooming)'),
  ('2026-07-09'::date, 'Sổ nguyên liệu + bộ lọc đồng bộ + nhật ký cập nhật',
'- Nguyên liệu: gõ vài chữ khi lên chi phí là gợi ý (tự điền loại + giá gần nhất), tự học tên mới
- Xem lịch sử giá các lần nhập của từng nguyên liệu (mũi tên tăng/giảm giá)
- Lịch giao: lịch tháng trực quan — ngày có đơn đánh dấu xanh, trễ hạn đỏ, bấm ngày để lọc
- Đơn hàng: chip "Giao hôm nay/Ngày mai" + bộ chọn ngày kiểu lịch đẹp
- Thêm trang 📝 Cập nhật này — ghi lại các lần uplive, 2 admin cùng góp ý')
) as v(release_date, title, details)
where not exists (select 1 from changelog);
