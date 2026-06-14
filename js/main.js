/* ─── Ler & Ther Blooming — main.js ─────────────────────── */

const SUPABASE_URL = 'https://oijcwborkebjpavzyisl.supabase.co'
const SUPABASE_KEY = 'sb_publishable_vDRAF-LBS3nOpw1GHBchvw_xYuMfdqP'
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

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
  <a href="san-pham-chi-tiet.html?id=${p.id}" class="product-img">${img}</a>
  <div class="product-info">
    <span class="product-cat">${p.category}</span>
    <div class="product-name">
      <a href="san-pham-chi-tiet.html?id=${p.id}" style="color:inherit">${p.name}</a>
    </div>
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

  const { data, error } = await sb.from('products').select('*').order('order_index');
  if (error || !data) {
    grid.innerHTML = '<div class="loading"><p>Không thể tải sản phẩm, vui lòng thử lại.</p></div>';
    return;
  }
  allProducts = data;
  renderProducts(allProducts, grid);
  initFilters();
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

  const { data } = await sb.from('products').select('*').eq('featured', true).order('order_index').limit(4);
  if (!data?.length) { grid.closest('section')?.remove(); return; }
  grid.innerHTML = data.map(productCardHTML).join('');
  wireOrderButtons();
}

// ─── Gallery ──────────────────────────────────────────────
async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const { data } = await sb.from('gallery').select('*').order('order_index');
  const photos = data || [];

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
  const { data } = await sb.from('contact').select('*').eq('id', 1).single();
  if (!data) return;
  contactInfo = data;

  setText('cPhone',   contactInfo.phone   || '—');
  setText('cAddress', contactInfo.address || '—');
  setText('cHours',   contactInfo.hours   || '—');

  setHref('zaloBtn', zaloURL(contactInfo.zalo || contactInfo.phone));
  setHref('callBtn', `tel:${clean(contactInfo.phone)}`);

  updateZaloFloat();

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
<div class="testimonial-card">
  <p class="testimonial-quote">${t.content}</p>
  <div class="testimonial-author">
    <span class="testimonial-name">${t.name}</span>
    ${t.context ? `<span class="testimonial-context">— ${t.context}</span>` : ''}
  </div>
</div>`).join('');
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

  const s = catStyle(p.category);
  const img = p.image
    ? `<img src="${p.image}" alt="${p.name}">`
    : `<div class="detail-img-ph" style="background:${s.bg}">${s.emoji}</div>`;

  const num = contactInfo?.zalo || contactInfo?.phone || '';
  const zaloHref = num ? zaloURL(num) : '#';

  content.innerHTML = `
<div class="detail-wrap">
  <div class="detail-img">${img}</div>
  <div class="detail-info">
    <a href="san-pham.html" class="detail-back">← Quay lại sản phẩm</a>
    <span class="detail-cat">${p.category}</span>
    <h1 class="detail-name">${p.name}</h1>
    <div class="detail-price">${p.price}</div>
    <p class="detail-desc">${p.description}</p>
    <div class="detail-actions">
      <a href="#" class="btn btn-orange order-btn" data-product="${encodeURIComponent(p.name)}" style="font-size:1rem;">
        📞 Đặt hoa qua Zalo
      </a>
      <a href="san-pham.html" class="btn btn-outline">Xem thêm sản phẩm</a>
    </div>
  </div>
</div>`;

  wireOrderButtons();
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
  section.style.display = 'block';
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  await loadContact();
  loadBanner();
  loadFeatured();
  loadProducts();
  loadGallery();
  loadTestimonials();
  loadProductDetail();
});
