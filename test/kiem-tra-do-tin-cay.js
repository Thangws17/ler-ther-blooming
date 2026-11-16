// Chạy cùng các hàm thật trong admin, dữ liệu chỉ ở bộ nhớ; dùng được trên Node và trình duyệt.
async function kiemTraDoTinCay(admin, sql15, sql35) {
  const results = []
  async function test(name, fn) {
    try { await fn(); results.push({ name, ok: true }) }
    catch (e) { results.push({ name, ok: false, error: e.message }) }
  }
  function eq(a, b) {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`Mong ${JSON.stringify(b)}, nhận ${JSON.stringify(a)}`)
  }
  function source(name) {
    const start = admin.search(new RegExp('(?:async )?function ' + name + '\\('))
    const end = admin.indexOf('\n}', start)
    if (start < 0 || end < 0) throw new Error('Thiếu hàm ' + name)
    return admin.slice(start, end + 2)
  }
  function load(name, deps) {
    return new Function(...Object.keys(deps), source(name) + '\nreturn ' + name)(...Object.values(deps))
  }
  function mockDb(rows, fail = () => null) {
    const calls = []
    return { calls, from(table) {
      let op = 'read', value, filters = [], selected = false, single = false
      const q = {
        select() { selected = true; return q },
        eq(k, v) { filters.push(r => r[k] === v); return q },
        update(v) { op = 'update'; value = v; return q },
        insert(v) { op = 'insert'; value = v; return q },
        delete() { op = 'delete'; return q },
        maybeSingle() { single = 'maybe'; return q },
        single() { single = true; return q },
        then(resolve, reject) {
          calls.push({ table, op, value, selected })
          const failure = fail(table, op)
          if (failure) return Promise.resolve(failure).then(resolve, reject)
          const all = rows[table] || [], hits = all.filter(r => filters.every(f => f(r)))
          let data = hits
          if (op === 'insert') { data = [{ id: 999, ...value }]; all.push(...data) }
          if (op === 'update') hits.forEach(r => Object.assign(r, value))
          if (op === 'delete') rows[table] = all.filter(r => !hits.includes(r))
          if (single === true && data.length !== 1) return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }).then(resolve, reject)
          return Promise.resolve({ data: single ? data[0] || null : data, error: null, count: hits.length }).then(resolve, reject)
        },
      }
      return q
    } }
  }
  const linked = { customers: [{ id: 7, name: 'Khách thử', phone: '0900000001' }] }
  const sb = mockDb(linked)
  const sync = load('oeSyncCustomer', { sb })
  await test('Sửa SĐT vẫn cập nhật khách dùng chung, không tạo bản sao mỗi đơn', async () => {
    eq(await sync(7, 'Khách thử', '0900000002'), { customerId: 7 })
    eq(linked.customers, [{ id: 7, name: 'Khách thử', phone: '0900000002' }])
  })
  await test('Đơn cũ hiện số mới trong sổ khách, số dự phòng chỉ dùng khi khách bị xoá', () => {
    const line = admin.match(/^const orderCustomerPhone = (.+)$/m)
    const phone = new Function('esc', 'return ' + line[1])(s => s)
    eq(phone({ customers: linked.customers[0], customer_phone: '0900000001' }), '0900000002')
    eq(phone({ customers: null, customer_phone: '0900000001' }), '0900000001')
  })
  await test('SĐT đã có: ghép đúng khách, không tạo khách trùng', async () => {
    eq(await sync(null, 'Tên sửa', '0900000002'), { customerId: 7 })
    eq(linked.customers.length, 1)
  })
  await test('Tra khách lỗi: dừng, không ghi tiếp bằng kết quả trống', async () => {
    const db = mockDb({}, () => ({ data: null, error: { message: 'Mất mạng' } }))
    eq((await load('oeSyncCustomer', { sb: db })(7, 'Tên', '0900000002')).error, 'Mất mạng')
    eq(db.calls.map(c => c.op), ['read'])
  })
  for (const phone of ['', '0900000002']) {
    await test('Cập nhật khách 0 dòng phải báo lỗi, kể cả ô số ' + (phone ? 'có số' : 'trống'), async () => {
      const db = mockDb({ customers: [] })
      const result = await load('oeSyncCustomer', { sb: db })(7, 'Tên', phone)
      eq(!!result.error, true)
      eq(result.error.includes('phiên đăng nhập'), true)   // câu dễ hiểu, không phải tiếng Anh kỹ thuật
    })
  }
  function setup(extra = {}) {
    const toasts = [], nodes = {}
    const deps = {
      showToast: (...args) => toasts.push(args),
      document: { getElementById(id) { return nodes[id] ||= { value: '', checked: false } } },
      isValidPhone: () => true, normalizePhone: s => s,
      closeCustomerModal() { throw new Error('Không được đóng form khi chưa lưu') },
      loadCustomers() { throw new Error('Không được báo thành công khi chưa lưu') },
      ...extra,
    }
    deps.ghiDb = load('ghiDb', deps)
    return { deps, toasts, nodes }
  }
  await test('Lưu khách 0 dòng: báo hết phiên và giữ form', async () => {
    const db = mockDb({ customers: [] })
    const { deps, toasts } = setup({ sb: db })
    deps.document.getElementById('cuId').value = '7'
    await load('saveCustomer', deps)({ preventDefault() {} })
    eq(toasts.length, 1); eq(toasts[0][1], 'error')
    eq(db.calls[0].selected, true)
  })
  for (const failure of [{ data: [], error: null }, { data: null, error: { message: 'Mất mạng' } }]) {
    await test('Lưu liên hệ thất bại: không đổi tài khoản trong bộ nhớ hay xoá dấu chưa lưu (' + (failure.error ? 'lỗi' : '0 dòng') + ')', async () => {
      const db = mockDb({}, () => failure)
      const { deps, toasts } = setup({
        sb: db, FormData: class { forEach(fn) { fn('0900000001', 'phone'); fn('970436', 'ck_ngan_hang'); fn('12345678', 'ck_so_tk') } },
        MA_GA4: /^G-[A-Z0-9]+$/, MA_CLARITY: /^[a-z0-9]+$/, noAccent: s => s || '',
        _contactCot: null, _ckGoc: 'old', ckCua: () => 'new', hoiMatKhau: async () => true,
        ctBoDanhDau() { throw new Error('Mất dấu chưa lưu') },
        taiKhoanCk() { throw new Error('Đổi cache trước khi lưu') },
      })
      await load('saveContact', deps)({ preventDefault() {}, target: {} })
      eq(toasts.length, 1); eq(toasts[0][1], 'error')
      eq(db.calls[0].selected, true)
    })
  }
  await test('Lưu khách thành công vẫn đóng form và tải lại danh sách', async () => {
    const rows = { customers: [{ id: 7, name: 'Cũ', phone: '0900000001' }] }, db = mockDb(rows)
    let closed = 0, loaded = 0
    const { deps, toasts } = setup({ sb: db, closeCustomerModal() { closed++ }, loadCustomers() { loaded++ } })
    deps.document.getElementById('cuId').value = '7'
    deps.document.getElementById('cuName').value = 'Tên mới'
    deps.document.getElementById('cuPhone').value = '0900000002'
    await load('saveCustomer', deps)({ preventDefault() {} })
    eq(rows.customers[0].phone, '0900000002'); eq(closed, 1); eq(loaded, 1)
    eq(toasts[0][0], 'Đã cập nhật khách!')
  })
  await test('Xoá khách: không xoá nếu bước giữ SĐT trên đơn thất bại', async () => {
    const db = mockDb({ orders: [{ id: 1, customer_id: 7 }] }, (t, op) => op === 'update' ? { data: [], error: null } : null)
    const { deps, toasts } = setup({ sb: db, customers: [{ id: 7, name: 'Thử', phone: '0900000002' }], askConfirm: async () => true })
    await load('deleteCustomer', deps)(7)
    eq(db.calls.some(c => c.op === 'delete'), false)
    eq(toasts[0][1], 'error')
  })
  await test('Xoá khách 0 dòng: không báo đã xoá', async () => {
    const db = mockDb({ orders: [], customers: [] })
    const { deps, toasts } = setup({ sb: db, customers: [{ id: 7, name: 'Thử' }], askConfirm: async () => true })
    await load('deleteCustomer', deps)(7)
    eq(toasts.length, 1); eq(toasts[0][1], 'error')
  })
  await test('SQL: bản cập nhật 35 trùng hàm gốc 15', () => {
    function body(s) {
      const start = s.indexOf('create or replace function place_order(')
      const end = s.indexOf('to anon, authenticated;', start)
      if (start < 0 || end < 0) throw new Error('Thiếu hàm hoặc quyền gọi')
      return s.slice(start, end).replace(/\r\n/g, '\n')
    }
    eq(body(sql35), body(sql15))
  })
  await test('SQL: đặc quyền theo danh sách shop, khoá trước khi đếm đơn (kiểm mã nguồn)', () => {
    eq(sql35.includes('v_admin boolean := public.la_quan_tri()'), true)
    eq(sql35.includes("using errcode = '42501'"), true)
    const lock = sql35.indexOf('perform pg_advisory_xact_lock(')
    eq(lock > 0 && lock < sql35.indexOf('if not v_admin then'), true)
    eq(sql35.includes('on conflict (phone) do update'), true)
  })
  return results
}
if (typeof module !== 'undefined') module.exports = kiemTraDoTinCay
