/* ─── Ler & Ther Blooming — main.js ─────────────────────── */

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

  // Mark active link based on filename
  const page = location.pathname.split('/').pop() || 'index.html';
  links.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ─── Category visual styles ───────────────────────────────
const CAT = {
  'Hoa bó'    : { bg:'linear-gradient(135deg,#FF8A80,#F06292)', emoji:'🌹' },
  'Giỏ hoa'   : { bg:'linear-gradient(135deg,#FFB74D,#FF7043)', emoji:'🌻' },
  'Hoa để bàn': { bg:'linear-gradient(135deg,#CE93D8,#AB47BC)', emoji:'💐' },
  'Hoa cưới'  : { bg:'linear-gradient(135deg,#FFF176,#FFD54F)', emoji:'👰' },
};
const CAT_DEFAULT = { bg:'linear-gradient(135deg,#A5D6A7,#4CAF50)', emoji:'🌸' };

function catStyle(cat) { return CAT[cat] || CAT_DEFAULT; }

// ─── Build product card HTML ──────────────────────────────
function productCardHTML(p) {
  const s = catStyle(p.category);
  const img = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : `<div class="product-img-ph" style="background:${s.bg}">${s.emoji}</div>`;
  const productNameEnc = encodeURIComponent(p.name);
  return `
<div class="product-card" data-category="${p.category}">
  <div class="product-img">${img}</div>
  <div class="product-info">
    <span class="product-cat">${p.category}</span>
    <div class="product-name">${p.name}</div>
    <div class="product-desc">${p.description}</div>
    <div class="product-footer">
      <span class="product-price">${p.price}</span>
      <a class="product-btn order-btn" href="#" data-product="${productNameEnc}" target="_blank">
        📞 Đặt hoa
      </a>
    </div>
  </div>
</div>`;
}

// ─── Products page ────────────────────────────────────────
let allProducts = [];

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading"><div class="l-icon">🌸</div><p>Đang tải sản phẩm…</p></div>';

  try {
    const res  = await fetch('./data/products.json');
    const data = await res.json();
    allProducts = data.items || [];
    renderProducts(allProducts, grid);
    initFilters();
  } catch {
    grid.innerHTML = '<div class="loading"><p>Không thể tải sản phẩm, vui lòng thử lại.</p></div>';
  }
}

function renderProducts(list, grid) {
  if (!list.length) {
    grid.innerHTML = '<div class="loading"><div class="l-icon">🌷</div><p>Chưa có sản phẩm trong mục này.</p></div>';
    return;
  }
  grid.innerHTML = list.map(productCardHTML).join('');
  wireOrderButtons();
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

// ─── Featured products (home page) ───────────────────────
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  try {
    const res  = await fetch('./data/products.json');
    const data = await res.json();
    const list = (data.items || []).filter(p => p.featured).slice(0, 4);
    if (!list.length) { grid.closest('section')?.remove(); return; }
    grid.innerHTML = list.map(productCardHTML).join('');
    wireOrderButtons();
  } catch {
    grid.closest('section')?.remove();
  }
}

// ─── Gallery ──────────────────────────────────────────────
async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  try {
    const res   = await fetch('./data/gallery.json');
    const data  = await res.json();
    const photos = data.photos || [];

    if (!photos.length) {
      grid.innerHTML = `
<div class="gallery-empty">
  <div class="e-icon">📷</div>
  <p>Album ảnh đang được cập nhật.<br>Quay lại sớm nhé!</p>
</div>`;
      return;
    }

    grid.innerHTML = photos.map((ph, i) => `
<div class="gallery-item" onclick="openLightbox('${ph.url}','${(ph.caption||'').replace(/'/g,"\\'")}')">
  <img src="${ph.url}" alt="${ph.caption || 'Ảnh hoa ' + (i+1)}" loading="lazy">
</div>`).join('');

  } catch {
    grid.innerHTML = '<div class="loading"><p>Không thể tải gallery.</p></div>';
  }
}

function openLightbox(url, caption) {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;' +
    'align-items:center;justify-content:center;flex-direction:column;gap:16px;' +
    'cursor:pointer;padding:20px;';
  el.innerHTML =
    `<img src="${url}" style="max-width:90vw;max-height:80vh;border-radius:12px;object-fit:contain;" alt="${caption}">` +
    (caption ? `<p style="color:#fff;font-family:Nunito,sans-serif;font-size:1.1rem;">${caption}</p>` : '') +
    `<p style="color:rgba(255,255,255,.45);font-size:.85rem;">Nhấn bất kỳ đâu để đóng</p>`;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
}

// ─── Contact ──────────────────────────────────────────────
let contactInfo = null;

async function loadContact() {
  try {
    const res = await fetch('./data/contact.json');
    contactInfo = await res.json();
  } catch { return; }

  // contact page fields
  setText('cPhone',   contactInfo.phone   || '—');
  setText('cAddress', contactInfo.address || '—');
  setText('cHours',   contactInfo.hours   || '—');

  // contact page buttons
  setHref('zaloBtn', zaloURL(contactInfo.zalo || contactInfo.phone));
  setHref('callBtn', `tel:${clean(contactInfo.phone)}`);

  // float button
  updateZaloFloat();

  // social links in footer
  if (contactInfo.facebook) {
    const fb = document.getElementById('fbLink');
    if (fb) { fb.href = contactInfo.facebook; fb.style.display = 'inline'; }
  }
  if (contactInfo.instagram) {
    const ig = document.getElementById('igLink');
    if (ig) { ig.href = contactInfo.instagram; ig.style.display = 'inline'; }
  }
}

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
    btn.href = num ? zaloURL(num) : '#';
    if (num) btn.target = '_blank';
  });
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  await loadContact();   // load contact first so buttons work
  loadFeatured();
  loadProducts();
  loadGallery();
});
