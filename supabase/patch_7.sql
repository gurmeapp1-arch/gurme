-- =====================================================
-- YAMA 7: Basamaklı (zamanla azalan) indirim
-- Supabase > SQL Editor > New query'ye (BOŞ sorgu) yapıştırıp RUN
-- Tekrar çalıştırılırsa zarar vermez.
-- =====================================================

-- 1) Slota iki ek basamak: "2+ gün önce" ve "1-2 gün önce" indirimi.
--    discount_percent (eski alan) = son 24 saatteki indirim olarak kalır.
alter table slots add column if not exists discount_far int;
alter table slots add column if not exists discount_mid int;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'slots_discount_far_range') then
    alter table slots add constraint slots_discount_far_range
      check (discount_far is null or discount_far between 5 and 70) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'slots_discount_mid_range') then
    alter table slots add constraint slots_discount_mid_range
      check (discount_mid is null or discount_mid between 5 and 70) not valid;
  end if;
end $$;

grant select, insert (discount_far, discount_mid) on slots to authenticated;
grant update (discount_far, discount_mid) on slots to authenticated;

-- 2) Verilen anda geçerli indirimi hesaplayan fonksiyonlar (saatler Türkiye saatiyle)
create or replace function slot_discount_at(
  p_date date, p_start time, p_base int, p_far int, p_mid int,
  p_at timestamptz default now()
) returns int
language sql stable
as $$
  select case
    when p_far is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 48
      then p_far
    when p_mid is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 24
      then p_mid
    else p_base
  end
$$;

-- Bir sonraki basamakta indirim kaç olacak? (yoksa null)
create or replace function slot_next_discount(
  p_date date, p_start time, p_base int, p_far int, p_mid int,
  p_at timestamptz default now()
) returns int
language sql stable
as $$
  select case
    when p_far is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 48
      then coalesce(p_mid, p_base)
    when p_mid is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 24
      then p_base
    else null
  end
$$;

-- ... ve ne zaman değişecek?
create or replace function slot_next_change_at(
  p_date date, p_start time, p_far int, p_mid int,
  p_at timestamptz default now()
) returns timestamptz
language sql stable
as $$
  select case
    when p_far is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 48
      then ((p_date + p_start) at time zone 'Europe/Istanbul') - interval '48 hours'
    when p_mid is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 24
      then ((p_date + p_start) at time zone 'Europe/Istanbul') - interval '24 hours'
    else null
  end
$$;

grant execute on function slot_discount_at(date, time, int, int, int, timestamptz) to anon, authenticated;
grant execute on function slot_next_discount(date, time, int, int, int, timestamptz) to anon, authenticated;
grant execute on function slot_next_change_at(date, time, int, int, timestamptz) to anon, authenticated;

-- 3) Rezervasyon anındaki indirim rezervasyona kilitlenir
alter table reservations add column if not exists discount_percent int;

create or replace function lock_reservation_discount()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  s slots;
begin
  select * into s from slots where id = new.slot_id;
  if found then
    new.discount_percent := slot_discount_at(
      s.slot_date, s.start_time, s.discount_percent, s.discount_far, s.discount_mid, now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_reservation_discount on reservations;
create trigger trg_lock_reservation_discount
  before insert on reservations
  for each row execute function lock_reservation_discount();

-- Eski rezervasyonlar slotun indirimini alsın
update reservations r
set discount_percent = s.discount_percent
from slots s
where s.id = r.slot_id and r.discount_percent is null;

grant select (discount_percent) on reservations to authenticated;

-- 4) Müşteri listesi: discount_percent artık o anda geçerli indirimi gösterir
create or replace view slots_public as
select
  s.id, s.restaurant_id,
  r.name as restaurant_name, r.district, r.address, r.description,
  s.slot_date, s.start_time, s.end_time,
  slot_discount_at(s.slot_date, s.start_time, s.discount_percent, s.discount_far, s.discount_mid) as discount_percent,
  s.capacity,
  s.capacity - coalesce((
    select sum(rv.party_size) from reservations rv
    where rv.slot_id = s.id and rv.status <> 'cancelled'
  ), 0)::int as remaining,
  r.cover_url, r.logo_url,
  rt.avg_rating,
  coalesce(rt.review_count, 0) as review_count,
  r.category,
  r.hours, r.instagram, r.menu_url,
  slot_next_discount(s.slot_date, s.start_time, s.discount_percent, s.discount_far, s.discount_mid) as next_discount,
  slot_next_change_at(s.slot_date, s.start_time, s.discount_far, s.discount_mid) as next_change_at
from slots s
join restaurants r on r.id = s.restaurant_id
left join restaurant_ratings rt on rt.restaurant_id = r.id
where r.approved;

grant select on slots_public to anon, authenticated;
