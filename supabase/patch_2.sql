-- =====================================================
-- YAMA 2: Restoran fotoğrafı/logo, yorum ve puan sistemi
-- Supabase > SQL Editor > New query'ye (BOŞ sorgu) yapıştırıp RUN
-- Tekrar çalıştırılırsa zarar vermez.
-- =====================================================

-- 1) RESTORAN FOTOĞRAF ALANLARI
alter table restaurants add column if not exists cover_url text;
alter table restaurants add column if not exists logo_url text;

-- Restoran sahibi bu iki alanı da güncelleyebilsin
grant update (cover_url, logo_url) on restaurants to authenticated;

-- Tanıtım yazısı en fazla 400 karakter
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'restaurants_description_len') then
    alter table restaurants
      add constraint restaurants_description_len
      check (description is null or char_length(description) <= 400) not valid;
  end if;
end $$;

-- 2) FOTOĞRAF DEPOSU (Storage)
-- Herkes görebilir, sadece restoran sahibi kendi klasörüne yükleyebilir.
-- En fazla 2 MB, sadece jpeg/png/webp.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-images', 'restaurant-images', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "ri_select" on storage.objects;
drop policy if exists "ri_insert" on storage.objects;
drop policy if exists "ri_update" on storage.objects;
drop policy if exists "ri_delete" on storage.objects;

create policy "ri_select" on storage.objects for select
  using (bucket_id = 'restaurant-images');

create policy "ri_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'restaurant-images'
    and (storage.foldername(name))[1] in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );

create policy "ri_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'restaurant-images'
    and (storage.foldername(name))[1] in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );

create policy "ri_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'restaurant-images'
    and (storage.foldername(name))[1] in (
      select id::text from public.restaurants where owner_id = auth.uid()
    )
  );

-- 3) YORUMLAR
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references reservations(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists reviews_restaurant_idx on reviews (restaurant_id, created_at desc);
create index if not exists reviews_user_idx on reviews (user_id);

alter table reviews enable row level security;

drop policy if exists "reviews_select_own" on reviews;
create policy "reviews_select_own" on reviews for select
  using (user_id = auth.uid() or is_admin());

-- Yazma sadece aşağıdaki fonksiyonla yapılır
revoke insert, update, delete on reviews from anon, authenticated;

-- 4) YORUM YAZ (sadece "geldi" işaretlenmiş kendi rezervasyonuna, bir kez)
create or replace function submit_review(
  p_reservation_id uuid, p_rating int, p_comment text
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

  insert into reviews (reservation_id, restaurant_id, user_id, rating, comment)
  values (p_reservation_id, s.restaurant_id, auth.uid(), p_rating, nullif(trim(p_comment), ''))
  returning * into res;

  return res;
exception
  when unique_violation then
    raise exception 'Bu rezervasyon için zaten yorum yazdın.';
end;
$$;

-- 5) YORUM SİL (sadece yönetici)
create or replace function delete_review(p_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  delete from reviews where id = p_id;
end;
$$;

-- 6) GÖRÜNÜMLER
-- Onaylı restoranların yorumları (yorum yazanın sadece adı görünür)
create or replace view reviews_public as
select
  r.id, r.restaurant_id, r.rating, r.comment, r.created_at,
  split_part(p.full_name, ' ', 1) as reviewer_name
from reviews r
join profiles p on p.id = r.user_id
join restaurants rs on rs.id = r.restaurant_id
where rs.approved;

grant select on reviews_public to authenticated;

-- Restoran başına ortalama puan
create or replace view restaurant_ratings as
select
  r.restaurant_id,
  round(avg(r.rating)::numeric, 1)::float8 as avg_rating,
  count(*)::int as review_count
from reviews r
join restaurants rs on rs.id = r.restaurant_id
where rs.approved
group by r.restaurant_id;

grant select on restaurant_ratings to anon, authenticated;

-- Slot listesine fotoğraf ve puan alanları eklenir (eski sütunlar aynı sırada kalır)
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
  coalesce(rt.review_count, 0) as review_count
from slots s
join restaurants r on r.id = s.restaurant_id
left join restaurant_ratings rt on rt.restaurant_id = r.id
where r.approved;

grant select on slots_public to anon, authenticated;
