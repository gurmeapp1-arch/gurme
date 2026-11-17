-- =====================================================
-- YAMA 10: Kötüye kullanım koruması
--  * 2 kez "Gelmedi" olan müşteri yeni rezervasyon yapamaz (yönetici izin verebilir)
--  * Aynı anda en fazla 2 aktif (henüz bitmemiş, onaylı) rezervasyon
--  * Yönetici kullanıcı listesinde gelmeme sayısı görünür
-- Supabase > SQL Editor > New query'ye (BOŞ sorgu) yapıştırıp RUN
-- Tekrar çalıştırılırsa zarar vermez.
-- =====================================================

-- 1) Yönetici izni (müşteri bunu kendisi değiştiremez: sadece fonksiyonla yazılır)
alter table profiles add column if not exists booking_override boolean not null default false;

-- 2) Yönetici: izni ver / kaldır
create or replace function admin_set_booking_override(p_user_id uuid, p_allow boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  update profiles set booking_override = coalesce(p_allow, false) where id = p_user_id;
end;
$$;

-- 3) Yönetici kullanıcı listesi: gelmeme sayısı ve izin eklenir
--    (dönüş sütunları değiştiği için eski fonksiyon önce silinir)
drop function if exists admin_list_users();
create function admin_list_users()
returns table(
  id uuid, email text, full_name text, phone text, role text,
  created_at timestamptz, restaurant_name text,
  no_show_count int, booking_override boolean
)
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  return query
    select u.id, u.email::text, p.full_name, p.phone, p.role::text, u.created_at,
           (select r.name from restaurants r where r.owner_id = u.id limit 1),
           (select count(*)::int from reservations rv
              where rv.user_id = u.id and rv.status = 'no_show'),
           coalesce(p.booking_override, false)
    from auth.users u
    left join profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;

-- 4) Rezervasyon fonksiyonu: iki yeni kontrol eklendi (gerisi aynı)
create or replace function book_reservation(
  p_slot_id uuid, p_party_size integer, p_name text, p_phone text
)
returns reservations
language plpgsql security definer
set search_path = public
as $$
declare
  s slots;
  booked int;
  new_code text;
  res reservations;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  allowed boolean;
  missed int;
  active int;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın.';
  end if;

  -- YENİ: gelmeme ve aktif rezervasyon sınırı (yönetici izni olanlar muaf)
  select coalesce(booking_override, false) into allowed from profiles where id = auth.uid();
  if not coalesce(allowed, false) then
    select count(*) into missed from reservations
    where user_id = auth.uid() and status = 'no_show';
    if missed >= 2 then
      raise exception 'Daha önce 2 rezervasyonuna gelmediğin için yeni rezervasyon yapamıyorsun. Lütfen bizimle iletişime geç.';
    end if;

    select count(*) into active
    from reservations rv join slots sl on sl.id = rv.slot_id
    where rv.user_id = auth.uid() and rv.status = 'confirmed'
      and ((sl.slot_date + sl.end_time) at time zone 'Europe/Istanbul') > now();
    if active >= 2 then
      raise exception 'Aynı anda en fazla 2 aktif rezervasyonun olabilir. Birini iptal edebilir ya da bitmesini bekleyebilirsin.';
    end if;
  end if;

  select * into s from slots where id = p_slot_id for update;
  if not found then
    raise exception 'Slot bulunamadı.';
  end if;

  if not exists (select 1 from restaurants where id = s.restaurant_id and approved) then
    raise exception 'Bu restoran aktif değil.';
  end if;

  if ((s.slot_date + s.end_time) at time zone 'Europe/Istanbul') <= now() then
    raise exception 'Bu slot sona erdi.';
  end if;

  if exists (
    select 1 from reservations
    where slot_id = p_slot_id and user_id = auth.uid() and status <> 'cancelled'
  ) then
    raise exception 'Bu slot için zaten rezervasyonun var.';
  end if;

  select coalesce(sum(party_size), 0) into booked
  from reservations where slot_id = p_slot_id and status <> 'cancelled';

  if booked + p_party_size > s.capacity then
    raise exception 'Bu slotta yeterli kontenjan kalmadı.';
  end if;

  loop
    new_code := 'GRM-' || (
      select string_agg(substr(chars, 1 + floor(random() * length(chars))::int, 1), '')
      from generate_series(1, 4)
    );
    exit when not exists (select 1 from reservations where code = new_code);
  end loop;

  insert into reservations (code, slot_id, user_id, party_size, reservation_name, phone)
  values (new_code, p_slot_id, auth.uid(), p_party_size, p_name, p_phone)
  returning * into res;

  return res;
end;
$$;
