// ══════════════════════════════════════════════════════════════════
//  DATABASE GIẢ cho trang test giao diện — KHÔNG gọi Supabase thật.
//  giaLapSb(cửaSổ, bảng) thay sb.from / sb.rpc / sb.storage trong trang đang test
//  (admin hoặc web khách chạy trong iframe) bằng bản giả đọc từ `bảng`.
//  Mọi lệnh ghi (insert/update/delete/rpc) chỉ được GHI LẠI vào nhatKy, không đi đâu cả.
// ══════════════════════════════════════════════════════════════════
function giaLapSb(w, bang) {
  const nhatKy = []
  const sb = w.eval('sb')
  sb.from = ten => {
    let dl = (bang[ten] || []).slice(), dem = false, mot = false
    const q = {
      select(_, o) { if (o && o.head) dem = true; return q },
      eq(c, v) { dl = dl.filter(r => r[c] === v); return q },
      neq(c, v) { dl = dl.filter(r => r[c] !== v); return q },
      in(c, v) { dl = dl.filter(r => v.includes(r[c])); return q },
      gte(c, v) { dl = dl.filter(r => (r[c] ?? '') >= v); return q },
      gt(c, v) { dl = dl.filter(r => (r[c] ?? '') > v); return q },
      lte(c, v) { dl = dl.filter(r => (r[c] ?? '') <= v); return q },
      lt(c, v) { dl = dl.filter(r => (r[c] ?? '') < v); return q },
      ilike() { return q }, or() { return q }, not() { return q }, is() { return q },
      order() { return q }, limit(n) { dl = dl.slice(0, n); return q }, range(a, b) { q._tong = dl.length; dl = dl.slice(a, b + 1); return q },
      insert(v) { nhatKy.push({ ten, lenh: 'insert', v }); return q },
      update(v) { nhatKy.push({ ten, lenh: 'update', v }); return q },
      upsert(v) { nhatKy.push({ ten, lenh: 'upsert', v }); return q },
      delete() { nhatKy.push({ ten, lenh: 'delete' }); return q },
      maybeSingle() { mot = true; return q }, single() { mot = true; return q },
      then(res, rej) {
        const kq = dem ? { count: dl.length, data: null, error: null }
          : { data: mot ? (dl[0] || null) : dl, error: null, count: q._tong ?? dl.length }
        return Promise.resolve(kq).then(res, rej)
      },
    }
    return q
  }
  sb.rpc = (ten, thamSo) => { nhatKy.push({ ten, lenh: 'rpc', thamSo }); return Promise.resolve({ data: 999, error: null }) }
  sb.storage = { from: () => ({
    upload: () => Promise.resolve({ error: null }),
    remove: () => Promise.resolve({ error: null }),
    getPublicUrl: p => ({ data: { publicUrl: 'https://example.com/' + p } }),
  }) }
  return nhatKy
}

// Dữ liệu mẫu dùng chung (ngày tính theo hôm nay để test không "hết hạn")
function duLieuMau() {
  const ngay = n => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE')
  const IMG = 'https://oijcwborkebjpavzyisl.supabase.co/storage/v1/object/public/images/products/1784038764629_optw_p1_1.webp'
  const don = [
    [152, 'Chị Tuyền', '0908123456', 'Tulip', 1, 650000, 0, 'Q.1', 0, 'Mới', 'Người nhận: Lan · 0912345678\nGiờ giao: 16h\nKèm thiệp'],
    [151, 'Anh Minh', null, 'Hồng', 2, 390000, 30000, 'Thủ Đức', 0, 'Đã xác nhận', 'Giờ giao: 9h'],
    [150, 'Chị Lan', '0935551122', 'Mix Garden', 1, 320000, 20000, 'Q.7', 1, 'Đã xác nhận', ''],
    [149, 'Tuấn Nghĩa', '0911222333', 'Hồng chiết xạ', 3, 150000, 0, 'Q.3', 1, 'Mới', ''],
    [148, 'Anh Long', null, 'Lam tinh', 1, 250000, 0, 'Bình Thạnh', 2, 'Đang giao', ''],
    [147, 'Chị Hà', '0977000111', 'Hoa ly', 1, 350000, 0, 'Q.10', -2, 'Đang giao', ''],
    [146, 'Khách lẻ', null, 'Capuchino', 1, 300000, 0, 'Q.5', -5, 'Hoàn thành', ''],
    [145, 'Chị Mai', null, 'Mix', 1, 280000, 0, 'Q.2', -8, 'Giao thành công', ''],
    [144, 'Hủy thử', null, 'Hồng', 1, 100000, 0, 'Q.2', 0, 'Đã hủy', ''],
  ].map(([id, ten, sdt, sp, sl, gia, ship, dc, n, st, note]) => ({
    id, customer_name: ten, customers: sdt ? { name: ten, phone: sdt } : null, customer_phone: sdt, customer_id: sdt ? id : null,
    product_name: sp, product_id: 1, quantity: sl, unit_price: gia, shipping_fee: ship, total: gia * sl + ship,
    delivery_address: dc, status: st, image: IMG, delivery_date: ngay(n), note, message_card: id === 152 ? 'Chúc mừng sinh nhật' : '',
    created_at: new Date(Date.now() - 864e5).toISOString(),
  }))
  return {
    ngay,
    bang: {
      orders: don,
      expenses: [
        { id: 1, expense_date: ngay(-1), category: 'Hoa', item: 'Hồng đỏ', quantity: 50, unit_price: 6000, amount: 300000, note: '', image: '' },
        { id: 2, expense_date: ngay(-2), category: 'Phụ kiện', item: 'Giấy gói', quantity: 20, unit_price: 3000, amount: 60000, note: '', image: '' },
        { id: 3, expense_date: ngay(-3), category: 'Vận chuyển', item: 'Grab', quantity: null, unit_price: null, amount: 40000, note: '', image: '' },
      ],
      customers: [{ id: 152, name: 'Chị Tuyền', phone: '0908123456', address: 'Q.1', created_at: ngay(-30) }],
      products: [1, 2, 3, 4].map(i => ({ id: i, name: 'Mẫu ' + i, price: i === 1 ? '600,000đ' : 'Từ 2xx', image: IMG, order_index: i, featured: i < 3, category: '' })),
      collections: [
        { id: 6, name: 'BST Trông Trăng', slug: 'bst-trong-trang', emoji: '🌕', tagline: 'Trung thu', cover_url: IMG, order_index: 1, active: true, start_date: null, end_date: null },
        { id: 7, name: 'BST Tắt', slug: 'bst-tat', emoji: '✨', tagline: null, cover_url: null, order_index: 2, active: false, start_date: null, end_date: null },
      ],
      collection_products: [{ collection_id: 6, product_id: 1 }, { collection_id: 6, product_id: 2 }],
      gallery: [1, 2, 3, 4, 5].map(i => ({ id: 100 + i, url: IMG, caption: i === 1 ? 'Bó giao chị Lan' : '', category: i < 4 ? 'Hoa bó' : 'Sự kiện', order_index: i })),
      gallery_categories: [{ id: 1, name: 'Hoa bó', emoji: '🌹', order_index: 1 }, { id: 2, name: 'Sự kiện', emoji: '🎉', order_index: 2 }],
      materials: [{ id: 1, name: 'Hồng đỏ', category: 'Hoa', last_price: 6000 }, { id: 2, name: 'Giấy gói', category: 'Phụ kiện', last_price: 3000 }],
      testimonials: [{ id: 1, name: 'Chị A', content: 'Hoa đẹp', context: 'Sinh nhật', active: true, order_index: 1 }],
      changelog: [{ id: 1, release_date: ngay(-1), title: 'Bản thử', details: 'Dòng 1', note: '' }],
      contact: [{ id: 1, phone: '0352512391', zalo: '0352512391', address: 'Hà Nội' }],
      app_settings: [],
    },
  }
}
