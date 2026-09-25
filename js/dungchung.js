// ══════════════════════════════════════════════════════════════════
//  Hàm DÙNG CHUNG cho web khách và trang admin
//  ----------------------------------------------------------------
//  Trước đây 4 hàm này được viết 2 bản: một ở js/main.js, một trong
//  admin/index.html. Sửa một bên quên bên kia là sinh lỗi lệch nhau
//  (đã bị 2 lần). Giờ chỉ còn MỘT bản ở đây.
//
//  Nạp file này TRƯỚC js/main.js (web khách) và trước khối <script>
//  của admin. Không dùng module/import để giữ đúng lối "HTML+JS thuần,
//  không build" của dự án.
//
//  Chỉ để những hàm CẢ HAI BÊN đều cần. Hàm riêng của một bên thì để
//  nguyên bên đó (ví dụ compressImage chỉ admin dùng).
// ══════════════════════════════════════════════════════════════════

// Chặn HTML lạ trong dữ liệu người dùng nhập trước khi nhét vào trang
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
}

// Chuỗi nằm TRONG onclick="fn('…')" thì esc() chưa đủ: trình duyệt đổi &#39; ngược lại
// thành dấu ' TRƯỚC khi chạy lệnh → chuỗi bị cắt, phần sau thành lệnh lạ (test-bao-mat bắt).
// jsAttr: thoát lớp JS (dấu \ và ') rồi mới thoát lớp HTML.
function jsAttr(s) {
  return esc(String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"))
}

// Link do shop nhập (Facebook, TikTok…): chỉ nhận http/https. Gõ thiếu "https://"
// ("facebook.com/ler") thì tự thêm; còn "javascript:…" hay chữ lạ → bỏ (trả '').
function linkAnToan(url) {
  const s = String(url ?? '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s)) return 'https://' + s
  return ''
}

// ── Ảnh NHỎ cho thẻ / lưới / ô xem trước (25/09/2026) ──
// Ảnh gốc lưu ~1600px (TB 230KB) nhưng thẻ mẫu hoa trên điện thoại chỉ rộng ~180px.
// Supabase tự thu nhỏ khi đổi /object/public/ → /render/image/public/ (gói Pro; 100 ảnh
// gốc/tháng miễn phí, sau đó 5$/1000). Ảnh 495KB → ~40KB. Lỗi (hết hạn mức, đổi gói…)
// thì onerror tự quay về ảnh gốc — web không bao giờ mất ảnh.
// ĐANG TẮT (25/09/2026): shop dùng gói FREE — tính năng này chỉ dành cho gói Pro, dùng trên gói
// Free có thể bị Supabase hạn chế cả dự án. Lên gói Pro thì đổi thành true là chạy (test đã sẵn).
const ANH_NHO_BAT = false
function anhNho(url, rong, bat = ANH_NHO_BAT) {
  const s = String(url ?? '')
  if (!bat || !rong || !s.includes('/storage/v1/object/public/')) return s
  return s.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') +
    (s.includes('?') ? '&' : '?') + 'width=' + rong + '&resize=contain&quality=72'
}
// Chèn vào <img …>: `<img ${srcNho(p.image, 600)} alt="…">` (đã esc sẵn)
function srcNho(url, rong) {
  const goc = String(url ?? ''), nho = anhNho(goc, rong)
  return nho === goc ? `src="${esc(goc)}"` : `src="${esc(nho)}" data-goc="${esc(goc)}" onerror="anhLoi(this)"`
}
function anhLoi(img) {
  const goc = img.dataset.goc
  if (goc && img.getAttribute('src') !== goc) { img.removeAttribute('data-goc'); img.src = goc }
}

// Đưa SĐT về MỘT dạng chuẩn (0…) trước khi lưu.
// Thiếu bước này thì "0912 345 678" và "+84912345678" thành 2 khách khác
// nhau, lịch sử mua hàng của cùng một người bị xé đôi.
function normalizePhone(raw) {
  let s = String(raw ?? '').replace(/[\s.\-()]/g, '')
  if (s.startsWith('+84')) s = '0' + s.slice(3)
  else if (s.startsWith('84') && s.length >= 10) s = '0' + s.slice(2)
  return s
}

// SĐT Việt Nam: bắt đầu bằng 0, tổng 10 số (vài đầu số cũ 11 số vẫn còn dùng)
const PHONE_OK = /^0\d{9,10}$/
function isValidPhone(raw) { return PHONE_OK.test(normalizePhone(raw)) }

// ── Bộ biểu tượng nét mảnh (23/09/2026) — MỘT bộ cho cả web khách lẫn admin ──
// Thay emoji trong nút/menu (nhiều màu, rối mắt). Vẽ sẵn bằng SVG, không thư viện ngoài.
// Dùng: trong JS gọi ic('ten'); trong HTML viết <svg class="ic"><use href="#i-ten"/></svg>.
// Bộ <symbol> được chèn vào đầu <body> ngay khi file này chạy.
// Thêm biểu tượng: thêm 1 dòng vào BIEU_TUONG (nét vẽ khung 24×24, kiểu Lucide).
const BIEU_TUONG = {
  dash: "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"/>",
  box: "<path d=\"m7.5 4.27 9 5.15\"/><path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7 8.7 5 8.7-5\"/><path d=\"M12 22V12\"/>",
  cal: "<rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/>",
  users: "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>",
  user: "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>",
  wallet: "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\"/><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\"/>",
  bag: "<path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z\"/><path d=\"M3 6h18\"/><path d=\"M16 10a4 4 0 0 1-8 0\"/>",
  layers: "<path d=\"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z\"/><path d=\"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65\"/><path d=\"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65\"/>",
  img: "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21\"/>",
  msg: "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/>",
  note: "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"M16 13H8M16 17H8M10 9H8\"/>",
  set: "<path d=\"M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4\"/>",
  eye: "<path d=\"M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  pen: "<path d=\"M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z\"/><path d=\"m15 5 4 4\"/>",
  trash: "<path d=\"M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>",
  plus: "<path d=\"M5 12h14M12 5v14\"/>",
  minus: "<path d=\"M5 12h14\"/>",
  search: "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>",
  out: "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9\"/>",
  ext: "<path d=\"M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"/>",
  menu: "<path d=\"M4 6h16M4 12h16M4 18h16\"/>",
  x: "<path d=\"M18 6 6 18M6 6l12 12\"/>",
  pin: "<path d=\"M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>",
  phone: "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z\"/>",
  flower: "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 9V3M12 21v-6M9 12H3M21 12h-6M9.9 9.9 5.6 5.6M18.4 18.4l-4.3-4.3M9.9 14.1l-4.3 4.3M18.4 5.6l-4.3 4.3\"/>",
  truck: "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>",
  camera: "<path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z\"/><circle cx=\"12\" cy=\"13\" r=\"3\"/>",
  gift: "<rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\"/><path d=\"M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 8 12 8s2.5-5 4.5-5a2.5 2.5 0 0 1 0 5\"/>",
  dots: "<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/><circle cx=\"5\" cy=\"12\" r=\"1\"/>",
  tag: "<path d=\"M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\"1\"/>",
  check: "<path d=\"M20 6 9 17l-5-5\"/>",
  up: "<path d=\"m18 15-6-6-6 6\"/>",
  down: "<path d=\"m6 9 6 6 6-6\"/>",
  left: "<path d=\"m15 18-6-6 6-6\"/>",
  right: "<path d=\"m9 18 6-6-6-6\"/>",
  refresh: "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>",
  save: "<path d=\"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z\"/><path d=\"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7\"/>",
  zap: "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\"/>",
  receipt: "<path d=\"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z\"/><path d=\"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11\"/>",
  basket: "<path d=\"m15 11-1 9M19 11l-4-7M2 11h20M3.5 11l1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7M9 11l1 9\"/>",
  alert: "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/><path d=\"M12 9v4M12 17h.01\"/>",
  star: "<path d=\"M11.52 2.3a.53.53 0 0 1 .96 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.02a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.9l5.16-.76a2.12 2.12 0 0 0 1.6-1.16z\"/>",
  history: "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/><path d=\"M3 3v5h5M12 7v5l4 2\"/>",
  download: "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3\"/>",
  upload: "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12\"/>",
  wifi: "<path d=\"M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0\"/>",
  chat: "<path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\"/>",
  grip: "<circle cx=\"9\" cy=\"12\" r=\"1\"/><circle cx=\"9\" cy=\"5\" r=\"1\"/><circle cx=\"9\" cy=\"19\" r=\"1\"/><circle cx=\"15\" cy=\"12\" r=\"1\"/><circle cx=\"15\" cy=\"5\" r=\"1\"/><circle cx=\"15\" cy=\"19\" r=\"1\"/>",
  leaf: "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\"/><path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\"/>",
  palette: "<circle cx=\"13.5\" cy=\"6.5\" r=\"1\"/><circle cx=\"17.5\" cy=\"10.5\" r=\"1\"/><circle cx=\"8.5\" cy=\"7.5\" r=\"1\"/><circle cx=\"6.5\" cy=\"12.5\" r=\"1\"/><path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z\"/>",
  mail: "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/><path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\"/>",
  clock: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 6v6l4 2\"/>",
  card: "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\"/><path d=\"M2 10h20\"/>",
  heart: "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/>",
  send: "<path d=\"M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.94l7.93 3.18a2 2 0 0 1 1.11 1.11z\"/><path d=\"m21.85 2.15-10.94 10.94\"/>",
  shield: "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/><path d=\"m9 12 2 2 4-4\"/>"
}

// Viết bằng function (không phải const) để trang test chạy admin trong iframe gọi được
function ic(ten, cls = '') {
  return `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${ten}"/></svg>`
}

function chenBoBieuTuong() {
  if (document.getElementById('boBieuTuong')) return
  const sym = Object.keys(BIEU_TUONG).map(k => `<symbol id="i-${k}" viewBox="0 0 24 24">${BIEU_TUONG[k]}</symbol>`).join('')
  document.body.insertAdjacentHTML('afterbegin',
    `<svg id="boBieuTuong" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${sym}</svg>`)
}
if (document.body) chenBoBieuTuong()
else document.addEventListener('DOMContentLoaded', chenBoBieuTuong)

// ── Người nhận + giờ giao (24/09/2026) ──────────────────────────────
// Không thêm cột database: ghi vào đầu phần GHI CHÚ đơn theo mẫu cố định, mỗi thứ 1 dòng:
//   Người nhận: Lan · 0912345678
//   Giờ giao: 15h
//   <ghi chú khách gõ>
// Web khách GHÉP khi gửi đơn; admin TÁCH ra để hiện riêng và để form sửa đơn điền lại.
// Đổi chữ "Người nhận:" / "Giờ giao:" thì đơn cũ không tách được nữa — đừng đổi.
const GIO_GIAO = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h']

function ghepGhiChuDon({ nguoiNhan = '', sdtNhan = '', gio = '', ghiChu = '' } = {}) {
  const dong = []
  const nn = [String(nguoiNhan).trim(), String(sdtNhan).trim()].filter(Boolean).join(' · ')
  if (nn) dong.push('Người nhận: ' + nn)
  if (String(gio).trim()) dong.push('Giờ giao: ' + String(gio).trim())
  if (String(ghiChu).trim()) dong.push(String(ghiChu).trim())
  return dong.join('\n')
}

function tachGhiChuDon(note) {
  const kq = { nguoiNhan: '', sdtNhan: '', gio: '', ghiChu: '' }
  const dong = String(note || '').split('\n')
  while (dong.length) {
    const d = dong[0].trim()
    let m
    if ((m = d.match(/^Người nhận:\s*(.*)$/))) {
      const [ten, sdt] = m[1].split(' · ')
      kq.nguoiNhan = (ten || '').trim(); kq.sdtNhan = (sdt || '').trim()
    } else if ((m = d.match(/^Giờ giao:\s*(.*)$/))) {
      kq.gio = m[1].trim()
    } else break
    dong.shift()
  }
  kq.ghiChu = dong.join('\n').trim()
  return kq
}

// ─── Caption mẫu hoa (mô tả sản phẩm) kiểu "tạp chí" ─────────
//   “Latte buổi sớm”                       ← biệt danh, dòng ĐẦU, trong ngoặc kép
//   Hồng Capuchino · giấy gói ánh vàng      ← thành phần, cách nhau bằng " · "
//   Ngọt ngào — tinh tế — rất ăn ảnh.       ← chữ khoá, cách nhau bằng " — "
//   Phù hợp tặng sinh nhật, lễ tốt nghiệp.
//   Hoa có đặt theo size                    ← mọi dòng khác (kích thước, tặng kèm…)
// Dòng đầu không phải biệt danh trong ngoặc kép → trả null, web hiện nguyên chữ shop gõ.
function tachCaption(desc) {
  const dong = String(desc || '').split('\n').map(s => s.trim()).filter(Boolean)
  const m = dong.length ? dong[0].match(/^[“"](.+)[”"]$/) : null
  if (!m) return null
  const kq = { bietDanh: m[1].trim(), thanhPhan: [], chuKhoa: '', phuHop: '', them: [] }
  for (const d of dong.slice(1)) {
    if (!kq.thanhPhan.length && d.includes('·')) kq.thanhPhan = d.split('·').map(s => s.trim()).filter(Boolean)
    else if (!kq.chuKhoa && d.includes('—')) kq.chuKhoa = d
    else if (!kq.phuHop && /^Phù hợp tặng/i.test(d)) kq.phuHop = d.replace(/\.$/, '')
    else kq.them.push(d)
  }
  return kq
}

// Mã đơn hiển thị: #LT-0152 (giống orderCode trong admin)
function maDon(id) { return '#LT-' + String(id).padStart(4, '0') }
