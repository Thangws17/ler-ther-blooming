-- KIỂM HÀNH VI place_order: chỉ chạy trên DATABASE THỬ NGHIỆM đã có SQL 35.
-- Chạy CẢ file trong SQL Editor. Có DELETE để cô lập quota; cuối file ROLLBACK.
-- Không chạy trên database shop: ngoài khoá dữ liệu, sequence id vẫn tăng dù rollback.
-- pg_net chỉ gửi sau COMMIT; ROLLBACK huỷ các email do test tạo ra.
-- Cần ít nhất 1 tài khoản trong quan_tri (giống môi trường shop).
begin;

create function pg_temp.kiem_dung(dung boolean, ten text) returns void
language plpgsql as $$ begin
  if dung is distinct from true then raise exception 'FAIL: %', ten; end if;
  raise notice 'PASS: %', ten;
end $$;

-- Khóa giống RPC để không có lượt tạo đơn khác chen vào trong bài kiểm thử.
select pg_advisory_xact_lock(72638135::bigint);
delete from public.orders;

do $$
declare
  v_admin uuid;
  v_ngoai uuid := gen_random_uuid();
  v_phone text := '090' || lpad(floor(random() * 10000000)::text, 7, '0');
  v_id bigint;
  v_customer bigint;
  v_n int;
begin
  select user_id into v_admin from public.quan_tri limit 1;
  perform pg_temp.kiem_dung(v_admin is not null, 'Có quản trị để kiểm quyền thật');
  perform pg_temp.kiem_dung(not exists(select 1 from public.quan_tri where user_id = v_ngoai), 'UUID thử không phải quản trị');
  perform pg_temp.kiem_dung(has_function_privilege('anon', 'public.place_order(text,text,text,bigint,text,integer,date,text,text,text,text)', 'execute'), 'Khách được gọi RPC');
  perform pg_temp.kiem_dung(has_function_privilege('authenticated', 'public.place_order(text,text,text,bigint,text,integer,date,text,text,text,text)', 'execute'), 'Tài khoản được gọi RPC để hàm tự kiểm quyền');

  perform set_config('request.jwt.claims', json_build_object('role','authenticated','sub',v_ngoai)::text, true);
  begin
    perform public.place_order(v_phone, 'Khách thử', null, null, 'Mẫu thử', 1, null, null, null, null);
    raise exception 'FAIL: tài khoản ngoài shop vẫn tạo được đơn';
  exception when insufficient_privilege then
    raise notice 'PASS: tài khoản ngoài shop bị chặn';
  end;
  perform pg_temp.kiem_dung((select count(*) = 0 from public.orders), 'Bị từ chối không để lại đơn');

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  for v_n in 1..3 loop
    v_id := public.place_order(v_phone, 'Khách thử', null, null, 'Mẫu thử', 1, null, null, null, null);
  end loop;
  begin
    perform public.place_order(v_phone, 'Khách thử', null, null, 'Mẫu thử', 1, null, null, null, null);
    raise exception 'FAIL: số này tạo được đơn thứ 4';
  exception when raise_exception then
    if sqlerrm not like 'QUA_NHIEU_DON:%' then raise; end if;
    raise notice 'PASS: khách bị giới hạn 3 đơn/SĐT';
  end;
  perform pg_temp.kiem_dung((select count(*) = 3 from public.orders), 'Đơn vượt giới hạn không được lưu');
  select customer_id into v_customer from public.orders where id = v_id;
  perform pg_temp.kiem_dung((select count(distinct customer_id) = 1 from public.orders), 'Các đơn cùng số vẫn dùng chung khách');

  -- Đổi số trong sổ khách: các đơn cũ vẫn liên kết đúng khách, không lưu số riêng.
  update public.customers set phone = 'test-' || v_customer where id = v_customer;
  perform pg_temp.kiem_dung((select count(*) = 3 from public.orders o join public.customers c on c.id = o.customer_id where c.phone = 'test-' || v_customer), 'Sửa SĐT khách cập nhật liên hệ của mọi đơn liên quan');

  insert into public.orders(product_name, quantity)
    select 'Đơn thử quota', 1 from generate_series(1, 17);
  begin
    perform public.place_order(null, 'Khách thử', null, null, 'Mẫu thử', 1, null, null, null, null);
    raise exception 'FAIL: vượt 20 đơn vẫn tạo được';
  exception when raise_exception then
    if sqlerrm not like 'QUA_NHIEU_DON:%' then raise; end if;
    raise notice 'PASS: giới hạn 20 đơn toàn web';
  end;

  perform set_config('request.jwt.claims', json_build_object('role','authenticated','sub',v_admin)::text, true);
  perform pg_temp.kiem_dung(public.la_quan_tri(), 'JWT quản trị được xác nhận bằng danh sách');
  v_id := public.place_order(null, 'Shop thử', null, null, 'Mẫu riêng shop', 1, null, null, null, null);
  perform pg_temp.kiem_dung((select count(*) = 21 from public.orders), 'Shop vẫn tạo đơn khi khách hết quota');
  perform pg_temp.kiem_dung((select product_name = 'Mẫu riêng shop' from public.orders where id = v_id), 'Giữ tên mẫu shop nhập');
end $$;

rollback;
-- Kết quả mong đợi: tất cả NOTICE là PASS, không có ERROR, không lưu đơn thử.
-- Đây là test một kết nối; kiểm đồng thời xem huong-dan/ky-thuat/gia-co-tao-don.md.
