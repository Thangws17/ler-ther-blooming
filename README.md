# 🌸 Ler & Ther Blooming

Website bán hoa **và** trang quản lý đơn hàng của shop hoa Ler & Ther Blooming (2 người, bán thời gian).

- 🌐 Web khách: <https://lertherblooming.vn/>
- 🔐 Trang quản lý: <https://lertherblooming.vn/admin/> (đăng nhập bằng tài khoản quản trị)

> **Người mới?** Bắt đầu ở **[huong-dan/00-bat-dau-tu-day.md](huong-dan/00-bat-dau-tu-day.md)**. Không cần biết code,
> khoảng 10 phút là nắm được dự án.

## Dự án gồm gì

| Phần | Công nghệ | Ghi chú |
|---|---|---|
| Web khách: 7 trang (`index.html`, `san-pham.html`, …) | HTML / CSS / JS thuần, **không framework, không build** | Toàn bộ cách chạy ở `js/main.js` |
| Trang quản lý | 1 file `admin/index.html` | Có **mục lục** ở đầu file |
| Dữ liệu, ảnh, đăng nhập, email tự động | [Supabase](https://supabase.com) (gói miễn phí) + Brevo | File dựng kho: `supabase/` ([mục lục](supabase/README.md)) |
| Nơi đặt web | GitHub Pages, tên miền ở PA Việt Nam | `git push` lên nhánh `main` → khoảng 1 phút sau web tự cập nhật |

Phần lớn đơn do **shop tự nhập trong admin** (khách chốt qua Facebook/Zalo). Form đặt hoa trên web là nguồn phụ.
Vì vậy sửa gì liên quan tới đơn hàng thì **sửa cả 2 bên**.

## Chạy thử và kiểm tra

Chỉ cần Python, không phải cài gì thêm:

```bash
python serve.py                # web: http://localhost:8765/   admin: http://localhost:8765/admin/
python test/chay-tat-ca.py     # (cửa sổ khác) chạy 12 trang kiểm tra tự động, phải "tất cả đạt" mới đưa lên mạng
```

Hoặc mở <http://localhost:8765/test/> rồi bấm **Chạy tất cả**. Các trang kiểm tra dùng **dữ liệu giả**, không đụng đơn thật.
⚠️ Bản chạy thử ở máy vẫn dùng **dữ liệu thật**, bấm xoá trong admin là xoá thật.

## Tài liệu

| Muốn biết… | Đọc |
|---|---|
| Dự án là gì, gồm những phần nào | [huong-dan/00-bat-dau-tu-day.md](huong-dan/00-bat-dau-tu-day.md) |
| File / thư mục nào làm gì, file nào **đừng xoá** | [huong-dan/01-ban-do-thu-muc.md](huong-dan/01-ban-do-thu-muc.md) |
| Chạy thử, đưa lên mạng, chạy SQL, sao lưu | [huong-dan/02-viec-hay-lam.md](huong-dan/02-viec-hay-lam.md) |
| Web lỗi / mail không tới / không đăng nhập được | [huong-dan/03-khi-co-su-co.md](huong-dan/03-khi-co-su-co.md) |
| Các bảng dữ liệu, vòng đời đơn hàng | [huong-dan/04-du-lieu.md](huong-dan/04-du-lieu.md) |
| Nghĩa của từ kỹ thuật | [huong-dan/05-tu-dien.md](huong-dan/05-tu-dien.md) |
| Những điều shop đã quyết và vì sao | [huong-dan/06-quyet-dinh-da-chot.md](huong-dan/06-quyet-dinh-da-chot.md) |
| Ghi chú kỹ thuật + mọi lỗi đã gặp (cho người sửa code) | [huong-dan/ky-thuat/](huong-dan/ky-thuat/) |
| Quy ước cho Claude Code | [CLAUDE.md](CLAUDE.md) |

## Bảo mật (tóm tắt)

Khoá Supabase trong code là **khoá công khai**, cố ý để vậy: ai cũng chỉ **đọc** được dữ liệu công khai (mẫu hoa, ảnh).
Xem đơn, sổ khách hay sửa bất cứ thứ gì đều phải đăng nhập bằng tài khoản có trong bảng `quan_tri`
([supabase/24_chi_quan_tri.sql](supabase/24_chi_quan_tri.sql)). Trang `/test/` có bài kiểm thử nhồi mã độc vào mọi ô dữ liệu.
