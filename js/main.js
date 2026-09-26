/* ─── Ler & Ther Blooming — main.js ─────────────────────── */

const SUPABASE_URL = 'https://oijcwborkebjpavzyisl.supabase.co'
const SUPABASE_KEY = 'sb_publishable_vDRAF-LBS3nOpw1GHBchvw_xYuMfdqP'
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// esc(), jsAttr() (chuỗi trong onclick="fn('…')"), linkAnToan(), normalizePhone(), isValidPhone()
// → js/dungchung.js (dùng chung với admin)

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
    toggle.innerHTML = ic(open ? 'x' : 'menu');
  });

  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.innerHTML = ic('menu');
    })
  );

  // Tô sáng mục menu của trang đang xem. So theo TÊN TRANG đã bỏ đuôi .html,
  // để khớp cả link mới (/san-pham) lẫn link cũ ai đó còn lưu (/san-pham.html),
  // và trang chủ ("/", "./", "index.html") đều quy về 'index'.
  const tenTrang = p => (p || '').split(/[?#]/)[0].split('/').pop().replace(/\.html$/, '') || 'index';
  const page = tenTrang(location.pathname);
  links.querySelectorAll('a').forEach(a => {
    if (tenTrang(a.getAttribute('href')) === page) a.classList.add('active');
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
// Thẻ tập trung vào sản phẩm: ảnh 4:5 chiếm phần lớn, chỉ còn tên + biệt danh (nếu caption có) + giá + nút Đặt ngay.
// Mô tả + danh mục vẫn xem đầy đủ ở trang chi tiết.
function productCardHTML(p) {
  _prodCache[p.id] = { image: p.image, price: p.price };   // cho header form đặt hoa
  const s = catStyle(p.category);
  const img = p.image
    ? `<img ${srcNho(p.image, 600)} alt="${esc(p.name)}" loading="lazy">`
    : `<div class="product-img-ph" style="background:${s.bg}">${s.emoji}</div>`;
  const nameAttr = jsAttr(p.name);
  const cap = tachCaption(p.description);
  return `
<div class="product-card reveal" data-category="${esc(p.category)}">
  <a href="chi-tiet?id=${p.id}" class="product-img">${img}</a>
  <div class="product-info">
    <div class="product-name">
      <a href="chi-tiet?id=${p.id}" style="color:inherit">${esc(p.name)}</a>
    </div>
    ${cap ? `<div class="product-nick">“${esc(cap.bietDanh)}”</div>` : ''}
    <div class="product-footer">
      <span class="product-price">${esc(fmtPrice(p.price))}</span>
      <button type="button" class="product-btn" onclick="openOrderModal(${p.id}, '${nameAttr}')" aria-label="Đặt ${esc(p.name)}">${ic('plus')}<span>Đặt ngay</span></button>
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

// ─── Bộ sưu tập (BST) ─────────────────────────────────────
// Thay danh mục cũ ở phía khách. Bảng collections + collection_products
// (supabase/21_collections.sql), cấu hình ở admin → tab 🌿 Bộ sưu tập.
// Chưa chạy SQL 21 thì 2 truy vấn dưới lỗi → web vẫn chạy, chỉ không có bộ lọc.
let bstAll = [];       // BST đang hiện (đã lọc bật/tắt + ngày hẹn)
let bstGanAll = [];    // [{collection_id, product_id}] của các BST đang hiện
let _bstReady = null;  // nhiều trang cùng cần → chỉ tải đúng 1 lần

// Luật hiện/ẩn PHẢI giống hàm bstDangHien() trong admin/index.html
function bstDangHien(c, homNay = new Date().toLocaleDateString('sv-SE')) {
  if (!c || !c.active) return false;
  if (c.start_date && c.start_date > homNay) return false;
  if (c.end_date   && c.end_date   < homNay) return false;
  return true;
}

function loadBst() {
  if (_bstReady) return _bstReady;
  _bstReady = (async () => {
    const [cs, gs] = await Promise.all([
      sb.from('collections').select('*').order('order_index'),
      sb.from('collection_products').select('collection_id,product_id'),
    ]);
    bstAll = (cs.data || []).filter(c => bstDangHien(c));
    const dangHien = new Set(bstAll.map(c => c.id));
    bstGanAll = (gs.data || []).filter(x => dangHien.has(x.collection_id));
  })();
  return _bstReady;
}

function bstMauIds(cid) {
  return bstGanAll.filter(x => x.collection_id === cid).map(x => x.product_id);
}

function bstCuaMau(pid) {
  return bstAll.filter(c => bstGanAll.some(x => x.collection_id === c.id && x.product_id === pid));
}

function bstTheoSlug(slug) {
  return bstAll.find(c => c.slug === slug) || null;
}

// Ảnh bìa: admin đặt tay thì dùng, chưa đặt thì mượn ảnh mẫu đầu tiên trong bộ
function bstAnhBia(c, anhTheoId) {
  if (c.cover_url) return c.cover_url;
  for (const pid of bstMauIds(c.id)) if (anhTheoId[pid]) return anhTheoId[pid];
  return '';
}

// ─── Khối Bộ sưu tập ở trang chủ ──────────────────────────
async function loadBoSuuTap() {
  const wrap = document.getElementById('bstGrid');
  if (!wrap) return;
  const sec = document.getElementById('bstSection');
  const an = () => { if (sec) sec.style.display = 'none'; };

  await loadBst();
  // BST rỗng thì bỏ qua — bấm vào chỉ ra trang trắng
  const ds = bstAll.filter(c => bstMauIds(c.id).length);
  if (!ds.length) { an(); return; }

  // Chỉ hỏi ảnh mẫu khi có BST chưa đặt ảnh bìa
  let anhTheoId = {};
  if (ds.some(c => !c.cover_url)) {
    const { data } = await sb.from('products').select('id,image');
    (data || []).forEach(p => { if (p.image) anhTheoId[p.id] = p.image; });
  }

  wrap.innerHTML = ds.map(c => {
    const bia = bstAnhBia(c, anhTheoId);
    const em = esc(c.emoji || '🌸');
    const n = bstMauIds(c.id).length;
    return `
<a class="bst-card reveal" href="san-pham?bst=${encodeURIComponent(c.slug || '')}">
  ${bia ? `<img ${srcNho(bia, 600)} alt="${esc(c.name)}" loading="lazy">`
        : `<div class="bst-ph">${em}</div>`}
  <span class="bst-veil"></span>
  <span class="bst-txt">
    <span class="bst-em">${em}</span>
    <span class="bst-h">${esc(c.name)}</span>
    ${c.tagline ? `<span class="bst-tl">${esc(c.tagline)}</span>` : ''}
    <span class="bst-sl">${n} mẫu →</span>
  </span>
</a>`;
  }).join('');

  if (sec) sec.style.display = '';
  staggerReveal(wrap.querySelectorAll('.reveal'));
  initScrollReveal(wrap);
}

// ─── Products page ────────────────────────────────────────
let allProducts = [];

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = skeletonCards(6);

  // Bộ lọc dựng từ Bộ sưu tập đang hiện (bảng collections), không còn danh mục
  const [prodRes] = await Promise.all([
    sb.from('products').select('*').order('order_index'),
    loadBst(),
  ]);
  if (prodRes.error || !prodRes.data) {
    grid.innerHTML = '<div class="loading"><p>Không thể tải sản phẩm, vui lòng thử lại.</p></div>';
    return;
  }
  allProducts = prodRes.data;
  buildProductFilterTabs();
  // Link dạng /san-pham?bst=bst-trong-trang mở thẳng đúng bộ sưu tập
  const slug = new URLSearchParams(location.search).get('bst');
  if (slug && bstTheoSlug(slug)) currentBst = slug;
  initFilters();
  applyProductFilters();
}

// Dựng nút lọc từ Bộ sưu tập đang hiện — chỉ hiện bộ có ít nhất 1 mẫu.
// Nút "Tất cả" LUÔN có: mẫu không thuộc bộ nào vẫn phải xem và mua được.
function buildProductFilterTabs() {
  const wrap = document.getElementById('productFilters');
  if (!wrap) return;
  const coMau = new Set(allProducts.map(p => p.id));
  const tabs = bstAll
    .filter(c => bstMauIds(c.id).some(id => coMau.has(id)))
    .map(c => `<button class="filter-tab" data-bst="${esc(c.slug || '')}">${esc(c.name)}</button>`)
    .join('');
  wrap.innerHTML = `<button class="filter-tab active" data-bst="all">Tất cả</button>${tabs}`;
}

// Dải giới thiệu bộ sưu tập đang xem (ảnh bìa + câu giới thiệu)
function veBstBanner(c) {
  const el = document.getElementById('bstBanner');
  if (!el) return;
  if (!c) { el.innerHTML = ''; return; }
  const n = bstMauIds(c.id).length;
  el.innerHTML = `
<div class="bst-banner">
  ${c.cover_url ? `<img ${srcNho(c.cover_url, 1000)} alt="" loading="lazy">` : ''}
  <div>
    <h2>${esc(c.emoji || '🌸')} ${esc(c.name)}</h2>
    <p>${c.tagline ? esc(c.tagline) + ' · ' : ''}${n} mẫu</p>
  </div>
</div>`;
}

function renderProducts(list, grid) {
  if (!list.length) {
    grid.innerHTML = `<div class="loading"><div class="l-icon">${ic('flower')}</div><p>Chưa có sản phẩm trong mục này.</p></div>`;
    return;
  }
  grid.innerHTML = list.map(productCardHTML).join('');
  wireOrderButtons();
  staggerReveal(grid.querySelectorAll('.reveal'));
  initScrollReveal(grid);
}

// Bỏ dấu tiếng Việt để tìm kiếm dễ tính: gõ "hoa hong" vẫn ra "Hoa Hồng"
function noAccent(s) {
  return String(s ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // dải dấu thanh/mũ Unicode
    .replace(/đ/g, 'd').trim();
}

let currentBst = 'all';
let prodSearchTerm = '';

// Bộ sưu tập và ô tìm cùng lọc trên MỘT danh sách — đổi cái nào cũng gọi lại đây
function applyProductFilters() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const q = noAccent(prodSearchTerm);
  const bst = currentBst === 'all' ? null : bstTheoSlug(currentBst);
  veBstBanner(bst);
  const trongBo = bst ? new Set(bstMauIds(bst.id)) : null;
  const list = allProducts.filter(p =>
    (!trongBo || trongBo.has(p.id)) &&
    (!q || noAccent(p.name).includes(q) ||
           bstCuaMau(p.id).some(c => noAccent(c.name).includes(q)))
  );

  const clearBtn = document.getElementById('productSearchClear');
  if (clearBtn) clearBtn.style.display = prodSearchTerm ? 'flex' : 'none';

  // Tìm không ra thì nói rõ đang tìm gì + lối thoát, đừng để khách bơ vơ
  if (!list.length && q) {
    grid.innerHTML = `
<div class="loading">
  <div class="l-icon">${ic('search')}</div>
  <p>Không tìm thấy hoa nào khớp "<strong>${esc(prodSearchTerm)}</strong>".</p>
  <button type="button" class="btn btn-outline" style="margin-top:14px" onclick="resetProductSearch()">Xoá tìm kiếm</button>
</div>`;
    return;
  }
  renderProducts(list, grid);
}

function resetProductSearch() {
  prodSearchTerm = '';
  const input = document.getElementById('productSearch');
  if (input) input.value = '';
  applyProductFilters();
}

function initFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  // Mở bằng link ?bst=… thì tô sáng đúng nút đó thay vì "Tất cả"
  tabs.forEach(t => t.classList.toggle('active', t.dataset.bst === currentBst));
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentBst = tab.dataset.bst;
      // Ghi vào địa chỉ để khách sao link gửi đi vẫn mở đúng bộ sưu tập
      const u = new URL(location.href);
      if (currentBst && currentBst !== 'all') u.searchParams.set('bst', currentBst);
      else u.searchParams.delete('bst');
      history.replaceState(null, '', u);
      applyProductFilters();
    });
  });

  const input = document.getElementById('productSearch');
  if (input) {
    input.addEventListener('input', () => {
      prodSearchTerm = input.value.trim();
      applyProductFilters();
    });
    // Esc trong ô tìm = xoá nhanh, không đóng gì khác
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); resetProductSearch(); }
    });
  }
  document.getElementById('productSearchClear')?.addEventListener('click', resetProductSearch);
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
  el.textContent = `Hoa tươi chỉ từ ${min.toLocaleString('vi-VN')}đ · Giao tận nơi nội thành`;
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
    grid.innerHTML = '<div class="gallery-empty"><div class="e-icon">' + ic('wifi') + '</div><p>Không tải được ảnh — mạng có thể đang chập chờn.<br><button class="page-btn" style="margin-top:14px;" onclick="loadGallery()">↻ Thử lại</button></p></div>';
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
    .map(c => `<button class="filter-tab gallery-filter-tab" data-category="${esc(c.name)}">${esc(c.name)}</button>`)
    .join('');
  wrap.innerHTML = `<button class="filter-tab gallery-filter-tab active" data-category="all">Tất cả</button>${tabs}`;
}

function getFilteredPhotos() {
  if (galleryActiveCategory === 'all') return galleryAll;
  return galleryAll.filter(ph => ph.category === galleryActiveCategory);
}

// Số cột theo bề rộng màn hình
function galleryColumnCount() {
  const w = window.innerWidth;
  return w <= 860 ? 2 : w <= 1180 ? 3 : 4;
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
    im.src = anhNho(url, 600);   // CÙNG link ảnh nhỏ lưới hiển thị → tải 1 lần, đo xong dùng lại luôn
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
  <div class="e-icon">${ic('img')}</div>
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
    <img ${srcNho(ph.url, 600)} alt="${esc(ph.caption || 'Ảnh hoa ' + (start + i + 1))}" loading="lazy">
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
  const btnClose = mkBtn('lightbox-close', '', 'Đóng');
  btnClose.innerHTML = ic('x');
  const btnOrder = mkBtn('btn btn-primary lightbox-order', 'Đặt mẫu này', 'Đặt hoa theo mẫu này');

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
    unlockBodyScroll();
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
  lockBodyScroll();
  show(idx);
  requestAnimationFrame(() => el.classList.add('show'));
}

// Đặt hoa theo mẫu ảnh Gallery → mở form đặt hàng, ghi chú tự kèm link ảnh mẫu cho shop
function orderFromGalleryPhoto(ph) {
  if (!document.getElementById('orderModalBody')) return;
  openOrderModal(null, ph.caption ? `Mẫu ảnh Khoảnh khắc: ${ph.caption}` : 'Mẫu trong trang Khoảnh khắc', ph.url);
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
    unlockBodyScroll();
    setTimeout(() => el.remove(), 260);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  lockBodyScroll();
  requestAnimationFrame(() => el.classList.add('show'));
}

// ─── Đo lường truy cập (Google Analytics 4 + Microsoft Clarity) ─────────
// Mã đo lường nhập trong admin (tab Liên hệ) → lưu ở bảng contact → web đọc về.
// Để trống = không nạp gì. KHÔNG đếm khi:
//   • chạy thử ở máy (localhost / địa chỉ IP)
//   • máy đã từng đăng nhập admin (cờ lt_mayCuaShop) — để số liệu không lẫn shop
// Điều kiện mã giống hệt MA_GA4 / MA_CLARITY trong admin: mã được ghép vào địa
// chỉ tải script nên chỉ nhận đúng chữ-số.
const MA_GA4 = /^G-[A-Z0-9]{6,12}$/;
const MA_CLARITY = /^[a-z0-9]{6,20}$/;
let _doLuongBat = false;
// Thao tác xảy ra TRƯỚC khi biết có bật đo lường hay không (contact chưa tải xong —
// hay gặp trên 4G chậm) thì xếp hàng chờ, quyết xong mới gửi hoặc bỏ.
let _doLuongDaQuyet = false;
let _doLuongCho = [];

function nenDoLuong(tenMay = location.hostname) {
  if (!tenMay || tenMay === 'localhost' || /^[\d.]+$/.test(tenMay) || tenMay.startsWith('[')) return false;
  try { if (localStorage.getItem('lt_mayCuaShop') === '1') return false; } catch {}
  return true;
}

function initDoLuong(cfg, tenMay = location.hostname) {
  if (_doLuongBat) return true;
  _doLuongDaQuyet = true;
  if (!cfg || !nenDoLuong(tenMay)) { _doLuongCho = []; return false; }
  const ga4 = String(cfg.ga4_id || '').trim();
  const clarity = String(cfg.clarity_id || '').trim();
  let coGi = false;
  if (MA_GA4.test(ga4)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ga4);   // GA4 tự ẩn địa chỉ IP, không cần tham số riêng
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4);
    s.dataset.doLuong = 'ga4';
    document.head.appendChild(s);
    coGi = true;
  }
  if (MA_CLARITY.test(clarity)) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(clarity);
    s.dataset.doLuong = 'clarity';
    document.head.appendChild(s);
    coGi = true;
  }
  _doLuongBat = coGi;
  if (coGi) {
    ghiNhanBamLienHe();
    const cho = _doLuongCho; _doLuongCho = [];
    cho.forEach(([ten, thamSo]) => doLuong(ten, thamSo));
  } else {
    _doLuongCho = [];
  }
  return coGi;
}

// Ghi một hành động quan trọng của khách. Chưa bật đo lường thì không làm gì.
function doLuong(ten, thamSo = {}) {
  if (!_doLuongBat) {
    // Chưa quyết thì giữ lại (tối đa 20 cái cho khỏi phình), quyết là không bật thì bỏ
    if (!_doLuongDaQuyet && _doLuongCho.length < 20) _doLuongCho.push([ten, thamSo]);
    return;
  }
  try { if (window.gtag) window.gtag('event', ten, thamSo); } catch {}
  try { if (window.clarity) window.clarity('event', ten); } catch {}
}

// Bấm Zalo / gọi điện / Messenger / Facebook ở bất kỳ đâu trên trang
function ghiNhanBamLienHe() {
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const kenh = /zalo\.me/i.test(href) ? 'zalo'
      : /^tel:/i.test(href) ? 'dien_thoai'
      : /m\.me|messenger\.com/i.test(href) ? 'messenger'
      : /facebook\.com/i.test(href) ? 'facebook'
      : null;
    if (kenh) doLuong('lien_he', { kenh });
  }, true);
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

  // Chân trang: điền địa chỉ + SĐT tiệm (tận dụng thông tin Liên hệ)
  const footAddr = document.getElementById('footAddress');
  if (footAddr && contactInfo.address) {
    footAddr.querySelector('span').textContent = contactInfo.address;
    footAddr.style.display = '';
  }
  const footPhone = document.getElementById('footPhone');
  if (footPhone && contactInfo.phone) {
    footPhone.querySelector('span').textContent = contactInfo.phone;
    footPhone.href = `tel:${clean(contactInfo.phone)}`;
    footPhone.style.display = '';
  }

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
    const url = linkAnToan(contactInfo[s.key]);   // chặn link "javascript:…"
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

  // Mục Điện thoại: bấm là gọi luôn (trước đây chỉ là chữ tĩnh)
  const phoneItem = document.getElementById('cPhone')?.closest('.c-item');
  if (phoneItem && contactInfo.phone) phoneItem.dataset.href = `tel:${clean(contactInfo.phone)}`;
  makeContactItemsClickable();
}

// Bấm cả DÒNG (icon + nhãn + chữ) trong thẻ liên hệ đều mở liên kết —
// trước đây icon chỉ là trang trí, phải bấm đúng chữ mới ăn
function makeContactItemsClickable() {
  document.querySelectorAll('.contact-card .c-item').forEach(item => {
    const a = item.querySelector('a[href]');
    const aHref = a && a.getAttribute('href');
    const href = (aHref && aHref !== '#') ? aHref : item.dataset.href;
    if (!href || item.dataset.wired) return;
    item.dataset.wired = '1';
    item.classList.add('clickable');
    item.addEventListener('click', e => {
      if (e.target.closest('a')) return;               // bấm đúng link thì để mặc định
      if (a && a.target === '_blank') window.open(href, '_blank');
      else window.location.href = href;
    });
  });
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
          showMiniToast('Đã copy tên sản phẩm — paste vào Zalo để đặt!');
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
      // KHÔNG dùng nowrap: lời nhắn dài sẽ tràn khỏi màn hình điện thoại nhỏ
      'z-index:9999;max-width:calc(100vw - 32px);text-align:center;line-height:1.5',
      'box-shadow:0 4px 16px rgba(0,0,0,.25)',
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  const formMo = document.getElementById('orderOverlay')?.classList.contains('open');
  t.style.top = formMo ? 'calc(14px + env(safe-area-inset-top, 0px))' : 'auto';
  t.style.bottom = formMo ? 'auto' : 'calc(90px + env(safe-area-inset-bottom, 0px))';
  t.style.display = 'block';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.display = 'none', 3000);
}

// Đưa SĐT về MỘT dạng chuẩn (0…) trước khi lưu.
// Không có bước này thì cùng một người gõ "0912 345 678" lần này, "+84912345678"
// lần sau sẽ thành 2 khách khác nhau trong sổ — sổ khách loạn, khó tra lịch sử.


// SĐT Việt Nam luôn 10 số (di động) hoặc 10–11 số (máy bàn), đều bắt đầu bằng 0.
// Phải chặt tới mức này thì mới bắt được lỗi thiếu 1 số — thứ khiến shop gọi không ai nghe.


// Báo lỗi xong phải đưa khách TỚI ĐÚNG ô sai — form dài, bắt tự đi tìm là bỏ đơn
function focusOrderField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Ô nằm trong mục đang gấp (vd email) → mở mục ra trước, không thì focus vào ô ẩn chẳng thấy gì
  const than = el.closest('.omx-than');
  if (than && than.previousElementSibling) than.previousElementSibling.classList.add('open');
  try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
  setTimeout(() => { try { el.focus({ preventScroll: true }); } catch { el.focus(); } }, 120);
}

// ─── Khoá cuộn nền khi mở lớp phủ ─────────────────────────
// iOS Safari PHỚT LỜ `overflow:hidden` trên body → nền vẫn cuộn sau lớp phủ.
// Cách duy nhất ăn trên iPhone: ghim body bằng position:fixed rồi trả lại vị trí cũ khi đóng.
let _scrollLockY = 0;
let _scrollLockCount = 0;   // đếm lớp phủ đang mở (lightbox mở trên form…)

function lockBodyScroll() {
  if (_scrollLockCount++ > 0) return;          // đã khoá rồi thì thôi
  _scrollLockY = window.scrollY || window.pageYOffset || 0;
  const b = document.body.style;
  b.position = 'fixed';
  b.top = `-${_scrollLockY}px`;
  b.left = '0';
  b.right = '0';
  b.width = '100%';
  b.overflow = 'hidden';
}

function unlockBodyScroll() {
  if (_scrollLockCount > 0) _scrollLockCount--;
  if (_scrollLockCount > 0) return;            // còn lớp phủ khác đang mở
  const b = document.body.style;
  b.position = ''; b.top = ''; b.left = ''; b.right = ''; b.width = ''; b.overflow = '';
  window.scrollTo(0, _scrollLockY);            // trả về đúng chỗ khách đang xem
}

// ─── Order Modal ──────────────────────────────────────────
let _orderProduct = { id: null, name: '' };
// Nhớ ảnh + giá sản phẩm đã render để hiện trong header form đặt (đủ ngữ cảnh)
const _prodCache = {};

function openOrderModal(productId, productName, imgOverride) {
  doLuong('begin_checkout', { item_id: String(productId), item_name: productName || '' });
  _orderProduct = { id: productId, name: productName };
  const cached = (productId && _prodCache[productId]) || {};
  const img = imgOverride || cached.image || '';
  const price = cached.price ? fmtPrice(cached.price) : '';
  // Mặc định thân thiện: ngày giao = NGÀY MAI (đặt trước 1 ngày), không chọn được ngày quá khứ
  const _today = new Date().toLocaleDateString('sv-SE');
  const _tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE');

  // Form kiểu mới (24/09/2026) — cùng kiểu form admin: Người đặt · Người nhận · Giao.
  // Người nhận + giờ giao ghép vào GHI CHÚ đơn (ghepGhiChuDon, js/dungchung.js) → không đổi database.
  // Ngày giao: chip + lịch tự vẽ (bỏ <input type="date"> — iOS vẽ lệch khung, hiện kiểu tháng/ngày).
  document.getElementById('orderModalBody').innerHTML = `
<form id="orderForm" class="omx" onsubmit="submitOrder(event)">
  <div class="omx-sp">
    ${img ? `<img ${srcNho(img, 240)} alt="${esc(productName)}">` : `<div class="om-ph">${ic('flower')}</div>`}
    <div class="omx-sp-t">
      <div class="om-name">${esc(productName)}</div>
      ${price ? `<div class="om-price">${esc(price)}</div>` : ''}
    </div>
    <div class="qty-step">
      <button type="button" onclick="stepQty(-1)" aria-label="Bớt 1">${ic('minus')}</button>
      <input type="number" id="orderQty" min="1" max="99" value="1" inputmode="numeric" aria-label="Số lượng">
      <button type="button" onclick="stepQty(1)" aria-label="Thêm 1">${ic('plus')}</button>
    </div>
  </div>

  <div class="omx-grp">
    <div class="omx-gt">${ic('user')}Người đặt</div>
    <label class="omx-in">${ic('user')}<input type="text" id="orderName" required placeholder="Tên của bạn" autocomplete="name"></label>
    <label class="omx-in">${ic('phone')}<input type="tel" id="orderPhone" required placeholder="Số điện thoại" autocomplete="tel"></label>
  </div>

  <div class="omx-grp">
    <div class="omx-gt">${ic('heart')}Người nhận</div>
    <div class="omx-chips" id="omNhan">
      <button type="button" class="om-chip2 on" data-v="0" onclick="chonNguoiNhan(this)">Tôi nhận</button>
      <button type="button" class="om-chip2" data-v="1" onclick="chonNguoiNhan(this)">Tặng người khác</button>
    </div>
    <div id="omNhanKhac" style="display:none">
      <label class="omx-in">${ic('user')}<input type="text" id="orderRecvName" placeholder="Tên người nhận"></label>
      <label class="omx-in">${ic('phone')}<input type="tel" id="orderRecvPhone" placeholder="SĐT người nhận (để shop gọi khi giao)"></label>
    </div>
  </div>

  <div class="omx-grp">
    <div class="omx-gt">${ic('truck')}Giao</div>
    <label class="omx-in">${ic('pin')}<input type="text" id="orderAddress" required placeholder="Địa chỉ giao: số nhà, ngõ, đường, phường…" autocomplete="street-address"></label>
    <div class="omx-lb">Ngày giao</div>
    <div class="omx-chips" id="omNgay">
      <button type="button" class="om-chip2" data-d="1" onclick="chonNgayGiao(this)">Ngày mai</button>
      <button type="button" class="om-chip2" data-d="2" onclick="chonNgayGiao(this)">Ngày kia</button>
      <span class="omx-lich-wrap">
        <button type="button" class="om-chip2" id="omNgayKhac" onclick="moLichGiao()">${ic('cal')}<span>Chọn ngày</span></button>
        <div class="omx-lich" id="omLich" style="display:none"></div>
      </span>
    </div>
    <input type="hidden" id="orderDate" value="${_tomorrow}">
    <div class="omx-lb">Giờ giao mong muốn <small>không bắt buộc</small></div>
    <div class="bxg" id="omGio"></div>
    <input type="hidden" id="orderTime">
  </div>

  <div class="omx-more">
    <button type="button" class="omx-mo" onclick="this.classList.toggle('open')">${ic('plus')}<span>Lời nhắn trên thiếp</span><small>tuỳ chọn</small></button>
    <div class="omx-than"><label class="omx-in"><textarea id="orderMessage" rows="2" placeholder="VD: Chúc mừng sinh nhật…"></textarea></label></div>
    <button type="button" class="omx-mo" onclick="this.classList.toggle('open')">${ic('plus')}<span>Ghi chú / yêu cầu thêm</span><small>tuỳ chọn</small></button>
    <div class="omx-than"><label class="omx-in"><textarea id="orderNote" rows="2" placeholder="VD: kèm thiệp, nơ, giỏ mây…"></textarea></label></div>
    <button type="button" class="omx-mo" onclick="this.classList.toggle('open')">${ic('plus')}<span>Nhận xác nhận qua email</span><small>tuỳ chọn</small></button>
    <div class="omx-than"><label class="omx-in">${ic('mail')}<input type="email" id="orderEmail" placeholder="VD: minhanh@gmail.com" autocomplete="email"></label></div>
  </div>

  <!-- Bẫy bot: người thật không thấy ô này; bot tự điền là bị loại -->
  <div class="hp-field" aria-hidden="true">
    <label>Website</label>
    <input type="text" id="orderWebsite" tabindex="-1" autocomplete="off">
  </div>

  <div class="omx-ft">
    <div class="omx-ft-r">
      <div class="omx-tong"><small>Tạm tính</small><b>${price ? esc(price) : 'Shop báo giá'}</b></div>
      <button type="submit" class="btn btn-primary order-submit" id="orderSubmitBtn">Gửi đơn</button>
    </div>
    <p class="om-foot-note">Miễn phí nội thành · Duyệt ảnh trước khi giao · <a href="chinh-sach" target="_blank">Chính sách</a></p>
  </div>
</form>`;
  _lichThang = _tomorrow.slice(0, 7)
  dongBoNgayGiao();
  document.getElementById('orderOverlay').classList.add('open');
  // Giờ giao = bánh xe cuộn giờ | phút (banhXeGio, js/dungchung.js) — y hệt form admin (26/09/2026).
  // Dựng SAU khi form hiện: khung ẩn thì bánh xe không cuộn tới đúng chỗ được.
  const oTime = document.getElementById('orderTime');
  banhXeGio(document.getElementById('omGio'), { lay: () => oTime.value, dat: v => { oTime.value = v; }, gon: true });   // web: chỉ bánh xe, không chữ bên cạnh
  lockBodyScroll();
}

// ── Chip trong form đặt hoa ──
function chonNguoiNhan(btn) {
  document.querySelectorAll('#omNhan .om-chip2').forEach(b => b.classList.toggle('on', b === btn));
  const khac = btn.dataset.v === '1';
  document.getElementById('omNhanKhac').style.display = khac ? '' : 'none';
  if (khac) document.getElementById('orderRecvName').focus();
}
function _ngayCach(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE'); }
function chonNgayGiao(btn) {
  document.getElementById('orderDate').value = _ngayCach(Number(btn.dataset.d));
  document.getElementById('omLich').style.display = 'none';
  dongBoNgayGiao();
}
// Tô chip ngày đang chọn; ngày khác "mai/kia" thì chip lịch hiện ngày đó (dd/mm)
function dongBoNgayGiao() {
  const v = document.getElementById('orderDate')?.value || '';
  let trung = false;
  document.querySelectorAll('#omNgay .om-chip2[data-d]').forEach(b => {
    const on = v === _ngayCach(Number(b.dataset.d)); b.classList.toggle('on', on); if (on) trung = true;
  });
  const k = document.getElementById('omNgayKhac');
  if (!k) return;
  k.classList.toggle('on', !!v && !trung);
  k.querySelector('span').textContent = v && !trung ? v.slice(8, 10) + '/' + v.slice(5, 7) : 'Chọn ngày';
}

// Lịch tự vẽ (thay <input type="date">): không chọn được ngày đã qua
let _lichThang = null;
function moLichGiao() {
  const pop = document.getElementById('omLich');
  if (pop.style.display !== 'none') { pop.style.display = 'none'; return; }
  _lichThang = (document.getElementById('orderDate').value || _ngayCach(1)).slice(0, 7);
  veLichGiao(); pop.style.display = 'block';
}
function doiThangLich(n) {
  const [y, m] = _lichThang.split('-').map(Number);
  _lichThang = new Date(y, m - 1 + n, 1).toLocaleDateString('sv-SE').slice(0, 7);
  veLichGiao();
}
function veLichGiao() {
  const pop = document.getElementById('omLich');
  const [y, m] = _lichThang.split('-').map(Number);
  const homNay = _ngayCach(0), chon = document.getElementById('orderDate').value;
  const dau = (new Date(y, m - 1, 1).getDay() + 6) % 7, soNgay = new Date(y, m, 0).getDate();
  let o = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(t => `<span class="ol-dow">${t}</span>`).join('');
  for (let i = 0; i < dau; i++) o += '<span></span>';
  for (let d = 1; d <= soNgay; d++) {
    const ds = `${_lichThang}-${String(d).padStart(2, '0')}`;
    const qua = ds < homNay;
    o += `<button type="button" class="ol-d${ds === chon ? ' on' : ''}${ds === homNay ? ' nay' : ''}" ${qua ? 'disabled' : `onclick="chonNgayLich('${ds}')"`}>${d}</button>`;
  }
  const lui = _lichThang <= homNay.slice(0, 7);
  pop.innerHTML = `
<div class="ol-h">
  <button type="button" onclick="doiThangLich(-1)" ${lui ? 'disabled' : ''} aria-label="Tháng trước">${ic('left')}</button>
  <b>Tháng ${m}/${y}</b>
  <button type="button" onclick="doiThangLich(1)" aria-label="Tháng sau">${ic('right')}</button>
</div>
<div class="ol-g">${o}</div>`;
}
function chonNgayLich(ds) {
  document.getElementById('orderDate').value = ds;
  document.getElementById('omLich').style.display = 'none';
  dongBoNgayGiao();
}
// Bấm ra ngoài lịch thì đóng. Chặn lỗi "tự đóng khi bấm ‹ ›": nút vừa bấm bị vẽ lại
// (gỡ khỏi trang) → closest() trả null → tưởng bấm ra ngoài. Xem CLAUDE.md (bẫy popover).
document.addEventListener('click', e => {
  const pop = document.getElementById('omLich');
  if (!pop || pop.style.display === 'none' || !e.target.isConnected) return;
  if (!e.target.closest('.omx-lich-wrap')) pop.style.display = 'none';
});

// Ô không hợp lệ (vd email sai) nằm trong mục đang GẤP → trình duyệt chặn gửi nhưng không đưa
// khách tới ô đó được (ô bị ẩn) → khách bấm "Gửi đơn" mà không thấy gì xảy ra. Mở mục ra trước.
document.addEventListener('invalid', e => {
  const than = e.target && e.target.closest && e.target.closest('.omx-than');
  if (than && than.previousElementSibling) than.previousElementSibling.classList.add('open');
}, true);

// Nút −/+ của ô Số lượng. Giữ trong 1–99 để không có đơn 0 bó hay gõ nhầm 1000.
function stepQty(delta) {
  const el = document.getElementById('orderQty');
  if (!el) return;
  el.value = Math.min(99, Math.max(1, (parseInt(el.value, 10) || 1) + delta));
}

// Mở/đóng phần không bắt buộc của form đặt hoa (chỉ có tác dụng trên điện thoại)
function toggleOrderMore() {
  const box = document.getElementById('omMore');
  if (!box) return;
  const open = box.classList.toggle('open');
  box.querySelector('.om-more-btn')?.setAttribute('aria-expanded', String(open));
  if (open) box.querySelector('textarea')?.focus({ preventScroll: true });
}

function closeOrderModal() {
  document.getElementById('orderOverlay')?.classList.remove('open');
  unlockBodyScroll();
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
    if (t) t.innerHTML = ic('menu');
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
<div class="order-success"><div class="o-icon">${ic('check')}</div><h3>Đã nhận đơn của bạn!</h3></div>`;
    return;
  }

  const phone = document.getElementById('orderPhone').value.trim();
  const email = (document.getElementById('orderEmail')?.value || '').trim();

  // SĐT là đường shop gọi lại xác nhận — gõ thiếu/thừa số là mất đơn mà không ai biết.
  // Kiểm nới tay: bỏ dấu cách/chấm/gạch/ngoặc rồi mới xét, chấp cả 0… lẫn +84…
  const phoneDigits = normalizePhone(phone);
  if (!isValidPhone(phone)) {
    btn.disabled = false;
    btn.textContent = 'Gửi đơn';
    showMiniToast('Số điện thoại chưa đúng, bạn xem lại giúp nhé');
    focusOrderField('orderPhone');
    return;
  }

  // Email không bắt buộc — nhưng đã điền thì phải đúng định dạng
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    btn.disabled = false;
    btn.textContent = 'Gửi đơn';
    showMiniToast('Email chưa đúng định dạng, bạn xem lại giúp nhé');
    focusOrderField('orderEmail');
    return;
  }

  const tangKhac = document.querySelector('#omNhan .om-chip2.on')?.dataset.v === '1';
  const ghiChu = ghepGhiChuDon({
    nguoiNhan: tangKhac ? document.getElementById('orderRecvName').value : '',
    sdtNhan:   tangKhac ? document.getElementById('orderRecvPhone').value : '',
    gio:       document.getElementById('orderTime').value,
    ghiChu:    document.getElementById('orderNote').value,
  });

  const { data: maMoi, error } = await sb.rpc('place_order', {
    p_phone: phoneDigits,   // lưu dạng đã chuẩn hoá để sổ khách không bị trùng
    p_name: document.getElementById('orderName').value.trim(),
    p_address: document.getElementById('orderAddress').value.trim(),
    p_product_id: _orderProduct.id,
    p_product_name: _orderProduct.name,
    p_quantity: parseInt(document.getElementById('orderQty').value) || 1,
    p_delivery_date: document.getElementById('orderDate').value || null,
    p_message_card: document.getElementById('orderMessage').value.trim() || null,
    p_note: ghiChu || null,
    p_delivery_area: null,   // đã bỏ ô này ở cả web khách lẫn admin
    p_email: email || null,
  });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'Gửi đơn';
    // QUA_NHIEU_DON = database chống spam (supabase/15: 1 SĐT tối đa 3 đơn / 10 phút)
    showMiniToast(/QUA_NHIEU_DON/.test(error.message || '')
      ? 'Shop đã nhận mấy đơn liền từ số này rồi — bạn nhắn Zalo để shop hỗ trợ nhanh nhé.'
      : 'Có lỗi xảy ra, vui lòng thử lại hoặc nhắn Zalo.');
    return;
  }

  doLuong('generate_lead', { item_id: String(_orderProduct.id), item_name: _orderProduct.name });
  const zalo = zaloURL(contactInfo?.zalo || contactInfo?.phone);
  document.getElementById('orderModalBody').innerHTML = `
<div class="order-success">
  <div class="o-icon">${ic('check')}</div>
  <h3>Đã nhận đơn của bạn!</h3>
  <p class="os-txt">
    Shop sẽ gọi / nhắn Zalo số <strong>${esc(phone)}</strong> trong <strong>15–30 phút</strong> để xác nhận.
    Ảnh bó hoa sẽ gửi bạn duyệt trước khi giao.
    ${email ? `<br>Xác nhận đơn đã gửi tới <strong>${esc(email)}</strong>.` : ''}
  </p>
  ${maMoi ? `<div class="os-ma">Mã đơn: <b>${maDon(maMoi)}</b></div>` : ''}
  <div class="os-nut">
    <a href="${esc(zalo)}" target="_blank" class="btn btn-primary">${ic('chat')}Nhắn Zalo cho shop</a>
    <a href="san-pham" class="btn btn-outline">Xem thêm mẫu hoa</a>
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
    return `<div class="detail-img"><img ${srcNho(imgs[0], 1000)} alt="${esc(name)}"></div>`;
  }
  const slides = imgs.map(url => `<img ${srcNho(url, 1000)} alt="${esc(name)}">`).join('');
  const thumbs = imgs.map((url, i) =>
    `<img ${srcNho(url, 200)} class="carousel-thumb${i===0?' active':''}" onclick="_carGoTo(${i})" alt="${esc(name)} ${i+1}">`
  ).join('');
  return `
<div class="detail-carousel">
  <div class="carousel-main">
    <button type="button" class="carousel-arrow carousel-prev" onclick="_carMove(-1)" aria-label="Ảnh trước">‹</button>
    <div class="carousel-track" id="carouselTrack">${slides}</div>
    <button type="button" class="carousel-arrow carousel-next" onclick="_carMove(1)" aria-label="Ảnh sau">›</button>
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

  const [{ data: p }] = await Promise.all([
    sb.from('products').select('*').eq('id', id).single(),
    loadBst(),
  ]);
  if (!p) { content.innerHTML = '<div class="loading"><p>Sản phẩm không tồn tại.</p></div>'; return; }
  _prodCache[p.id] = { image: p.images?.[0] || p.image, price: p.price };   // cho header form đặt

  document.title = `${p.name} — Ler & Ther Blooming`;
  // Có thể chạy trước khi đo lường bật xong — doLuong tự xếp hàng chờ
  doLuong('view_item', {
    item_id: String(p.id), item_name: p.name,
    item_category: bstCuaMau(p.id).map(c => c.name).join(', '),
  });
  const _ogTitle = document.querySelector('meta[property="og:title"]');
  const _ogDesc  = document.querySelector('meta[property="og:description"]');
  const _ogImg   = document.querySelector('meta[property="og:image"]');
  if (_ogTitle) _ogTitle.content = `${p.name} — Ler & Ther Blooming`;
  if (_ogDesc)  _ogDesc.content  = (p.description || '').replace(/\s*\n\s*/g, ' · ');
  if (_ogImg && p.images?.length) _ogImg.content = p.images[0];
  else if (_ogImg && p.image)     _ogImg.content = p.image;

  const s = catStyle(p.category);
  const imgs = (p.images?.length ? p.images : null) || (p.image ? [p.image] : []);
  const imgSection = buildDetailImage(imgs, p.name, s);
  const cap = tachCaption(p.description);   // null = mô tả không theo khuôn → hiện chữ thường

  content.innerHTML = `
<div class="detail-wrap">
  ${imgSection}
  <div class="detail-info">
    <a href="san-pham" class="detail-back">← Quay lại sản phẩm</a>
    ${bstCuaMau(p.id).length
      ? `<div class="detail-bst">${bstCuaMau(p.id).map(c =>
          `<a href="san-pham?bst=${encodeURIComponent(c.slug || '')}">${esc(c.name)}</a>`).join('')}</div>`
      : ''}
    <h1 class="detail-name">${esc(p.name)}</h1>
    ${cap ? `<div class="detail-nick">“${esc(cap.bietDanh)}”</div>` : ''}
    <div class="detail-price">${esc(fmtPrice(p.price))}</div>
    ${cap ? `<div class="detail-cap">
      ${cap.thanhPhan.length ? `<div class="detail-tp">${cap.thanhPhan.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      ${cap.chuKhoa ? `<div class="detail-kw">${esc(cap.chuKhoa)}</div>` : ''}
    </div>` : `<p class="detail-desc">${esc(p.description)}</p>`}
    <div class="detail-cam">
      ${cap?.phuHop ? `<div>${ic('gift')}${esc(cap.phuHop)}</div>` : ''}
      ${(cap?.them || []).map(d => `<div>${ic('leaf')}${esc(d)}</div>`).join('')}
      <div>${ic('truck')}Giao nội thành miễn phí</div>
      <div>${ic('camera')}Gửi ảnh duyệt trước khi giao</div>
      <div>${ic('card')}COD hoặc chuyển khoản</div>
    </div>
    <!-- Máy tính: khối nút ngay dưới. Điện thoại: CSS ghim khối này xuống đáy màn hình -->
    <div class="detail-actions">
      <a href="#" class="btn btn-outline order-btn detail-zalo" data-product="${encodeURIComponent(p.name)}" aria-label="Hỏi qua Zalo">
        ${ic('chat')}<span>Hỏi qua Zalo</span>
      </a>
      <button type="button" class="btn btn-primary" onclick="openOrderModal(${p.id}, '${jsAttr(p.name)}')">
        Đặt mẫu này
      </button>
    </div>
  </div>
</div>`;

  wireOrderButtons();
  if (imgs.length > 1) _startCarousel(imgs);
  loadRelated(p.id);
}

// Gợi ý mẫu CÙNG bộ sưu tập. Mẫu chưa thuộc bộ nào (hoặc bộ chỉ có mình nó)
// thì lấy mẫu mới nhất — để mục này không bao giờ trống trơ.
async function loadRelated(excludeId) {
  const section = document.getElementById('relatedSection');
  const grid    = document.getElementById('relatedGrid');
  if (!section || !grid) return;

  await loadBst();
  const cung = [...new Set(bstCuaMau(excludeId).flatMap(c => bstMauIds(c.id)))]
    .filter(x => String(x) !== String(excludeId));

  let data = null;
  if (cung.length) {
    ({ data } = await sb.from('products').select('*').in('id', cung).limit(4));
  }
  if (!data?.length) {
    ({ data } = await sb.from('products').select('*')
      .neq('id', excludeId).order('order_index').limit(4));
  }
  if (!data?.length) return;

  grid.innerHTML = data.map(productCardHTML).join('');
  wireOrderButtons();
  staggerReveal(grid.querySelectorAll('.reveal'));
  initScrollReveal(grid);
  const h = section.querySelector('h2');
  if (h) h.textContent = cung.length ? 'Cùng bộ sưu tập' : 'Có thể bạn cũng thích';
  section.style.display = 'block';
}

// ─── Thanh tab dưới đáy cho khách (điện thoại) — cùng kiểu thanh tab của admin ──
// Trang chi tiết mẫu hoa KHÔNG có thanh này (đáy đã dành cho nút "Đặt mẫu này").
function veThanhTabKhach() {
  if (document.querySelector('.w-tabs') || document.getElementById('detailContent')) return;
  const ten = p => (p || '').split(/[?#]/)[0].split('/').pop().replace(/\.html$/, '') || 'index';
  const dang = ten(location.pathname);
  const muc = [['./', 'index', 'dash', 'Trang chủ'], ['san-pham', 'san-pham', 'bag', 'Sản phẩm'],
               ['khoanh-khac', 'khoanh-khac', 'img', 'Khoảnh khắc'], ['lien-he', 'lien-he', 'phone', 'Liên hệ']];
  document.body.insertAdjacentHTML('beforeend', `<nav class="w-tabs" aria-label="Chuyển trang nhanh">${
    muc.map(([href, key, i, nhan]) => `<a href="${href}" class="${key === dang ? 'on' : ''}">${ic(i)}<span>${nhan}</span></a>`).join('')}</nav>`);
  document.body.classList.add('co-w-tabs');
  const laO = el => el && el.matches && el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), textarea, select');
  document.addEventListener('focusin', e => { if (laO(e.target)) document.body.classList.add('dang-go'); });
  document.addEventListener('focusout', () => setTimeout(() => {
    if (!laO(document.activeElement)) document.body.classList.remove('dang-go');
  }, 80));
}

// ─── Init ─────────────────────────────────────────────────
function injectZaloIcons() {
  // Logo Zalo chính thức (images/zalo.svg)
  const img = '<img src="images/zalo.svg" alt="Zalo">';
  const ci = document.getElementById('zaloIcon'); if (ci) ci.innerHTML = img;
  const bi = document.querySelector('#zaloBtn .zi'); if (bi) bi.innerHTML = img;
  document.querySelectorAll('.zalo-float').forEach(fl => {
    const o = fl.querySelector('span:not(.zalo-label)');
    if (o) o.innerHTML = img;
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

// iOS: bàn phím mở làm vùng nhìn thấy co lại, nhưng lớp phủ position:fixed vẫn neo theo
// màn hình đầy đủ → nút gửi đơn nằm dưới bàn phím. Ghi vùng nhìn thấy THẬT vào biến CSS.
// --vvh/--vvtop ở đây CHỈ modal đọc (xem css/style.css), không dính chiều cao trang
// — nên web khách không bị lỗi khung như admin từng bị. Vẫn chặn ghi lặp cho đỡ giật:
// iOS bắn scroll mỗi frame, ghi biến CSS trên :root mỗi lần là bắt tính lại style cả trang.
function initViewportFix() {
  const vv = window.visualViewport;
  if (!vv) return;
  const r = document.documentElement.style;
  const setVar = (name, px) => {
    const v = Math.round(px) + 'px';
    if (r.getPropertyValue(name) !== v) r.setProperty(name, v);
  };
  const apply = () => {
    setVar('--vvh', vv.height);
    setVar('--vvtop', vv.offsetTop || 0);
  };
  vv.addEventListener('resize', apply);
  vv.addEventListener('scroll', apply);
  apply();
}

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  injectZaloIcons();
  primeHero();
  initBackToTop();
  initViewportFix();
  // Năm © tự cập nhật (khỏi lỗi thời)
  document.querySelectorAll('.footer-bottom').forEach(el => {
    el.textContent = el.textContent.replace(/©\s*\d{4}/, '© ' + new Date().getFullYear());
  });
  // Tải song song cho nhanh: contact chạy nền, nội dung chính không phải chờ
  // (ảnh phụ hero do loadContact gọi applyHeroSides xử lý)
  const contactReady = loadContact();
  loadHeroPriceHint();
  loadBoSuuTap();
  loadFeatured();
  loadProducts();
  loadGallery();
  veThanhTabKhach();
  loadTestimonials();
  loadProductDetail();
  initScrollReveal();
  await contactReady;
  initDoLuong(contactInfo);   // mã đo lường nằm trong contact
  loadBanner();          // cần dữ liệu contact
  wireOrderButtons();    // nối lại link Zalo sau khi contact sẵn sàng
});
