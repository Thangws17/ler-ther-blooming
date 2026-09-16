"""Server chạy thử ở máy — bắt chước đúng cách GitHub Pages phục vụ web.

Dùng:  python serve.py          (cổng mặc định 8765)
       python serve.py 9000     (đổi cổng)

VÌ SAO KHÔNG DÙNG `python -m http.server` NỮA:
Web đã bỏ đuôi .html trong đường dẫn (/san-pham thay vì /san-pham.html).
GitHub Pages tự hiểu /san-pham là file san-pham.html, nhưng server có sẵn
của Python thì KHÔNG → chạy thử ở máy sẽ báo 404 khắp nơi dù web thật vẫn
chạy bình thường. File này thêm đúng 2 việc GitHub Pages làm:
  1. /san-pham  → trả về san-pham.html
  2. Không tìm thấy trang → trả về 404.html (thay vì trang lỗi trắng của Python)
Còn lại giữ nguyên như server gốc. Không cần cài thêm gì.
"""
import http.server
import os
import sys
from functools import partial
from urllib.parse import urlsplit

GOC = os.path.dirname(os.path.abspath(__file__))


class GiongGitHubPages(http.server.SimpleHTTPRequestHandler):
    def _duong_dan_that(self):
        """Đổi /san-pham → /san-pham.html nếu file đó có thật."""
        phan = urlsplit(self.path)
        p = phan.path
        if p.endswith('/') or os.path.splitext(p)[1]:
            return None                       # thư mục hoặc đã có đuôi → để nguyên
        if os.path.isfile(self.translate_path(p + '.html')):
            moi = p + '.html'
            return moi + ('?' + phan.query if phan.query else '')
        return None

    def _chuan_bi(self):
        moi = self._duong_dan_that()
        if moi:
            self.path = moi
            return True
        # Không có file, không có thư mục → trang 404 riêng của shop
        dich = self.translate_path(urlsplit(self.path).path)
        if not os.path.exists(dich):
            trang404 = os.path.join(GOC, '404.html')
            if os.path.isfile(trang404):
                with open(trang404, 'rb') as f:
                    noi_dung = f.read()
                self.send_response(404)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(noi_dung)))
                self.end_headers()
                if self.command != 'HEAD':
                    self.wfile.write(noi_dung)
                return False
        return True

    def do_GET(self):
        if self._chuan_bi():
            super().do_GET()

    def do_HEAD(self):
        if self._chuan_bi():
            super().do_HEAD()

    # Không cache khi chạy thử: sửa file xong F5 là thấy ngay
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    cong = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    xu_ly = partial(GiongGitHubPages, directory=GOC)
    # 0.0.0.0 để điện thoại cùng wifi vào được (xem serve.ps1)
    with http.server.ThreadingHTTPServer(('0.0.0.0', cong), xu_ly) as srv:
        print(f'Đang chạy: http://localhost:{cong}/   (Ctrl+C để dừng)')
        srv.serve_forever()
