/* ─── Ler & Ther Blooming — main.js ─────────────────────── */

const SUPABASE_URL = 'https://oijcwborkebjpavzyisl.supabase.co'
const SUPABASE_KEY = 'sb_publishable_vDRAF-LBS3nOpw1GHBchvw_xYuMfdqP'
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Escape để chèn an toàn vào HTML (text hoặc thuộc tính bọc dấu ")
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
// Chuỗi an toàn để nhúng vào onclick="fn('...')" — escape lớp JS rồi lớp HTML
const jsAttr = s => esc(String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"))

// Giá hiển thị đẹp: "550000" / "550,000 đ" → "550.000đ"; giá dạng chữ ("Liên hệ") giữ nguyên
function fmtPrice(raw) {
  const n = parseInt(String(raw ?? '').replace(/[^\d]/g, ''), 10)
  return n >= 1000 ? n.toLocaleString('vi-VN') + 'đ' : String(raw ?? '')
}

// ─── Nav ─────────────────────────────────────────────────
function initNav() {
  const toggle = document.getElementById('menuToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.textContent = open ? '✕' : '☰';
  });

  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.textContent = '☰';
    })
  );

  const page = location.pathname.split('/').pop() || 'index.html';
  links.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ─── Scroll reveal ───────────────────────────────────────
let _revealObserver;
function initScrollReveal(root = document) {
  if (!_revealObserver) {
    _revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          _revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  }
  root.querySelectorAll('.reveal:not(.in-view)').forEach(el => _revealObserver.observe(el));
}

// stagger helper: tag each element in a NodeList/array with an increasing delay
function staggerReveal(els, step = 0.08) {
  els.forEach((el, i) => el.style.setProperty('--reveal-delay', `${i * step}s`));
}

// ─── Category visual styles ───────────────────────────────
const CAT = {
  'Hoa bó'    : { bg:'linear-gradient(135deg,#FF8A80,#F06292)', emoji:'🌹' },
  'Giỏ hoa'   : { bg:'linear-gradient(135deg,#FFB74D,#FF7043)', emoji:'🌻' },
  'Hoa để bàn': { bg:'linear-gradient(135deg,#CE93D8,#AB47BC)', emoji:'💐' },
  'Hoa cưới'  : { bg:'linear-gradient(135deg,#FFF176,#FFD54F)', emoji:'👰' },
};
const CAT_DEFAULT = { bg:'linear-gradient(135deg,#A5D6A7,#4CAF50)', emoji:'🌸' };

function catStyle(cat) {
  const base = CAT[cat] || CAT_DEFAULT;
  // Emoji ưu tiên lấy từ danh mục chung trong DB (nếu đã tải) để khớp cấu hình admin
  const dbCat = Array.isArray(galleryCats) ? galleryCats.find(c => c.name === cat) : null;
  return dbCat?.emoji ? { bg: base.bg, emoji: dbCat.emoji } : base;
}

// ─── Build product card HTML ──────────────────────────────
// Thẻ tập trung vào sản phẩm: ảnh 4:5 chiếm phần lớn, chỉ còn tên + giá + nút Đặt ngay.
// Mô tả + danh mục vẫn xem đầy đủ ở trang chi tiết.
function productCardHTML(p) {
  const s = catStyle(p.category);
  const img = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`
    : `<div class="product-img-ph" style="background:${s.bg}">${s.emoji}</div>`;
  const nameAttr = jsAttr(p.name);
  return `
<div class="product-card reveal" data-category="${esc(p.category)}">
  <a href="san-pham-chi-tiet.html?id=${p.id}" class="product-img">${img}</a>
  <div class="product-info">
    <div class="product-name">
      <a href="san-pham-chi-tiet.html?id=${p.id}" style="color:inherit">${esc(p.name)}</a>
    </div>
    <div class="product-footer">
      <span class="product-price">${esc(fmtPrice(p.price))}</span>
      <button type="button" class="product-btn" onclick="openOrderModal(${p.id}, '${nameAttr}')">Đặt ngay</button>
    </div>
  </div>
</div>`;
}

// ─── Skeleton loading (khung chờ mềm thay chữ "Đang tải…") ─
function skeletonCards(n = 6) {
  return Array(n).fill(`
<div class="sk-card">
  <div class="sk-box sk-img"></div>
  <div class="sk-box sk-line w60"></div>
  <div class="sk-box sk-line w35"></div>
</div>`).join('');
}
function skeletonTiles(n = 8) {
  const hs = [230, 170, 260, 200, 180, 250, 210, 190];
  return Array.from({ length: n }, (_, i) =>
    `<div class="sk-box sk-tile" style="height:${hs[i % hs.length]}px"></div>`).join('');
}

// ─── Products page ────────────────────────────────────────
let allProducts = [];

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = skeletonCards(6);

  // Danh mục dùng CHUNG với Gallery (bảng gallery_categories) → tab lọc tự theo cấu hình trong admin
  const [prodRes, catRes] = await Promise.all([
    sb.from('products').select('*').order('order_index'),
    sb.from('gallery_categories').select('*').order('order_index'),
  ]);
  if (prodRes.error || !prodRes.data) {
    grid.innerHTML = '<div class="loading"><p>Không thể tải sản phẩm, vui lòng thử lại.</p></div>';
    return;
  }
  allProducts = prodRes.data;
  galleryCats = catRes.data || [];
  buildProductFilterTabs();
  renderProducts(allProducts, grid);
  initFilters();
}

// Dựng tab lọc sản phẩm từ danh mục chung (chỉ hiện danh mục đang có sản phẩm).
// Sản phẩm mang danh mục ngoài danh sách (dữ liệu cũ) vẫn có tab riêng để không bị "mất".
function buildProductFilterTabs() {
  const wrap = document.getElementById('productFilters');
  if (!wrap) return;
  const tabs = galleryCats
    .filter(c => allProducts.some(p => p.category === c.name))
    .map(c => `<button class="filter-tab" data-category="${esc(c.name)}">${esc(c.emoji || '🌸')} ${esc(c.name)}</button>`)
    .join('');
  const known = new Set(galleryCats.map(c => c.name));
  const extras = [...new Set(allProducts.map(p => p.category).filter(c => c && !known.has(c)))]
    .map(c => `<button class="filter-tab" data-category="${esc(c)}">🌸 ${esc(c)}</button>`)
    .join('');
  wrap.innerHTML = `<button class="filter-tab active" data-category="all">🌸 Tất cả</button>${tabs}${extras}`;
}

function renderProducts(list, grid) {
  if (!list.length) {
    grid.innerHTML = '<div class="loading"><div class="l-icon">🌷</div><p>Chưa có sản phẩm trong mục này.</p></div>';
    return;
  }
  grid.innerHTML = list.map(productCardHTML).join('');
  wireOrderButtons();
  staggerReveal(grid.querySelectorAll('.reveal'));
  initScrollReveal(grid);
}

function initFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat  = tab.dataset.category;
      const list = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
      renderProducts(list, document.getElementById('productsGrid'));
    });
  });
}

// ─── Hero price hint (home page) — tự tính giá thấp nhất ──
async function loadHeroPriceHint() {
  const el = document.getElementById('heroPriceHint');
  if (!el) return;
  const { data } = await sb.from('products').select('price');
  if (!data?.length) return;
  // Giá lưu dạng text ("600,000 đ") → tách số, bỏ giá trị bất thường
  const nums = data
    .map(p => parseInt(String(p.price ?? '').replace(/[^\d]/g, ''), 10))
    .filter(n => n >= 1000);
  if (!nums.length) return;
  const min = Math.min(...nums);
  el.textContent = `🌷 Hoa tươi chỉ từ ${min.toLocaleString('vi-VN')}đ · Giao tận nơi nội thành`;
  el.style.display = 'block';
}

// ─── Featured products (home page) ───────────────────────
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  grid.innerHTML = skeletonCards(4);
  const { data } = await sb.from('products').select('*').eq('featured', true).order('order_index').limit(4);
  if (!data?.length) { grid.closest('section')?.remove(); return; }
  grid.innerHTML = data.map(productCardHTML).join('');
  wireOrderButtons();
  staggerReveal(grid.querySelectorAll('.reveal'));
  initScrollReveal(grid);
}

// ─── Gallery ──────────────────────────────────────────────
// 12 ảnh/trang — chia đẹp cho 3 cột (máy tính) lẫn 2 cột (tablet), mỗi cột đầy đặn hơn
const GALLERY_PER_PAGE   = 12;
let galleryAll           = [];
let galleryCats          = [];
let galleryPage          = 0;
let galleryActiveCategory = 'all';

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  grid.innerHTML = skeletonTiles(8);
  const [galRes, catRes] = await Promise.all([
    sb.from('gallery').select('*').order('order_index'),
    sb.from('gallery_categories').select('*').order('order_index'),
  ]);
  if (galRes.error) {
    grid.innerHTML = '<div class="gallery-empty"><div class="e-icon">📶</div><p>Không tải được ảnh — mạng có thể đang chập chờn.<br><button class="page-btn" style="margin-top:14px;" onclick="loadGallery()">↻ Thử lại</button></p></div>';
    return;
  }
  galleryAll = galRes.data || [];
  galleryCats = catRes.data || [];
  galleryPage = 0;
  galleryActiveCategory = 'all';
  buildGalleryFilterTabs();
  initGalleryFilters();
  renderGalleryPage();
}

// Dựng tab lọc theo danh mục (chỉ hiện danh mục đang có ảnh)
function buildGalleryFilterTabs() {
  const wrap = document.getElementById('galleryFilters');
  if (!wrap) return;
  const tabs = galleryCats
    .filter(c => galleryAll.some(ph => ph.category === c.name))
    .map(c => `<button class="filter-tab gallery-filter-tab" data-category="${esc(c.name)}">${esc(c.emoji || '📷')} ${esc(c.name)}</button>`)
    .join('');
  wrap.innerHTML = `<button class="filter-tab gallery-filter-tab active" data-category="all">🌸 Tất cả</button>${tabs}`;
}

function getFilteredPhotos() {
  if (galleryActiveCategory === 'all') return galleryAll;
  return galleryAll.filter(ph => ph.category === galleryActiveCategory);
}

// Số cột theo bề rộng màn hình
function galleryColumnCount() {
  const w = window.innerWidth;
  return w <= 520 ? 1 : w <= 860 ? 2 : 3;
}

// Tỷ lệ cao/rộng của ảnh — đo 1 lần rồi nhớ, phân trang qua lại là tức thì
const _imgRatioCache = new Map();
function getImageRatio(url) {
  if (_imgRatioCache.has(url)) return Promise.resolve(_imgRatioCache.get(url));
  return new Promise(resolve => {
    const im = new Image();
    im.onload = () => {
      const r = (im.naturalHeight / im.naturalWidth) || 1.25;
      _imgRatioCache.set(url, r);
      resolve(r);
    };
    im.onerror = () => resolve(1.25);
    im.src = url;
  });
}

let _galRenderToken = 0;

async function renderGalleryPage() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const filtered = getFilteredPhotos();
  const start    = galleryPage * GALLERY_PER_PAGE;
  const page     = filtered.slice(start, start + GALLERY_PER_PAGE);

  if (!filtered.length) {
    grid.innerHTML = `
<div class="gallery-empty">
  <div class="e-icon">📷</div>
  <p>Chưa có ảnh trong mục này.<br>Quay lại sớm nhé!</p>
</div>`;
    renderGalleryPagination(0);
    return;
  }

  const token = ++_galRenderToken;
  if (page.some(ph => !_imgRatioCache.has(ph.url))) {
    // khung chờ xếp theo cột cho khớp bố cục
    grid.innerHTML = Array.from({ length: galleryColumnCount() }, () =>
      `<div class="gallery-col">${skeletonTiles(2)}</div>`).join('');
  }
  const ratios = await Promise.all(page.map(ph => getImageRatio(ph.url)));
  if (token !== _galRenderToken) return;   // đã bấm sang trang khác trong lúc đo

  // Chia ảnh vào cột đang ngắn nhất (giữ thứ tự tương đối, các cột cân nhau)
  const cols = galleryColumnCount();
  const colH = Array(cols).fill(0);
  const colItems = Array.from({ length: cols }, () => []);
  page.forEach((ph, i) => {
    let k = 0;
    for (let j = 1; j < cols; j++) if (colH[j] < colH[k]) k = j;
    colItems[k].push({ ph, r: ratios[i], i });
    colH[k] += ratios[i];
  });

  // Trang ĐỦ ảnh → "fit": ảnh giữ tỷ lệ thật nhưng co giãn nhẹ để 3 cột cùng đáy.
  // Trang cuối thiếu ảnh → để tự nhiên (chấp nhận hụt).
  const fit = cols > 1 && page.length === GALLERY_PER_PAGE;
  grid.innerHTML = colItems.map(items => `
<div class="gallery-col ${fit ? 'fit' : ''}">
  ${items.map(({ ph, r, i }) => `
  <div class="gallery-item" style="--ar:1/${r.toFixed(4)};--g:${r.toFixed(4)};animation-delay:${(i * 0.04).toFixed(2)}s"
       data-url="${esc(ph.url)}" data-caption="${esc(ph.caption || '')}" onclick="openLightboxFromEl(this)">
    <img src="${esc(ph.url)}" alt="${esc(ph.caption || 'Ảnh hoa ' + (start + i + 1))}" loading="lazy">
  </div>`).join('')}
</div>`).join('');

  renderGalleryPagination(filtered.length);
}

// Đổi cỡ cửa sổ → tính lại số cột
let _galResizeT;
window.addEventListener('resize', () => {
  if (!document.getElementById('galleryGrid')) return;
  clearTimeout(_galResizeT);
  _galResizeT = setTimeout(renderGalleryPage, 150);
});

function renderGalleryPagination(total) {
  const el = document.getElementById('galleryPagination');
  if (!el) return;
  const totalPages = Math.ceil(total / GALLERY_PER_PAGE);
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  el.innerHTML = `
<div class="pagination">
  <button class="page-btn" onclick="setGalleryPage(${galleryPage - 1})" ${galleryPage === 0 ? 'disabled' : ''}>← Trước</button>
  <span class="page-info">${galleryPage + 1} / ${totalPages}</span>
  <button class="page-btn" onclick="setGalleryPage(${galleryPage + 1})" ${galleryPage >= totalPages - 1 ? 'disabled' : ''}>Tiếp →</button>
</div>`;
}

function setGalleryPage(page) {
  galleryPage = page;
  renderGalleryPage();
  document.getElementById('galleryGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initGalleryFilters() {
  const tabs = document.querySelectorAll('.gallery-filter-tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      galleryActiveCategory = tab.dataset.category;
      galleryPage = 0;
      renderGalleryPage();
    });
  });
}

function openLightboxFromEl(el) {
  // Trang Gallery: mở theo vị trí trong bộ lọc hiện tại để chuyển ảnh ← → được
  const list = getFilteredPhotos();
  const idx = list.findIndex(ph => ph.url === el.dataset.url);
  if (idx >= 0) { openGalleryLightbox(idx); return; }
  openLightbox(el.dataset.url, el.dataset.caption || '');
}

// Lightbox Gallery: chuyển ảnh bằng nút ‹ › / phím mũi tên / vuốt ngang, đếm ảnh, nút đặt mẫu.
// Dựng bằng DOM + textContent → an toàn với mọi ký tự trong chú thích/URL.
function openGalleryLightbox(startIdx) {
  const list = getFilteredPhotos();
  if (!list.length) return;
  let idx = startIdx;

  const el = document.createElement('div');
  el.className = 'lightbox lightbox-nav-mode';

  const img = document.createElement('img');
  const cap = document.createElement('p');
  cap.className = 'lightbox-caption';
  const counter = document.createElement('span');
  counter.className = 'lightbox-counter';

  const mkBtn = (cls, text, label) => {
    const b = document.createElement('button');
    b.className = cls; b.textContent = text;
    b.setAttribute('aria-label', label);
    return b;
  };
  const btnPrev  = mkBtn('lightbox-nav lightbox-prev', '‹', 'Ảnh trước');
  const btnNext  = mkBtn('lightbox-nav lightbox-next', '›', 'Ảnh sau');
  const btnClose = mkBtn('lightbox-close', '✕', 'Đóng');
  const btnOrder = mkBtn('btn btn-primary lightbox-order', '🌸 Đặt mẫu này', 'Đặt hoa theo mẫu này');

  const show = (i) => {
    idx = (i + list.length) % list.length;   // xoay vòng đầu ↔ cuối
    const ph = list[idx];
    img.src = ph.url;
    img.alt = ph.caption || 'Ảnh hoa';
    cap.textContent = ph.caption || '';
    cap.style.display = ph.caption ? '' : 'none';
    counter.textContent = (idx + 1) + ' / ' + list.length;
  };
  const close = () => {
    el.classList.remove('show');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => el.remove(), 260);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  };

  btnPrev.onclick  = (e) => { e.stopPropagation(); show(idx - 1); };
  btnNext.onclick  = (e) => { e.stopPropagation(); show(idx + 1); };
  btnClose.onclick = (e) => { e.stopPropagation(); close(); };
  btnOrder.onclick = (e) => { e.stopPropagation(); const ph = list[idx]; close(); orderFromGalleryPhoto(ph); };
  img.onclick      = (e) => e.stopPropagation();   // chạm vào ảnh không đóng (để vuốt thoải mái)
  el.onclick = close;                              // chạm nền tối mới đóng

  // Vuốt ngang trên điện thoại để chuyển ảnh
  let touchX = null, touchY = null;
  el.addEventListener('touchstart', (e) => {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? idx + 1 : idx - 1);
  }, { passive: true });

  const bar = document.createElement('div');
  bar.className = 'lightbox-bar';
  bar.onclick = (e) => e.stopPropagation();
  bar.appendChild(counter);
  bar.appendChild(btnOrder);

  el.appendChild(btnClose);
  el.appendChild(btnPrev);
  el.appendChild(img);
  el.appendChild(btnNext);
  el.appendChild(cap);
  el.appendChild(bar);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  show(idx);
  requestAnimationFrame(() => el.classList.add('show'));
}

// Đặt hoa theo mẫu ảnh Gallery → mở form đặt hàng, ghi chú tự kèm link ảnh mẫu cho shop
function orderFromGalleryPhoto(ph) {
  if (!document.getElementById('orderModalBody')) return;
  openOrderModal(null, ph.caption ? `Mẫu Gallery: ${ph.caption}` : 'Mẫu trong Gallery');
  const note = document.getElementById('orderNote');
  if (note) note.value = `Đặt theo mẫu ảnh: ${ph.url}`;
}

function openLightbox(url, caption) {
  const el = document.createElement('div');
  el.className = 'lightbox';
  // Dựng bằng DOM + textContent → an toàn với mọi ký tự trong chú thích/URL
  const img = document.createElement('img');
  img.src = url; img.alt = caption;
  el.appendChild(img);
  if (caption) {
    const cap = document.createElement('p');
    cap.className = 'lightbox-caption';
    cap.textContent = caption;
    el.appendChild(cap);
  }
  const hint = document.createElement('p');
  hint.className = 'lightbox-hint';
  hint.textContent = 'Nhấn bất kỳ đâu hoặc phím Esc để đóng';
  el.appendChild(hint);
  const close = () => {
    el.classList.remove('show');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => el.remove(), 260);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
}

// ─── Contact ──────────────────────────────────────────────
let contactInfo = null;

async function loadContact() {
  const { data } = await sb.from('contact').select('*').eq('id', 1).single();
  if (!data) return;
  contactInfo = data;

  setText('cPhone',   contactInfo.phone   || '—');
  setText('cAddress', contactInfo.address || '—');
  setText('cHours',   contactInfo.hours   || '—');

  setHref('zaloBtn', zaloURL(contactInfo.zalo || contactInfo.phone));
  setHref('callBtn', `tel:${clean(contactInfo.phone)}`);

  setHref('zaloTextLink', zaloURL(contactInfo.zalo || contactInfo.phone));
  updateZaloFloat();

  // Policy page content
  setText('policyDelivery', contactInfo.policy_delivery || 'Liên hệ shop để biết thêm chi tiết.');
  setText('policyPayment',  contactInfo.policy_payment  || 'Liên hệ shop để biết thêm chi tiết.');
  setText('policyQuality',  contactInfo.policy_quality  || 'Liên hệ shop để biết thêm chi tiết.');

  // Ảnh chính cụm hero — primeHero() đã hiện bản tạm; ở đây thay bản chính thức
  // và nhớ URL vào máy để lần sau hiện ngay không chờ query
  if (contactInfo.hero_image) {
    _setHeroImg('heroBg', contactInfo.hero_image);
    try { localStorage.setItem('heroImageUrl', contactInfo.hero_image); } catch {}
  }
  // 2 ảnh phụ của cụm hero: ưu tiên ảnh admin chọn, bỏ trống thì lấy 2 ảnh đầu Gallery
  applyHeroSides(contactInfo);

  // Google Maps embed
  const mapEl = document.getElementById('contactMap');
  if (mapEl && contactInfo.address) {
    mapEl.innerHTML = `<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(contactInfo.address)}&output=embed&z=15" width="100%" height="340" style="border:0;border-radius:16px;display:block;" loading="lazy" allowfullscreen></iframe>`;
  }

  const SOCIALS = [
    { key:'facebook',  cItem:'cFbItem', cLink:'cFbLink', footer:'fbLink', cls:'btn-fb', label:'Facebook'  },
    { key:'instagram', cItem:'cIgItem', cLink:'cIgLink', footer:'igLink', cls:'btn-ig', label:'Instagram' },
    { key:'tiktok',    cItem:'cTtItem', cLink:'cTtLink', footer:'ttLink', cls:'btn-tt', label:'TikTok'    },
    { key:'threads',   cItem:'cThItem', cLink:'cThLink', footer:'thLink', cls:'btn-th', label:'Threads'   },
  ];
  const ctaRow     = document.getElementById('ctaSocialRow');
  const ctaSection = document.getElementById('ctaSocialSection');
  let hasSocial = false;

  SOCIALS.forEach(s => {
    const url = contactInfo[s.key];
    if (!url) return;
    hasSocial = true;
    const icon = SOCIAL_ICONS[s.key] || '';
    const cItem = document.getElementById(s.cItem);
    const cLink = document.getElementById(s.cLink);
    if (cItem) {
      cItem.style.display = 'flex';
      const iconEl = cItem.querySelector('.c-icon');
      if (iconEl) iconEl.innerHTML = icon;
    }
    if (cLink) cLink.href = url;
    const footerEl = document.getElementById(s.footer);
    if (footerEl) { footerEl.href = url; footerEl.style.display = 'inline'; }
    if (ctaRow) {
      const btn = document.createElement('a');
      btn.href = url; btn.target = '_blank';
      btn.className = `btn-social ${s.cls}`;
      btn.innerHTML = `${icon}<span>${s.label}</span>`;
      ctaRow.appendChild(btn);
    }
  });
  if (ctaSection && hasSocial) ctaSection.style.display = 'block';
}

// Logo SVG chính thức của các nền tảng (dùng để dẫn link) — fill trắng theo màu nền
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.3-1.46.72-2.12 1.38C1.36 2.67.94 3.34.63 4.14c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12-.66-.66-1.33-1.08-2.12-1.38-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.4v13.67a2.6 2.6 0 0 1-2.6 2.5 2.6 2.6 0 0 1-2.15-4.06 2.6 2.6 0 0 1 3-1.02V8.2a6 6 0 0 0-5.2 9.87A6 6 0 0 0 15.9 15.6V9.01a7.66 7.66 0 0 0 4.48 1.43V7.05a4.28 4.28 0 0 1-3.78-1.23z"/></svg>',
  threads: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.93 11.14c-.09-.04-.18-.08-.27-.12-.16-2.9-1.75-4.56-4.41-4.58h-.04c-1.6 0-2.92.68-3.74 1.91l1.47 1.01c.61-.92 1.57-1.12 2.27-1.12h.03c.87 0 1.53.26 1.96.75.31.36.52.86.63 1.49-.81-.14-1.68-.18-2.62-.12-2.64.15-4.34 1.69-4.22 3.83.06 1.08.6 2.02 1.52 2.62.78.52 1.78.77 2.83.72 1.38-.08 2.46-.6 3.22-1.56.57-.72.94-1.66 1.1-2.85.66.4 1.15.93 1.42 1.56.46 1.08.49 2.85-.96 4.29-1.27 1.27-2.79 1.81-5.09 1.83-2.55-.02-4.48-.84-5.73-2.43C5.13 16.18 4.5 14.05 4.48 12c.02-2.05.65-4.18 1.85-5.72 1.25-1.6 3.18-2.42 5.73-2.43 2.57.02 4.54.84 5.85 2.44.64.79 1.13 1.78 1.45 2.94l1.72-.46c-.39-1.42-1-2.65-1.84-3.68C17.55 3.06 15.09 2.02 11.87 2h-.01c-3.21.02-5.65 1.07-7.24 3.11C3.14 6.9 2.4 9.4 2.38 11.99v.02c.02 2.59.76 5.09 2.24 6.88 1.59 2.04 4.03 3.09 7.24 3.11h.01c2.85-.02 4.86-.77 6.51-2.42 2.16-2.16 2.1-4.86 1.39-6.52-.51-1.19-1.48-2.16-2.84-2.82zm-4.55 5.5c-1.16.07-2.37-.46-2.43-1.55-.04-.81.58-1.71 2.5-1.82.22-.01.43-.02.65-.02.7 0 1.35.07 1.94.2-.22 2.75-1.51 3.13-2.66 3.19z"/></svg>',
};

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setHref(id, url) {
  const el = document.getElementById(id);
  if (el && url) { el.href = url; }
}
function clean(s) { return (s || '').replace(/\s/g, ''); }
function zaloURL(num) { return num ? `https://zalo.me/${clean(num)}` : '#'; }

function updateZaloFloat() {
  const el = document.getElementById('zaloFloat');
  if (el && contactInfo) el.href = zaloURL(contactInfo.zalo || contactInfo.phone);
}

function wireOrderButtons() {
  const num = contactInfo?.zalo || contactInfo?.phone || '';
  document.querySelectorAll('.order-btn').forEach(btn => {
    const name = decodeURIComponent(btn.dataset.product || '');
    if (num) {
      btn.href   = zaloURL(num);
      btn.target = '_blank';
      btn.onclick = () => {
        if (name) {
          navigator.clipboard.writeText(`Tôi muốn đặt: ${name}`).catch(() => {});
          showMiniToast('📋 Đã copy tên sản phẩm — paste vào Zalo để đặt!');
        }
      };
    } else {
      btn.href = '#';
    }
  });
}

function showMiniToast(msg) {
  let t = document.getElementById('miniToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'miniToast';
    t.style.cssText = [
      'position:fixed;bottom:90px;left:50%;transform:translateX(-50%)',
      'background:rgba(30,30,30,.92);color:#fff;padding:10px 22px',
      'border-radius:50px;font-size:.85rem;font-weight:600',
      'z-index:9999;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.25)',
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.display = 'none', 3000);
}

// ─── Order Modal ──────────────────────────────────────────
let _orderProduct = { id: null, name: '' };

const HANOI_AREAS = [
  'Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy',
  'Tây Hồ', 'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Hà Đông',
  'Bắc Từ Liêm', 'Nam Từ Liêm',
];

function openOrderModal(productId, productName) {
  _orderProduct = { id: productId, name: productName };
  document.getElementById('orderModalBody').innerHTML = `
<div class="order-head">
  <h3>Đặt hoa 🌸</h3>
  <span class="order-product-name">${esc(productName)}</span>
</div>
<div class="order-reassure">🚚 Nội thành miễn phí · 💳 COD / Chuyển khoản · 📸 Gửi ảnh duyệt trước khi giao · <a href="chinh-sach.html" target="_blank">Xem chính sách</a></div>
<form id="orderForm" onsubmit="submitOrder(event)">
  <div class="order-grid">
    <div class="order-field">
      <label>Họ tên người đặt *</label>
      <input type="text" id="orderName" required placeholder="VD: Minh Anh">
    </div>
    <div class="order-field">
      <label>Số điện thoại *</label>
      <input type="tel" id="orderPhone" required placeholder="VD: 0912 345 678">
    </div>
    <div class="order-field of-full">
      <label>Email <span style="font-weight:400;color:var(--text-light);">(không bắt buộc — để nhận xác nhận đơn)</span></label>
      <input type="email" id="orderEmail" placeholder="VD: minhanh@gmail.com">
    </div>
    <div class="order-field">
      <label>Khu vực giao *</label>
      <select id="orderArea" required>
        <option value="">— Chọn khu vực —</option>
        ${HANOI_AREAS.map(a => `<option value="${a}">${a}</option>`).join('')}
        <option value="Khu vực khác">Khu vực khác (ngoại thành / tỉnh khác)</option>
      </select>
    </div>
    <div class="order-field">
      <label>Số lượng</label>
      <input type="number" id="orderQty" min="1" value="1">
    </div>
    <div class="order-field of-full">
      <label>Địa chỉ giao hàng *</label>
      <input type="text" id="orderAddress" required placeholder="Số nhà, ngõ, đường, phường…">
    </div>
    <div class="order-field of-full">
      <label>Ngày giao mong muốn</label>
      <input type="date" id="orderDate">
      <p class="order-hint">🌸 Nên đặt trước 1–2 ngày để shop chọn hoa tươi và chuẩn bị chu đáo nhất cho bạn nhé!</p>
    </div>
    <div class="order-field">
      <label>Lời nhắn trên thiếp</label>
      <textarea id="orderMessage" placeholder="VD: Chúc mừng sinh nhật..."></textarea>
    </div>
    <div class="order-field">
      <label>Ghi chú thêm</label>
      <textarea id="orderNote" placeholder="Yêu cầu khác (nếu có)"></textarea>
    </div>
    <!-- Bẫy bot: người thật không thấy ô này; bot tự điền là bị loại -->
    <div class="hp-field" aria-hidden="true">
      <label>Website</label>
      <input type="text" id="orderWebsite" tabindex="-1" autocomplete="off">
    </div>
  </div>
  <button type="submit" class="btn btn-primary order-submit" id="orderSubmitBtn">🌸 Gửi đơn đặt hàng</button>
</form>`;
  document.getElementById('orderOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  document.getElementById('orderOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Phím Esc: đóng nhanh form đặt hoa hoặc menu đang mở (lightbox tự xử lý Esc riêng)
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const overlay = document.getElementById('orderOverlay');
  if (overlay && overlay.classList.contains('open')) { closeOrderModal(); return; }
  const links = document.getElementById('navLinks');
  if (links && links.classList.contains('open')) {
    links.classList.remove('open');
    const t = document.getElementById('menuToggle');
    if (t) t.textContent = '☰';
  }
});

async function submitOrder(event) {
  event.preventDefault();
  const btn = document.getElementById('orderSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Đang gửi…';

  // Bẫy bot: ô ẩn có giá trị nghĩa là bot điền → giả vờ thành công, không tạo đơn
  if (document.getElementById('orderWebsite')?.value) {
    document.getElementById('orderModalBody').innerHTML = `
<div class="order-success"><div class="o-icon">🌸</div><h3>Đã nhận đơn của bạn!</h3></div>`;
    return;
  }

  const phone = document.getElementById('orderPhone').value.trim();
  const email = (document.getElementById('orderEmail')?.value || '').trim();

  // Email không bắt buộc — nhưng đã điền thì phải đúng định dạng
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    btn.disabled = false;
    btn.textContent = 'Gửi đơn đặt hàng';
    showMiniToast('✉️ Email chưa đúng định dạng, bạn xem lại giúp nhé');
    return;
  }

  const { error } = await sb.rpc('place_order', {
    p_phone: phone,
    p_name: document.getElementById('orderName').value.trim(),
    p_address: document.getElementById('orderAddress').value.trim(),
    p_product_id: _orderProduct.id,
    p_product_name: _orderProduct.name,
    p_quantity: parseInt(document.getElementById('orderQty').value) || 1,
    p_delivery_date: document.getElementById('orderDate').value || null,
    p_message_card: document.getElementById('orderMessage').value.trim() || null,
    p_note: document.getElementById('orderNote').value.trim() || null,
    p_delivery_area: document.getElementById('orderArea').value || null,
    p_email: email || null,
  });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'Gửi đơn đặt hàng';
    showMiniToast('❌ Có lỗi xảy ra, vui lòng thử lại hoặc nhắn Zalo.');
    return;
  }

  const zalo = zaloURL(contactInfo?.zalo || contactInfo?.phone);
  document.getElementById('orderModalBody').innerHTML = `
<div class="order-success">
  <div class="o-icon">🌸</div>
  <h3>Đã nhận đơn của bạn!</h3>
  <p style="color:var(--text-mid);margin-top:10px;line-height:1.75;">
    Đơn đặt <strong>${esc(_orderProduct.name)}</strong> đã được ghi nhận.<br>
    Chúng mình sẽ liên hệ số <strong>${esc(phone)}</strong> qua Zalo/điện thoại
    trong <strong>15–30 phút</strong> để xác nhận và báo phí giao (nếu có).
    ${email ? `<br>💌 Xác nhận đơn đã được gửi tới <strong>${esc(email)}</strong>.` : ''}
  </p>
  <div style="display:flex;gap:10px;justify-content:center;margin-top:22px;flex-wrap:wrap;">
    <a href="${zalo}" target="_blank" class="btn btn-primary">💬 Nhắn Zalo luôn</a>
    <button class="btn btn-outline" onclick="closeOrderModal()">Đóng</button>
  </div>
</div>`;
}

// ─── Banner ───────────────────────────────────────────────
function loadBanner() {
  if (sessionStorage.getItem('banner_dismissed')) return;
  if (!contactInfo?.banner_active || !contactInfo?.banner_text) return;
  const el = document.getElementById('siteBanner');
  if (!el) return;
  document.getElementById('bannerText').textContent = contactInfo.banner_text;
  el.style.display = 'block';
}

function closeBanner() {
  const el = document.getElementById('siteBanner');
  if (el) el.style.display = 'none';
  sessionStorage.setItem('banner_dismissed', '1');
}

// ─── Testimonials ─────────────────────────────────────────
async function loadTestimonials() {
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;
  const { data } = await sb.from('testimonials').select('*').eq('active', true).order('order_index');
  if (!data?.length) { grid.closest('section')?.remove(); return; }
  grid.innerHTML = data.map(t => `
<div class="testimonial-card reveal">
  <p class="testimonial-quote">${esc(t.content)}</p>
  <div class="testimonial-author">
    <span class="testimonial-name">${esc(t.name)}</span>
    ${t.context ? `<span class="testimonial-context">— ${esc(t.context)}</span>` : ''}
  </div>
</div>`).join('');
  staggerReveal(grid.querySelectorAll('.reveal'));
  initScrollReveal(grid);
}

// ─── Product Detail Carousel ─────────────────────────────
let _carImgs = [], _carIdx = 0, _carTimer = null;

function _carGoTo(i) {
  _carIdx = (i + _carImgs.length) % _carImgs.length;
  const track = document.getElementById('carouselTrack');
  if (track) track.style.transform = `translateX(-${_carIdx * 100}%)`;
  document.querySelectorAll('.carousel-thumb').forEach((t, idx) =>
    t.classList.toggle('active', idx === _carIdx)
  );
  clearInterval(_carTimer);
  _carTimer = setInterval(() => _carGoTo(_carIdx + 1), 5000);
}

function _carMove(dir) { _carGoTo(_carIdx + dir); }

function _startCarousel(imgs) {
  _carImgs = imgs; _carIdx = 0;
  clearInterval(_carTimer);
  _carTimer = setInterval(() => _carGoTo(_carIdx + 1), 5000);
}

function buildDetailImage(imgs, name, s) {
  if (!imgs.length) {
    return `<div class="detail-img"><div class="detail-img-ph" style="background:${s.bg}">${s.emoji}</div></div>`;
  }
  if (imgs.length === 1) {
    return `<div class="detail-img"><img src="${imgs[0]}" alt="${name}"></div>`;
  }
  const slides = imgs.map(url => `<img src="${url}" alt="${name}">`).join('');
  const thumbs = imgs.map((url, i) =>
    `<img src="${url}" class="carousel-thumb${i===0?' active':''}" onclick="_carGoTo(${i})" alt="${name} ${i+1}">`
  ).join('');
  return `
<div class="detail-carousel">
  <div class="carousel-main">
    <button class="carousel-arrow carousel-prev" onclick="_carMove(-1)">‹</button>
    <div class="carousel-track" id="carouselTrack">${slides}</div>
    <button class="carousel-arrow carousel-next" onclick="_carMove(1)">›</button>
  </div>
  <div class="carousel-thumbs">${thumbs}</div>
</div>`;
}

// ─── Product Detail Page ──────────────────────────────────
async function loadProductDetail() {
  const content = document.getElementById('detailContent');
  if (!content) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id) { content.innerHTML = '<div class="loading"><p>Không tìm thấy sản phẩm.</p></div>'; return; }

  const { data: p } = await sb.from('products').select('*').eq('id', id).single();
  if (!p) { content.innerHTML = '<div class="loading"><p>Sản phẩm không tồn tại.</p></div>'; return; }

  document.title = `${p.name} — Ler & Ther Blooming`;
  const _ogTitle = document.querySelector('meta[property="og:title"]');
  const _ogDesc  = document.querySelector('meta[property="og:description"]');
  const _ogImg   = document.querySelector('meta[property="og:image"]');
  if (_ogTitle) _ogTitle.content = `${p.name} — Ler & Ther Blooming`;
  if (_ogDesc)  _ogDesc.content  = p.description || '';
  if (_ogImg && p.images?.length) _ogImg.content = p.images[0];
  else if (_ogImg && p.image)     _ogImg.content = p.image;

  const s = catStyle(p.category);
  const imgs = (p.images?.length ? p.images : null) || (p.image ? [p.image] : []);
  const imgSection = buildDetailImage(imgs, p.name, s);

  content.innerHTML = `
<div class="detail-wrap">
  ${imgSection}
  <div class="detail-info">
    <a href="san-pham.html" class="detail-back">← Quay lại sản phẩm</a>
    <span class="detail-cat">${esc(p.category)}</span>
    <h1 class="detail-name">${esc(p.name)}</h1>
    <div class="detail-price">${esc(fmtPrice(p.price))}</div>
    <p class="detail-desc">${esc(p.description)}</p>
    <div class="detail-actions">
      <button type="button" class="btn btn-primary" style="font-size:1rem;" onclick="openOrderModal(${p.id}, '${jsAttr(p.name)}')">
        🌸 Đặt hàng ngay
      </button>
      <a href="#" class="btn btn-outline order-btn" data-product="${encodeURIComponent(p.name)}">
        📞 Hỏi qua Zalo
      </a>
    </div>
  </div>
</div>`;

  wireOrderButtons();
  if (imgs.length > 1) _startCarousel(imgs);
  loadRelated(p.category, p.id);
}

async function loadRelated(category, excludeId) {
  const section = document.getElementById('relatedSection');
  const grid    = document.getElementById('relatedGrid');
  if (!section || !grid) return;

  const { data } = await sb.from('products').select('*')
    .eq('category', category).neq('id', excludeId).limit(4);
  if (!data?.length) return;

  grid.innerHTML = data.map(productCardHTML).join('');
  wireOrderButtons();
  staggerReveal(grid.querySelectorAll('.reveal'));
  initScrollReveal(grid);
  section.style.display = 'block';
}

// ─── Init ─────────────────────────────────────────────────
function injectZaloIcons() {
  // Logo Zalo chính thức (images/zalo.svg)
  const img = '<img src="images/zalo.svg" alt="Zalo">';
  const ci = document.getElementById('zaloIcon'); if (ci) ci.innerHTML = img;
  const bi = document.querySelector('#zaloBtn .zi'); if (bi) bi.innerHTML = img;
  document.querySelectorAll('.zalo-float').forEach(fl => {
    const ic = fl.querySelector('span:not(.zalo-label)');
    if (ic) ic.innerHTML = img;
  });
}

// Hero hiện NGAY không chờ query: lần đầu dùng ảnh tĩnh trong repo,
// từ lần 2 dùng URL đã nhớ trong máy (localStorage) — dữ liệu thật tải về sẽ thay nếu đổi
function _setHeroImg(id, url) {
  const el = document.getElementById(id);
  if (!el || !url) return;
  const safe = String(url).replace(/['"()]/g, '');
  el.style.backgroundImage = `url('${safe}')`;
  requestAnimationFrame(() => el.classList.add('loaded'));
}
function primeHero() {
  if (!document.getElementById('heroBg')) return;
  _setHeroImg('heroBg', localStorage.getItem('heroImageUrl') || 'images/og-cover.jpg');
  _setHeroImg('heroSide1', localStorage.getItem('heroSide1Url'));
  _setHeroImg('heroSide2', localStorage.getItem('heroSide2Url'));
}

// 2 ảnh phụ của cụm hero = 2 ảnh ĐẦU Gallery (kéo thả sắp xếp Gallery trong admin để đổi)
// 2 ảnh phụ cụm hero: ưu tiên ảnh admin đã chọn (contact.hero_side1/2);
// ô nào bỏ trống thì lấy ảnh đầu Gallery (giữ tương thích như trước)
async function applyHeroSides(c) {
  if (!document.getElementById('heroSide1')) return;
  let s1 = c && c.hero_side1, s2 = c && c.hero_side2;
  if (!s1 || !s2) {
    const { data } = await sb.from('gallery').select('url').order('order_index').limit(2);
    s1 = s1 || data?.[0]?.url;
    s2 = s2 || data?.[1]?.url;
  }
  if (s1) { _setHeroImg('heroSide1', s1); try { localStorage.setItem('heroSide1Url', s1); } catch {} }
  if (s2) { _setHeroImg('heroSide2', s2); try { localStorage.setItem('heroSide2Url', s2); } catch {} }
}

// Nút ↑ quay lại đầu trang — chỉ hiện khi đã cuộn xuống đủ xa
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-top';
  btn.setAttribute('aria-label', 'Lên đầu trang');
  // Mũi tên SVG nét dày (ký tự ↑ quá mảnh); trên điện thoại chỉ hiện mũi tên
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M5 12l7-7 7 7"/></svg><span>Trang đầu</span>';
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  injectZaloIcons();
  primeHero();
  initBackToTop();
  // Năm © tự cập nhật (khỏi lỗi thời)
  document.querySelectorAll('.footer-bottom').forEach(el => {
    el.textContent = el.textContent.replace(/©\s*\d{4}/, '© ' + new Date().getFullYear());
  });
  // Tải song song cho nhanh: contact chạy nền, nội dung chính không phải chờ
  // (ảnh phụ hero do loadContact gọi applyHeroSides xử lý)
  const contactReady = loadContact();
  loadHeroPriceHint();
  loadFeatured();
  loadProducts();
  loadGallery();
  loadTestimonials();
  loadProductDetail();
  initScrollReveal();
  await contactReady;
  loadBanner();          // cần dữ liệu contact
  wireOrderButtons();    // nối lại link Zalo sau khi contact sẵn sàng
});
