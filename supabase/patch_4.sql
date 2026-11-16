-- 1) Restoran türü (Restoran, Kafe, ...)
alter table restaurants add column if not exists category text not null default 'Restoran';
alter table restaurants drop constraint if exists restaurants_category_check;
alter table restaurants add constraint restaurants_category_check
  check (category in ('Restoran','Kafe','Fast food','Tatlı ve pastane','Kahvaltı'));
grant update (category) on restaurants to authenticated;

-- 2) Müşteri kendi adını ve telefonunu güncelleyebilsin (rol değiştirilemez)
create or replace function update_my_profile(p_full_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_full_name, ''))) < 2 or length(p_full_name) > 80 then
    raise exception 'Ad soyad en az 2, en fazla 80 karakter olmalı.';
  end if;
  update profiles
     set full_name = trim(p_full_name),
         phone = nullif(trim(coalesce(p_phone, '')), '')
   where id = auth.uid();
end;
$$;

revoke all on function update_my_profile(text, text) from public;
grant execute on function update_my_profile(text, text) to authenticated;

-- 3) Slot listesine tür eklenir (eski sütunlar aynı sırada kalır)
create or replace view slots_public as
select
  s.id, s.restaurant_id,
  r.name as restaurant_name, r.district, r.address, r.description,
  s.slot_date, s.start_time, s.end_time, s.discount_percent, s.capacity,
  s.capacity - coalesce((
    select sum(rv.party_size) from reservations rv
    where rv.slot_id = s.id and rv.status <> 'cancelled'
  ), 0)::int as remaining,
  r.cover_url, r.logo_url,
  rt.avg_rating,
  coalesce(rt.review_count, 0) as review_count,
  r.category
from slots s
join restaurants r on r.id = s.restaurant_id
left join restaurant_ratings rt on rt.restaurant_id = r.id
where r.approved;

grant select on slots_public to anon, authenticated;
