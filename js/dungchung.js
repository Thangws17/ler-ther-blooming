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
//  nguyên bên đó (ví dụ jsAttr chỉ web khách dùng, compressImage chỉ
//  admin dùng).
// ══════════════════════════════════════════════════════════════════

// Chặn HTML lạ trong dữ liệu người dùng nhập trước khi nhét vào trang
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))

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
