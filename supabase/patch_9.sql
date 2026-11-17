-- =====================================================
-- YAMA 9: Müşteri, rezervasyonunun kişi sayısını sonradan değiştirebilsin
-- Supabase > SQL Editor > New query'ye (BOŞ sorgu) yapıştırıp RUN
-- Kural: iptal ile aynı, slot başlamadan en az 2 saat öncesine kadar. Kontenjan aşılamaz.
-- Tekrar çalıştırılırsa zarar vermez.
-- =====================================================
create or replace function update_reservation_party(p_id uuid, p_party_size int)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  rv reservations;
  s slots;
  others int;
  st timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın.';
  end if;
  if p_party_size is null or p_party_size < 1 or p_party_size > 10 then
    raise exception 'Kişi sayısı 1 ile 10 arasında olmalı.';
  end if;

  select * into rv from reservations where id = p_id for update;
  if not found or rv.user_id <> auth.uid() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  if rv.status <> 'confirmed' then
    raise exception 'Bu rezervasyon düzenlenemez.';
  end if;

  select * into s from slots where id = rv.slot_id for update;
  st := (s.slot_date + s.start_time) at time zone 'Europe/Istanbul';
  if now() > st - interval '2 hours' then
    raise exception 'Rezervasyona 2 saatten az kaldığı için değiştirilemez. Lütfen restoranla iletişime geç.';
  end if;

  select coalesce(sum(party_size), 0) into others
  from reservations
  where slot_id = rv.slot_id and status <> 'cancelled' and id <> p_id;

  if others + p_party_size > s.capacity then
    raise exception 'Bu slotta yeterli kontenjan kalmadı.';
  end if;

  update reservations set party_size = p_party_size where id = p_id;
end;
$$;

revoke execute on function update_reservation_party(uuid, int) from public, anon;
grant execute on function update_reservation_party(uuid, int) to authenticated;
