// ══════════════════════════════════════════════════════════════════
//  Tạo file Excel (.xlsx) THẬT ngay trong trình duyệt — không thư viện
//  ----------------------------------------------------------------
//  Dùng cho nút "Tải file sao lưu" trong admin.
//
//  VÌ SAO KHÔNG XUẤT CSV: Excel trên Windows tiếng Việt dùng dấu ";" để
//  tách cột, nên file CSV dấu "," mở ra dồn cả dòng vào một ô; thêm dòng
//  "sep=," thì Excel lại bỏ qua mã UTF-8 → tiếng Việt thành chữ lạ.
//  File .xlsx không dính cả hai lỗi đó, lại giữ được nhiều trang tính.
//
//  VÌ SAO KHÔNG DÙNG THƯ VIỆN (SheetJS…): dự án cố ý không thêm thư viện.
//  Một file .xlsx chỉ là file ZIP chứa vài file XML — đủ nhỏ để tự viết.
//
//  Cách dùng:
//    const bytes = taoXlsx([{
//      ten: 'Đơn hàng',
//      cot: [{ tieuDe: 'Mã đơn', kieu: 'chu', rong: 12 }, { tieuDe: 'Tổng', kieu: 'tien' }],
//      dong: [['#LT-0001', 350000], …]
//    }])
//    taiFile(bytes, 'sao-luu.xlsx')
//
//  kieu: 'chu' (chữ) | 'so' (số) | 'tien' (số có dấu chấm nghìn)
//        'ngay' (yyyy-mm-dd → ngày Excel) | 'ngaygio' (thời điểm ISO → ngày giờ Excel)
//  Ô null/undefined/'' để trống. Số không hợp lệ ở cột số thì ghi dạng chữ
//  (không bao giờ làm mất dữ liệu).
// ══════════════════════════════════════════════════════════════════

;(function () {
  // ── ZIP (chỉ lưu, không nén — file sao lưu nhỏ, đổi lại chắc chắn đúng) ──
  const BANG_CRC = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      t[n] = c >>> 0
    }
    return t
  })()

  function crc32(bytes) {
    let c = 0xFFFFFFFF
    for (let i = 0; i < bytes.length; i++) c = BANG_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)
    return (c ^ 0xFFFFFFFF) >>> 0
  }

  function taoZip(tapTin) {                      // tapTin: [{ ten, du_lieu: Uint8Array }]
    const ma = new TextEncoder()
    const phanDau = [], mucLuc = []
    let viTri = 0
    for (const f of tapTin) {
      const ten = ma.encode(f.ten)
      const d = f.du_lieu
      const crc = crc32(d)
      const dau = new DataView(new ArrayBuffer(30))
      dau.setUint32(0, 0x04034B50, true)          // chữ ký phần đầu tệp
      dau.setUint16(4, 20, true)                  // phiên bản cần để giải nén
      dau.setUint16(6, 0x0800, true)              // tên tệp mã UTF-8
      dau.setUint16(8, 0, true)                   // 0 = lưu thẳng, không nén
      dau.setUint16(10, 0, true); dau.setUint16(12, 0x21, true)   // giờ/ngày DOS (1980-01-01)
      dau.setUint32(14, crc, true)
      dau.setUint32(18, d.length, true); dau.setUint32(22, d.length, true)
      dau.setUint16(26, ten.length, true); dau.setUint16(28, 0, true)
      phanDau.push(new Uint8Array(dau.buffer), ten, d)

      const cd = new DataView(new ArrayBuffer(46))
      cd.setUint32(0, 0x02014B50, true)           // chữ ký mục lục
      cd.setUint16(4, 20, true); cd.setUint16(6, 20, true)
      cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true)
      cd.setUint16(12, 0, true); cd.setUint16(14, 0x21, true)
      cd.setUint32(16, crc, true)
      cd.setUint32(20, d.length, true); cd.setUint32(24, d.length, true)
      cd.setUint16(28, ten.length, true)
      cd.setUint32(42, viTri, true)               // vị trí phần đầu tệp trong file
      mucLuc.push(new Uint8Array(cd.buffer), ten)

      viTri += 30 + ten.length + d.length
    }
    const coMucLuc = mucLuc.reduce((s, b) => s + b.length, 0)
    const cuoi = new DataView(new ArrayBuffer(22))
    cuoi.setUint32(0, 0x06054B50, true)           // chữ ký kết thúc
    cuoi.setUint16(8, tapTin.length, true); cuoi.setUint16(10, tapTin.length, true)
    cuoi.setUint32(12, coMucLuc, true); cuoi.setUint32(16, viTri, true)

    const tatCa = [...phanDau, ...mucLuc, new Uint8Array(cuoi.buffer)]
    const kq = new Uint8Array(tatCa.reduce((s, b) => s + b.length, 0))
    let o = 0
    for (const b of tatCa) { kq.set(b, o); o += b.length }
    return kq
  }

  // ── XML ─────────────────────────────────────────────────────────
  // Bỏ ký tự điều khiển XML cấm (hay lẫn vào khi khách copy-paste ghi chú) —
  // chỉ cần MỘT ký tự này là Excel báo "file hỏng, không mở được".
  const xmlChu = v => String(v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const tenCot = i => {                           // 0 → A, 25 → Z, 26 → AA
    let s = ''
    for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s
    return s
  }

  // Excel đếm ngày từ 30/12/1899. Tính theo giờ UTC để không lệch múi giờ.
  const soNgayExcel = (y, m, d, gio = 0, phut = 0) =>
    (Date.UTC(y, m - 1, d, gio, phut) - Date.UTC(1899, 11, 30)) / 86400000

  // Kiểu dáng: 0 thường · 1 tiêu đề · 2 tiền · 3 ngày · 4 ngày giờ · 5 chữ xuống dòng
  const KIEU_O = { chu: 0, so: 0, tien: 2, ngay: 3, ngaygio: 4 }

  function oXml(v, kieu, ref) {
    if (v === null || v === undefined || v === '') return ''
    if (kieu === 'so' || kieu === 'tien') {
      const n = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(n)) return `<c r="${ref}" s="${KIEU_O[kieu]}"><v>${n}</v></c>`
    }
    if (kieu === 'ngay') {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v))
      if (m) return `<c r="${ref}" s="3"><v>${soNgayExcel(+m[1], +m[2], +m[3])}</v></c>`
    }
    if (kieu === 'ngaygio') {
      const t = new Date(v)
      if (!isNaN(t)) {
        // Giờ hiển thị theo giờ máy người xuất (Việt Nam), không phải giờ UTC
        const ng = soNgayExcel(t.getFullYear(), t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes())
        return `<c r="${ref}" s="4"><v>${ng}</v></c>`
      }
    }
    // Chữ (và mọi giá trị không khớp kiểu) — giữ nguyên, không bao giờ bỏ
    const chu = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlChu(chu)}</t></is></c>`
  }

  function trangTinhXml(tt) {
    const soCot = Math.max(1, tt.cot.length)
    const cuoi = tenCot(soCot - 1) + (tt.dong.length + 1)
    const doRong = tt.cot.map((c, i) =>
      `<col min="${i + 1}" max="${i + 1}" width="${c.rong || 14}" customWidth="1"/>`).join('')
    const tieuDe = '<row r="1">' + tt.cot.map((c, i) =>
      `<c r="${tenCot(i)}1" t="inlineStr" s="1"><is><t xml:space="preserve">${xmlChu(c.tieuDe)}</t></is></c>`).join('') + '</row>'
    const cacDong = tt.dong.map((d, r) =>
      `<row r="${r + 2}">` + tt.cot.map((c, i) => oXml(d[i], c.kieu, tenCot(i) + (r + 2))).join('') + '</row>'
    ).join('')
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<dimension ref="A1:${cuoi}"/>` +
      // Đóng băng dòng tiêu đề: cuộn xuống vẫn thấy tên cột
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      `<cols>${doRong}</cols>` +
      `<sheetData>${tieuDe}${cacDong}</sheetData>` +
      (tt.dong.length ? `<autoFilter ref="A1:${cuoi}"/>` : '') +
      '</worksheet>'
  }

  // Tên trang tính: tối đa 31 ký tự, không chứa : \ / ? * [ ], không trùng nhau
  function tenTrangHopLe(ds) {
    const daDung = new Set()
    return ds.map((t, i) => {
      let ten = String(t || ('Trang ' + (i + 1))).replace(/[:\\/?*[\]]/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, 31) || ('Trang ' + (i + 1))
      let goc = ten, k = 2
      while (daDung.has(ten.toLowerCase())) ten = (goc.slice(0, 28) + ' ' + k++).slice(0, 31)
      daDung.add(ten.toLowerCase())
      return ten
    })
  }

  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="3">' +
      '<numFmt numFmtId="164" formatCode="#,##0"/>' +
      '<numFmt numFmtId="165" formatCode="dd/mm/yyyy"/>' +
      '<numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm"/>' +
    '</numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF1B5E20"/><name val="Calibri"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFE8F5E9"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>'

  function taoXlsx(trangTinh) {
    if (!Array.isArray(trangTinh) || !trangTinh.length) throw new Error('taoXlsx: cần ít nhất một trang tính')
    const ten = tenTrangHopLe(trangTinh.map(t => t.ten))
    const ma = new TextEncoder()
    const tep = (duongDan, chu) => ({ ten: duongDan, du_lieu: ma.encode(chu) })

    const tapTin = [
      tep('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        trangTinh.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '</Types>'),
      tep('_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'),
      tep('xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets>' + ten.map((t, i) => `<sheet name="${xmlChu(t)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets>' +
        // Bộ lọc tự động cần tên định danh ẩn này, thiếu thì Excel mới báo cần sửa file
        '<definedNames>' + trangTinh.map((tt, i) => tt.dong.length
          ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlChu(ten[i].replace(/'/g, "''"))}'!$A$1:$${tenCot(Math.max(1, tt.cot.length) - 1)}$${tt.dong.length + 1}</definedName>`
          : '').join('') + '</definedNames>' +
        '</workbook>'),
      tep('xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        trangTinh.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${trangTinh.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        '</Relationships>'),
      tep('xl/styles.xml', STYLES),
      ...trangTinh.map((tt, i) => tep(`xl/worksheets/sheet${i + 1}.xml`, trangTinhXml(tt))),
    ]
    return taoZip(tapTin)
  }

  // Tải file về máy (máy tính: vào thư mục Tải xuống; iPhone: mở bảng Chia sẻ / Lưu vào Tệp)
  function taiFile(bytes, tenFile) {
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = tenFile
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  window.taoXlsx = taoXlsx
  window.taiFile = taiFile
  window._xlsxNoiBo = { crc32, tenCot, soNgayExcel, xmlChu, tenTrangHopLe }   // cho trang test
})()
