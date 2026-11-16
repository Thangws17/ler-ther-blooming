// ══════════════════════════════════════════════════════════════════
//  DỮ LIỆU XẤU NHẤT cho web khách (16/11/2026, skill break-ui) — chỉ dùng qua test/xem-web.html?du=xau.
//  Dữ liệu vẫn đọc THẬT từ database (chỉ đọc), rồi "làm xấu" vài dòng đầu NGAY trên đường về, trước khi trang vẽ:
//  tên mẫu dài, giá dạng chữ dài, giá 9 chữ số, mẫu không ảnh, mô tả dài, tên/câu giới thiệu BST dài, chú thích ảnh dài.
//  Nạp NGAY SAU js/main.js (cùng defer) → chạy trước khi các loadX() hỏi dữ liệu. Không ghi gì lên database.
// ══════════════════════════════════════════════════════════════════
;(function () {
  if (typeof sb === 'undefined') return
  const SP = [
    p => Object.assign(p, { name: 'Bó hồng Ecuador đỏ 99 bông mix baby trắng – giấy Hàn cao cấp, kèm thiệp viết tay và hộp quà (size XL)',
      price: 'Từ 1.250.000đ – 3.500.000đ (tuỳ size, inbox để báo giá)' }),
    p => Object.assign(p, { name: 'Lan', price: '99000000' }),
    p => Object.assign(p, { name: 'Bó-hồng-Ecuador-99-bông-mix-baby-trắng-giấy-Hàn', price: '' }),
    p => Object.assign(p, { image: null, images: [] }),
  ]
  const MO_TA = '“Lời thương cô đọng trong một bó hoa thật to”\n' + 'Hồng Ecuador đỏ · baby trắng · lá bạc · '.repeat(6) +
    '\nSang trọng — tinh tế — nhiều tình cảm — bền lâu — thơm nhẹ.\nPhù hợp tặng người thương, sinh nhật, kỷ niệm ngày cưới, khai trương, tân gia, tốt nghiệp, 20/10, 8/3, 14/2, Giáng sinh và mọi dịp bạn muốn nói lời cảm ơn.\nHoa có đặt theo size'
  function lamXau(bang, dl) {
    const ds = Array.isArray(dl) ? dl : dl ? [dl] : []
    if (bang === 'products') {
      if (!Array.isArray(dl)) { SP[0](ds[0] || {}); if (ds[0]) ds[0].description = MO_TA }   // trang chi tiết: 1 mẫu
      else ds.slice(0, SP.length).forEach((p, i) => SP[i](p))
    }
    if (bang === 'collections' && ds[0]) Object.assign(ds[0], { name: 'BST Mùa Cưới Thu Đông – Những Bó Hoa Cô Dâu Đẹp Nhất',
      tagline: 'Cho ngày trọng đại của bạn: hoa cô dâu, hoa cài áo chú rể, hoa bàn tiệc, cổng hoa — đặt trước ít nhất 7 ngày để shop chuẩn bị hoa nhập' })
    if (bang === 'gallery') ds.forEach((g, i) => { if (i === 0) g.caption = 'Bó hồng giao chị Phương Thảo nhân dịp kỷ niệm 10 năm ngày cưới — khách khen hoa tươi lâu 🌸'; if (i === 1) g.caption = 'Hoa' })
    return dl
  }
  const goc = sb.from.bind(sb)
  sb.from = function (bang) {
    const q = goc(bang), thenGoc = q.then.bind(q)
    q.then = (ok, loi) => thenGoc(kq => (kq && kq.data ? { ...kq, data: lamXau(bang, kq.data) } : kq)).then(ok, loi)
    return q
  }
  document.documentElement.dataset.duLieu = 'xau'
})()
