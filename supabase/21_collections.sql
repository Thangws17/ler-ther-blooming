-- ════════════════════════════════════════════════════════════════
-- BỘ SƯU TẬP (BST) — thay danh mục ở phía khách xem web.
-- Chạy trong Supabase SQL editor. Chạy lại nhiều lần không lỗi.
--
-- Việc file này làm:
--   1. Tạo bảng collections (BST) + collection_products (1 sản phẩm nằm NHIỀU BST)
--   2. Chuyển 5 danh mục đang có thành 5 BST, giữ nguyên sản phẩm bên trong
--   3. Tự điền ảnh bìa = ảnh của mẫu đầu tiên trong BST (đổi lại được trong admin)
--   4. Khóa RLS: ai cũng đọc được, chỉ admin đã đăng nhập mới ghi được
--
-- KHÔNG xoá cột products.category và KHÔNG xoá bảng gallery_categories —
-- giữ làm đường lùi nếu cần quay về. Thư viện ảnh vẫn dùng danh mục cũ.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Bảng BST ──
create table if not exists collections (
  id          bigserial primary key,
  name        text not null,
  slug        text,
  emoji       text    default '🌸',
  tagline     text,
  cover_url   text,
  order_index int     default 0,
  active      boolean default true,
  start_date  date,
  end_date    date,
  created_at  timestamptz default now()
);

-- Chạy lại trên bảng đã có từ bản cũ: bổ sung cột thiếu
alter table collections add column if not exists slug        text;
alter table collections add column if not exists emoji       text    default '🌸';
alter table collections add column if not exists tagline     text;
alter table collections add column if not exists cover_url   text;
alter table collections add column if not exists order_index int     default 0;
alter table collections add column if not exists active      boolean default true;
alter table collections add column if not exists start_date  date;
alter table collections add column if not exists end_date    date;

-- Tên không được trùng (bỏ qua hoa/thường và khoảng trắng đầu/cuối)
create unique index if not exists collections_name_uniq on collections (lower(btrim(name)));

-- ── 2. Bảng nối: 1 sản phẩm nằm nhiều BST ──
create table if not exists collection_products (
  collection_id bigint not null references collections (id) on delete cascade,
  product_id    bigint not null references products (id)    on delete cascade,
  order_index   int default 0,
  primary key (collection_id, product_id)
);
create index if not exists collection_products_product_idx on collection_products (product_id);

-- ── 3. Hàm bỏ dấu tiếng Việt → đuôi link (slug) ──
-- "BST Trông Trăng" → "bst-trong-trang". Dùng cho link /san-pham?bst=bst-trong-trang
create or replace function slug_vi(txt text) returns text
language sql immutable as $$
  select nullif(
    btrim(
      regexp_replace(
        lower(translate(coalesce(txt, ''),
          'àáạảãâầấậẩẫăằắặẳẵèéẻẹẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẺẸẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
          'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydaaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd')),
        '[^a-z0-9]+', '-', 'g'),
      '-'),
    '')
$$;

-- Đuôi link không được trùng (BST chưa có đuôi thì bỏ qua)
create unique index if not exists collections_slug_uniq on collections (slug) where slug is not null;

-- ── 4. Chuyển danh mục đang có thành BST ──
-- Chỉ thêm danh mục nào chưa có BST trùng tên → chạy lại không nhân bản,
-- và không đạp lên BST anh đã tự tạo sau này.
insert into collections (name, emoji, order_index, active)
select btrim(g.name), coalesce(nullif(btrim(g.emoji), ''), '🌸'), coalesce(g.order_index, 0), true
from gallery_categories g
where btrim(coalesce(g.name, '')) <> ''
  and not exists (
    select 1 from collections c where lower(btrim(c.name)) = lower(btrim(g.name))
  );

-- Điền đuôi link cho BST nào còn trống
update collections set slug = slug_vi(name)
where coalesce(slug, '') = '' and slug_vi(name) is not null;

-- Hai BST trùng đuôi link → BST sinh sau gắn thêm số id cho khác nhau
update collections c set slug = c.slug || '-' || c.id
where exists (
  select 1 from collections o where o.slug = c.slug and o.id < c.id
);

-- BST nào vẫn chưa có đuôi (tên toàn emoji chẳng hạn) → lấy id làm đuôi
update collections set slug = 'bst-' || id where coalesce(slug, '') = '';

-- ── 5. Gán sản phẩm vào BST theo danh mục cũ ──
insert into collection_products (collection_id, product_id, order_index)
select c.id, p.id, coalesce(p.order_index, 0)
from products p
join collections c on lower(btrim(c.name)) = lower(btrim(p.category))
where btrim(coalesce(p.category, '')) <> ''
on conflict (collection_id, product_id) do nothing;

-- ── 6. Ảnh bìa mặc định = ảnh mẫu đầu tiên trong BST ──
-- Chỉ điền khi còn trống → không đạp lên ảnh anh tự chọn trong admin.
update collections c set cover_url = (
  select p.image
  from collection_products cp
  join products p on p.id = cp.product_id
  where cp.collection_id = c.id and btrim(coalesce(p.image, '')) <> ''
  order by cp.order_index, p.id
  limit 1
)
where btrim(coalesce(c.cover_url, '')) = '';

-- ── 7. RLS: public đọc, chỉ admin đăng nhập mới ghi ──
do $$
declare
  t   text;
  pol record;
  tables text[] := array['collections', 'collection_products'];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    for pol in
      select policyname from pg_policies where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
    execute format('create policy %I on public.%I for select using (true)',
                   'public read ' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)',
                   'admin write ' || t, t);
  end loop;
end $$;

-- ══ Kiểm tra sau khi chạy (tùy chọn) ══
-- select c.id, c.emoji, c.name, c.slug, c.active,
--        (select count(*) from collection_products x where x.collection_id = c.id) as so_mau,
--        case when btrim(coalesce(c.cover_url,'')) = '' then 'CHƯA CÓ ẢNH BÍA' else 'có ảnh' end as bia
-- from collections c order by c.order_index, c.id;
--
-- Mẫu hoa chưa thuộc BST nào (admin cũng cảnh báo chỗ này):
-- select p.id, p.name from products p
-- where not exists (select 1 from collection_products cp where cp.product_id = p.id);
