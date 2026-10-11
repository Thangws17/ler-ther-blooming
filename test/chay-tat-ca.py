"""Chạy TẤT CẢ trang test bằng Chrome chạy ngầm rồi in bảng kết quả — không phải mở từng trang.

Dùng (phải đang chạy `python serve.py` ở cửa sổ khác):
    python test/chay-tat-ca.py                 # chạy cả 13 trang (~4–6 phút)
    python test/chay-tat-ca.py bo-suu-tap gia   # chỉ chạy trang có chữ "bo-suu-tap" hoặc "gia" trong tên

Kết quả: mỗi trang 1 dòng  ✓ (đạt) / ✕ (hỏng) + các ca hỏng in rõ "mong đợi / nhận được".
Thoát mã 0 = tất cả đạt, 1 = có trang hỏng (dùng được trong script khác).

VÌ SAO CHẠY KIỂU NÀY (xem CLAUDE.md mục "Lệnh thường dùng"):
- Chạy THỜI GIAN THẬT qua cổng gỡ lỗi của Chrome, không dùng --virtual-time-budget: trang
  test-bao-mat (ảnh tải lên) treo với thời gian ảo.
- Bật Emulation.setFocusEmulationEnabled: cửa sổ ngầm không có tiêu điểm → focus() không bắn
  sự kiện → test "bấm vào ô giá → hiện giá hay dùng" hỏng oan.
- Chỉ cần thư viện websocket-client (pip install websocket-client), không cần gì khác.
"""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

try:
    import websocket  # websocket-client
except ImportError:
    print('Thiếu thư viện: chạy  pip install websocket-client  rồi thử lại.')
    sys.exit(2)

MAY_CHU = 'http://localhost:8765'
CHO_TOI_DA = 300          # giây cho 1 trang (test-web-khach đọc Supabase thật, ~85 giây)

# Thứ tự: nhanh trước, chậm sau. Thêm trang test mới thì thêm tên vào đây.
TRANG = [
    'test-cu-phap',
    'test-gia-san-pham',
    'test-bo-suu-tap',
    'test-do-luong',
    'test-nguoi-nhan',
    'test-phan-trang-don',
    'test-sao-luu',
    'test-form-chi-phi',
    'test-khung-man-hinh',
    'test-admin-giao-dien',
    'test-bao-mat',
    'test-web-khach',
]

# Đọc kết quả trong trang: xong chưa, đạt không, dòng tổng kết, các ca hỏng
DOC_KET_QUA = r"""(() => {
  const out = document.getElementById('out')            // riêng test-cu-phap
  if (out && !document.getElementById('tongket')) {
    const t = out.textContent
    if (!t.includes('KET_QUA=')) return JSON.stringify({ xong: false })
    return JSON.stringify({ xong: true, dat: t.includes('KET_QUA=PASS'), tom: t.trim().split('\n').pop(),
      hong: t.split('\n').filter(d => d.startsWith('LOI')) })
  }
  const tk = document.getElementById('tongket')
  if (!tk || !/ok-box|fail-box/.test(tk.className)) return JSON.stringify({ xong: false })
  const hong = [...document.querySelectorAll('.ca.fail')].map(r => r.textContent.replace(/\s+\n/g, '\n').trim())
  return JSON.stringify({ xong: true, dat: tk.className.includes('ok-box'), tom: tk.textContent.trim(), hong })
})()"""


def kiem_file_md():
    """GitHub Pages chạy Jekyll: mọi file .md bị biến thành trang web và đi qua bộ dịch Liquid. Gặp `{{` hay `{%`
    là bộ dịch hiểu thành lệnh → cả lần đưa lên mạng HỎNG (web đứng ở bản cũ). Trả về danh sách 'file:dòng'."""
    goc = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    loi = []
    for thu_muc, con, tep in os.walk(goc):
        con[:] = [c for c in con if not c.startswith('.') and c not in ('demo', 'node_modules')]
        for t in tep:
            if not t.lower().endswith('.md'):
                continue
            duong = os.path.join(thu_muc, t)
            with open(duong, encoding='utf-8', errors='replace') as f:
                for i, dong in enumerate(f, 1):
                    if '{{' in dong or '{%' in dong:
                        loi.append(f'{os.path.relpath(duong, goc)}:{i}')
    return loi


def cong_trong():
    """Xin hệ điều hành 1 cổng đang trống. Cổng cố định (9333) từng làm 2 lượt chạy cùng lúc 'giành' trình duyệt
    của nhau → đọc nhầm kết quả trang này sang trang kia (11/10/2026)."""
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def tim_chrome():
    ung_vien = [
        os.path.expandvars(r'%ProgramFiles%\Google\Chrome\Application\chrome.exe'),
        os.path.expandvars(r'%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe'),
        os.path.expandvars(r'%LocalAppData%\Google\Chrome\Application\chrome.exe'),
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        shutil.which('google-chrome') or '', shutil.which('chromium') or '', shutil.which('chrome') or '',
    ]
    for p in ung_vien:
        if p and os.path.isfile(p):
            return p
    return None


class Tab:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=60)
        self.so = 0

    def goi(self, lenh, **tham_so):
        self.so += 1
        so = self.so
        self.ws.send(json.dumps({'id': so, 'method': lenh, 'params': tham_so}))
        while True:
            tin = json.loads(self.ws.recv())
            if tin.get('id') == so:
                return tin.get('result', {})

    def tinh(self, bieu_thuc):
        kq = self.goi('Runtime.evaluate', expression=bieu_thuc, returnByValue=True)
        return kq.get('result', {}).get('value')


def main():
    loc = sys.argv[1:]
    danh_sach = [t for t in TRANG if not loc or any(l in t for l in loc)]
    if not danh_sach:
        print('Không có trang test nào khớp:', ' '.join(loc))
        return 2

    try:
        urllib.request.urlopen(MAY_CHU + '/', timeout=5)
    except Exception:
        print('Chưa chạy server. Mở cửa sổ khác, chạy:  python serve.py   rồi thử lại.')
        return 2

    chrome = tim_chrome()
    if not chrome:
        print('Không tìm thấy Google Chrome trên máy.')
        return 2

    thu_muc = tempfile.mkdtemp(prefix='lt-test-')
    CONG = cong_trong()
    tien_trinh = subprocess.Popen([
        chrome, '--headless=new', f'--remote-debugging-port={CONG}', '--remote-allow-origins=*',
        f'--user-data-dir={thu_muc}', '--window-size=1400,1000', '--no-first-run',
        '--no-default-browser-check', 'about:blank',
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ket_qua = []
    try:
        ws_url = None
        for _ in range(50):
            try:
                ds = json.load(urllib.request.urlopen(f'http://127.0.0.1:{CONG}/json', timeout=2))
                ws_url = next(t['webSocketDebuggerUrl'] for t in ds if t.get('type') == 'page')
                break
            except Exception:
                time.sleep(0.3)
        if not ws_url:
            print('Không mở được Chrome chạy ngầm.')
            return 2
        tab = Tab(ws_url)
        tab.goi('Page.enable')
        tab.goi('Runtime.enable')
        tab.goi('Emulation.setFocusEmulationEnabled', enabled=True)

        for ten in danh_sach:
            bat_dau = time.time()
            if sys.stdout.isatty():
                print(f'… {ten:<24}', end='', flush=True)     # dòng chờ, bị ghi đè khi xong
            tab.goi('Page.navigate', url=f'{MAY_CHU}/test/{ten}.html?t={int(bat_dau)}')
            kq = None
            while time.time() - bat_dau < CHO_TOI_DA:
                time.sleep(1)
                try:
                    gia_tri = tab.tinh(DOC_KET_QUA)
                    kq = json.loads(gia_tri) if gia_tri else None
                except Exception:
                    kq = None
                if kq and kq.get('xong'):
                    break
            giay = int(time.time() - bat_dau)
            if not kq or not kq.get('xong'):
                kq = {'xong': False, 'dat': False, 'tom': f'QUÁ GIỜ (> {CHO_TOI_DA} giây, trang không tự tổng kết)', 'hong': []}
            dau = '✓' if kq['dat'] else '✕'
            print(f'\r{dau} {ten:<24} {giay:>4}s  {kq["tom"].splitlines()[0][:110]}', flush=True)
            for h in kq.get('hong', [])[:15]:
                print('      - ' + h.replace('\n', '\n        ')[:600])
            ket_qua.append((ten, kq['dat']))
    finally:
        tien_trinh.terminate()
        try:
            tien_trinh.wait(10)
        except Exception:
            tien_trinh.kill()
        shutil.rmtree(thu_muc, ignore_errors=True)

    # Không cần trình duyệt: file .md không được có ký hiệu làm hỏng bước đưa lên GitHub Pages
    md_loi = kiem_file_md()
    print(('✕' if md_loi else '✓') + f' {"kiem-file-md":<24}       ' +
          ('file .md có ký hiệu "{{" hoặc "{%" → GitHub Pages sẽ HỎNG khi đưa lên: ' + ', '.join(md_loi) if md_loi
           else 'các file .md không có ký hiệu làm hỏng GitHub Pages'))
    ket_qua.append(('kiem-file-md', not md_loi))

    so_hong = sum(1 for _, dat in ket_qua if not dat)
    print()
    print(f'TỔNG KẾT: {len(ket_qua) - so_hong}/{len(ket_qua)} mục đạt' + (f' — {so_hong} mục HỎNG, ĐỪNG đưa lên mạng' if so_hong else ' — tất cả đạt'))
    return 1 if so_hong else 0


if __name__ == '__main__':
    sys.exit(main())
