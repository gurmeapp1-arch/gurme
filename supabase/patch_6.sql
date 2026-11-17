-- =========================================================
-- 1) YORUM: isim ya da anonim
-- =========================================================
alter table reviews add column if not exists is_anonymous boolean not null default false;

drop function if exists submit_review(uuid, int, text);

create or replace function submit_review(
  p_reservation_id uuid, p_rating int, p_comment text, p_anonymous boolean default false
)
returns reviews
language plpgsql security definer
set search_path = public
as $$
declare
  rv reservations;
  s slots;
  res reviews;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın.';
  end if;

  select * into rv from reservations where id = p_reservation_id;
  if not found or rv.user_id <> auth.uid() then
    raise exception 'Bu rezervasyon için yorum yazamazsın.';
  end if;

  if rv.status <> 'attended' then
    raise exception 'Yorum, restoran rezervasyonunu "geldi" olarak işaretledikten sonra yazılabilir.';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Puan 1 ile 5 arasında olmalı.';
  end if;

  select * into s from slots where id = rv.slot_id;

  insert into reviews (reservation_id, restaurant_id, user_id, rating, comment, is_anonymous)
  values (p_reservation_id, s.restaurant_id, auth.uid(), p_rating, nullif(trim(p_comment), ''),
          coalesce(p_anonymous, false))
  returning * into res;

  return res;
exception
  when unique_violation then
    raise exception 'Bu rezervasyon için zaten yorum yazdın.';
end;
$$;

revoke all on function submit_review(uuid, int, text, boolean) from public;
grant execute on function submit_review(uuid, int, text, boolean) to authenticated;

create or replace view reviews_public as
select
  r.id, r.restaurant_id, r.rating, r.comment, r.created_at,
  case when r.is_anonymous then 'Anonim' else split_part(p.full_name, ' ', 1) end as reviewer_name
from reviews r
join profiles p on p.id = r.user_id
join restaurants rs on rs.id = r.restaurant_id
where rs.approved;

grant select on reviews_public to authenticated;

-- =========================================================
-- 2) FAVORİ RESTORANLAR
-- =========================================================
create table if not exists favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

alter table favorites enable row level security;

drop policy if exists "fav_select_own" on favorites;
drop policy if exists "fav_insert_own" on favorites;
drop policy if exists "fav_delete_own" on favorites;
create policy "fav_select_own" on favorites for select to authenticated using (user_id = auth.uid());
create policy "fav_insert_own" on favorites for insert to authenticated with check (user_id = auth.uid());
create policy "fav_delete_own" on favorites for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on favorites to authenticated;

-- =========================================================
-- 3) RESTORAN BİLGİLERİ VE GALERİ
-- =========================================================
alter table restaurants add column if not exists hours text;
alter table restaurants add column if not exists instagram text;
alter table restaurants add column if not exists menu_url text;

alter table restaurants drop constraint if exists restaurants_hours_len;
alter table restaurants add constraint restaurants_hours_len check (hours is null or length(hours) <= 300) not valid;
alter table restaurants drop constraint if exists restaurants_instagram_fmt;
alter table restaurants add constraint restaurants_instagram_fmt
  check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$') not valid;
alter table restaurants drop constraint if exists restaurants_menu_url_fmt;
alter table restaurants add constraint restaurants_menu_url_fmt
  check (menu_url is null or (menu_url ~ '^https?://' and length(menu_url) <= 300)) not valid;

grant update (hours, instagram, menu_url) on restaurants to authenticated;

create table if not exists restaurant_photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

alter table restaurant_photos enable row level security;

drop policy if exists "rp_select" on restaurant_photos;
drop policy if exists "rp_insert" on restaurant_photos;
drop policy if exists "rp_delete" on restaurant_photos;

create policy "rp_select" on restaurant_photos for select to anon, authenticated
  using (exists (
    select 1 from restaurants r
    where r.id = restaurant_id and (r.approved or r.owner_id = auth.uid() or is_admin())
  ));
create policy "rp_insert" on restaurant_photos for insert to authenticated
  with check (restaurant_id in (select id from restaurants where owner_id = auth.uid()));
create policy "rp_delete" on restaurant_photos for delete to authenticated
  using (restaurant_id in (select id from restaurants where owner_id = auth.uid()) or is_admin());

grant select on restaurant_photos to anon, authenticated;
grant insert, delete on restaurant_photos to authenticated;

-- Bir restoran en fazla 8 galeri fotoğrafı ekleyebilir
create or replace function limit_restaurant_photos()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from restaurant_photos where restaurant_id = new.restaurant_id) >= 8 then
    raise exception 'En fazla 8 fotoğraf ekleyebilirsin.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limit_restaurant_photos on restaurant_photos;
create trigger trg_limit_restaurant_photos
  before insert on restaurant_photos
  for each row execute function limit_restaurant_photos();

-- Slot listesine yeni bilgiler eklenir (eski sütunlar aynı sırada kalır)
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
  r.category,
  r.hours, r.instagram, r.menu_url
from slots s
join restaurants r on r.id = s.restaurant_id
left join restaurant_ratings rt on rt.restaurant_id = r.id
where r.approved;

grant select on slots_public to anon, authenticated;
