-- =====================================================
-- GURME VERİTABANI YAPISI (yedek)  —  oluşturulma: 2026-11-17
-- Supabase'den 'export_schema.sql' sorgusuyla alındı.
-- Bu dosya VERİYİ değil, yapıyı (tablolar, fonksiyonlar, güvenlik kuralları) içerir.
-- Sıfırdan yeni bir Supabase projesi kurmak için: SQL Editor'da boş sorguya yapıştırıp RUN.
-- (Fotoğraf deposu policy'leri storage.objects üzerindedir; bucket satırı en sondadır.)
-- =====================================================


-- ---------- 1) Özel türler ----------

create type public.reservation_status as enum ('confirmed', 'cancelled', 'attended', 'no_show');

create type public.user_role as enum ('diner', 'restaurant', 'admin');


-- ---------- 2) Tablolar ----------

create table if not exists public.favorites (
  user_id uuid not null,
  restaurant_id uuid not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.profiles (
  id uuid not null,
  role user_role not null default 'diner'::user_role,
  full_name text not null,
  phone text,
  kvkk_accepted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  signup_source text
);

create table if not exists public.reservations (
  id uuid not null default gen_random_uuid(),
  code text not null,
  slot_id uuid not null,
  user_id uuid not null,
  party_size integer not null,
  reservation_name text not null,
  phone text not null,
  status reservation_status not null default 'confirmed'::reservation_status,
  created_at timestamp with time zone not null default now(),
  cancelled_at timestamp with time zone,
  discount_percent integer
);

create table if not exists public.restaurant_photos (
  id uuid not null default gen_random_uuid(),
  restaurant_id uuid not null,
  url text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.restaurants (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  district text not null,
  address text,
  phone text,
  description text,
  approved boolean not null default false,
  created_at timestamp with time zone not null default now(),
  cover_url text,
  logo_url text,
  category text not null default 'Restoran'::text,
  hours text,
  instagram text,
  menu_url text
);

create table if not exists public.reviews (
  id uuid not null default gen_random_uuid(),
  reservation_id uuid not null,
  restaurant_id uuid not null,
  user_id uuid not null,
  rating integer not null,
  comment text,
  created_at timestamp with time zone not null default now(),
  is_anonymous boolean not null default false
);

create table if not exists public.slots (
  id uuid not null default gen_random_uuid(),
  restaurant_id uuid not null,
  slot_date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  discount_percent integer not null,
  capacity integer not null,
  created_at timestamp with time zone not null default now(),
  discount_far integer,
  discount_mid integer
);


-- ---------- 3) Birincil anahtar, benzersiz ve kontrol kuralları ----------

alter table public.favorites add constraint favorites_pkey PRIMARY KEY (user_id, restaurant_id);

alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table public.reservations add constraint reservations_code_key UNIQUE (code);

alter table public.reservations add constraint reservations_party_size_check CHECK (((party_size >= 1) AND (party_size <= 10)));

alter table public.reservations add constraint reservations_pkey PRIMARY KEY (id);

alter table public.restaurant_photos add constraint restaurant_photos_pkey PRIMARY KEY (id);

alter table public.restaurants add constraint restaurants_category_check CHECK ((category = ANY (ARRAY['Restoran'::text, 'Kafe'::text, 'Fast food'::text, 'Tatlı ve pastane'::text, 'Kahvaltı'::text])));

alter table public.restaurants add constraint restaurants_description_len CHECK (((description IS NULL) OR (char_length(description) <= 400))) NOT VALID;

alter table public.restaurants add constraint restaurants_hours_len CHECK (((hours IS NULL) OR (length(hours) <= 300))) NOT VALID;

alter table public.restaurants add constraint restaurants_instagram_fmt CHECK (((instagram IS NULL) OR (instagram ~ '^[A-Za-z0-9._]{1,30}$'::text))) NOT VALID;

alter table public.restaurants add constraint restaurants_menu_url_fmt CHECK (((menu_url IS NULL) OR ((menu_url ~ '^https?://'::text) AND (length(menu_url) <= 300)))) NOT VALID;

alter table public.restaurants add constraint restaurants_owner_id_key UNIQUE (owner_id);

alter table public.restaurants add constraint restaurants_pkey PRIMARY KEY (id);

alter table public.reviews add constraint reviews_comment_check CHECK (((comment IS NULL) OR (char_length(comment) <= 500)));

alter table public.reviews add constraint reviews_pkey PRIMARY KEY (id);

alter table public.reviews add constraint reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));

alter table public.reviews add constraint reviews_reservation_id_key UNIQUE (reservation_id);

alter table public.slots add constraint slots_capacity_check CHECK ((capacity > 0));

alter table public.slots add constraint slots_check CHECK ((end_time > start_time));

alter table public.slots add constraint slots_discount_far_range CHECK (((discount_far IS NULL) OR ((discount_far >= 5) AND (discount_far <= 70)))) NOT VALID;

alter table public.slots add constraint slots_discount_mid_range CHECK (((discount_mid IS NULL) OR ((discount_mid >= 5) AND (discount_mid <= 70)))) NOT VALID;

alter table public.slots add constraint slots_discount_percent_check CHECK (((discount_percent >= 5) AND (discount_percent <= 70)));

alter table public.slots add constraint slots_pkey PRIMARY KEY (id);


-- ---------- 4) Yabancı anahtarlar ----------

alter table public.favorites add constraint favorites_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

alter table public.favorites add constraint favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.reservations add constraint reservations_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE RESTRICT;

alter table public.reservations add constraint reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.restaurant_photos add constraint restaurant_photos_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

alter table public.restaurants add constraint restaurants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.slots add constraint slots_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;


-- ---------- 5) Dizinler ----------

CREATE INDEX reservations_slot_id_idx ON public.reservations USING btree (slot_id);

CREATE INDEX reservations_user_id_idx ON public.reservations USING btree (user_id);

CREATE INDEX reviews_restaurant_idx ON public.reviews USING btree (restaurant_id, created_at DESC);

CREATE INDEX reviews_user_idx ON public.reviews USING btree (user_id);

CREATE INDEX slots_restaurant_id_slot_date_idx ON public.slots USING btree (restaurant_id, slot_date);


-- ---------- 6) Fonksiyonlar ----------

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  rids uuid[];
  sids uuid[];
  target_role text;
begin
  if not is_admin() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Kendi hesabını silemezsin.';
  end if;
  select role::text into target_role from profiles where id = p_user_id;
  if target_role = 'admin' then
    raise exception 'Yönetici hesapları buradan silinemez.';
  end if;

  select array_agg(id) into rids from restaurants where owner_id = p_user_id;
  select array_agg(id) into sids from slots where restaurant_id = any(coalesce(rids, '{}'));

  delete from reviews where user_id = p_user_id or restaurant_id = any(coalesce(rids, '{}'));
  delete from reservations where user_id = p_user_id or slot_id = any(coalesce(sids, '{}'));
  delete from slots where id = any(coalesce(sids, '{}'));
  delete from restaurants where id = any(coalesce(rids, '{}'));
  delete from profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_list_users()
 RETURNS TABLE(id uuid, email text, full_name text, phone text, role text, created_at timestamp with time zone, restaurant_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_admin() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  return query
    select u.id, u.email::text, p.full_name, p.phone, p.role::text, u.created_at,
           (select r.name from restaurants r where r.owner_id = u.id limit 1)
    from auth.users u
    left join profiles p on p.id = u.id
    order by u.created_at desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.approve_restaurant(p_id uuid, p_approved boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_admin() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  update restaurants set approved = p_approved where id = p_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.book_reservation(p_slot_id uuid, p_party_size integer, p_name text, p_phone text)
 RETURNS reservations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s slots;
  booked int;
  new_code text;
  res reservations;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısın.';
  end if;

  select * into s from slots where id = p_slot_id for update;
  if not found then
    raise exception 'Slot bulunamadı.';
  end if;

  if not exists (select 1 from restaurants where id = s.restaurant_id and approved) then
    raise exception 'Bu restoran aktif değil.';
  end if;

  -- DEĞİŞEN KISIM: başlangıç değil, BİTİŞ saati kontrol ediliyor
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
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  rv reservations;
  st timestamptz;
begin
  select * into rv from reservations where id = p_id for update;
  if not found then
    raise exception 'Rezervasyon bulunamadı.';
  end if;
  if rv.status <> 'confirmed' then
    raise exception 'Bu rezervasyon iptal edilemez.';
  end if;

  if is_admin() then
    null;
  elsif rv.user_id = auth.uid() then
    select (s.slot_date + s.start_time) at time zone 'Europe/Istanbul' into st
    from slots s where s.id = rv.slot_id;
    if now() > st - interval '2 hours' then
      raise exception 'Rezervasyona 2 saatten az kaldığı için iptal edilemez. Lütfen restoranla iletişime geç.';
    end if;
  else
    raise exception 'Bu işlem için yetkin yok.';
  end if;

  update reservations set status = 'cancelled', cancelled_at = now() where id = p_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_review(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_admin() then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  delete from reviews where id = p_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r user_role;
begin
  r := case when new.raw_user_meta_data->>'role' = 'restaurant'
            then 'restaurant'::user_role else 'diner'::user_role end;

  insert into profiles (id, role, full_name, phone, kvkk_accepted_at)
  values (
    new.id, r,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    now()
  );

  if r = 'restaurant' then
    insert into restaurants (owner_id, name, district, address, phone)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'restaurant_name', 'İsimsiz Restoran'),
      coalesce(new.raw_user_meta_data->>'district', ''),
      new.raw_user_meta_data->>'address',
      new.raw_user_meta_data->>'phone'
    );
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$function$
;

CREATE OR REPLACE FUNCTION public.limit_restaurant_photos()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if (select count(*) from restaurant_photos where restaurant_id = new.restaurant_id) >= 8 then
    raise exception 'En fazla 8 fotoğraf ekleyebilirsin.';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.lock_reservation_discount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.mark_attendance(p_id uuid, p_status reservation_status)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  rv reservations;
  st timestamptz;
begin
  if p_status not in ('attended', 'no_show') then
    raise exception 'Geçersiz durum.';
  end if;

  select * into rv from reservations where id = p_id for update;
  if not found then
    raise exception 'Rezervasyon bulunamadı.';
  end if;
  if rv.status = 'cancelled' then
    raise exception 'İptal edilmiş rezervasyon işaretlenemez.';
  end if;

  select (s.slot_date + s.start_time) at time zone 'Europe/Istanbul' into st
  from slots s join restaurants r on r.id = s.restaurant_id
  where s.id = rv.slot_id and (r.owner_id = auth.uid() or is_admin());

  if st is null then
    raise exception 'Bu işlem için yetkin yok.';
  end if;
  if now() < st then
    raise exception 'Slot başlamadan işaretleme yapılamaz.';
  end if;

  update reservations set status = p_status where id = p_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_signup_source(p_source text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update profiles
     set signup_source = left(regexp_replace(lower(coalesce(p_source, '')), '[^a-z0-9_-]', '', 'g'), 40)
   where id = auth.uid() and signup_source is null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.slot_discount_at(p_date date, p_start time without time zone, p_base integer, p_far integer, p_mid integer, p_at timestamp with time zone DEFAULT now())
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  select case
    when p_far is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 48
      then p_far
    when p_mid is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 24
      then p_mid
    else p_base
  end
$function$
;

CREATE OR REPLACE FUNCTION public.slot_next_change_at(p_date date, p_start time without time zone, p_far integer, p_mid integer, p_at timestamp with time zone DEFAULT now())
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
AS $function$
  select case
    when p_far is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 48
      then ((p_date + p_start) at time zone 'Europe/Istanbul') - interval '48 hours'
    when p_mid is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 24
      then ((p_date + p_start) at time zone 'Europe/Istanbul') - interval '24 hours'
    else null
  end
$function$
;

CREATE OR REPLACE FUNCTION public.slot_next_discount(p_date date, p_start time without time zone, p_base integer, p_far integer, p_mid integer, p_at timestamp with time zone DEFAULT now())
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  select case
    when p_far is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 48
      then coalesce(p_mid, p_base)
    when p_mid is not null
      and extract(epoch from (((p_date + p_start) at time zone 'Europe/Istanbul') - p_at)) / 3600 > 24
      then p_base
    else null
  end
$function$
;

CREATE OR REPLACE FUNCTION public.submit_review(p_reservation_id uuid, p_rating integer, p_comment text, p_anonymous boolean DEFAULT false)
 RETURNS reviews
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_my_profile(p_full_name text, p_phone text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if length(trim(coalesce(p_full_name, ''))) < 2 or length(p_full_name) > 80 then
    raise exception 'Ad soyad en az 2, en fazla 80 karakter olmalı.';
  end if;
  update profiles
     set full_name = trim(p_full_name),
         phone = nullif(trim(coalesce(p_phone, '')), '')
   where id = auth.uid();
end;
$function$
;


-- ---------- 7) Görünümler ----------

create or replace view public.restaurant_ratings as  SELECT r.restaurant_id,
    (round(avg(r.rating), 1))::double precision AS avg_rating,
    (count(*))::integer AS review_count
   FROM (reviews r
     JOIN restaurants rs ON ((rs.id = r.restaurant_id)))
  WHERE rs.approved
  GROUP BY r.restaurant_id;

create or replace view public.reviews_public as  SELECT r.id,
    r.restaurant_id,
    r.rating,
    r.comment,
    r.created_at,
        CASE
            WHEN r.is_anonymous THEN 'Anonim'::text
            ELSE split_part(p.full_name, ' '::text, 1)
        END AS reviewer_name
   FROM ((reviews r
     JOIN profiles p ON ((p.id = r.user_id)))
     JOIN restaurants rs ON ((rs.id = r.restaurant_id)))
  WHERE rs.approved;

create or replace view public.slots_public as  SELECT s.id,
    s.restaurant_id,
    r.name AS restaurant_name,
    r.district,
    r.address,
    r.description,
    s.slot_date,
    s.start_time,
    s.end_time,
    slot_discount_at(s.slot_date, s.start_time, s.discount_percent, s.discount_far, s.discount_mid) AS discount_percent,
    s.capacity,
    (s.capacity - (COALESCE(( SELECT sum(rv.party_size) AS sum
           FROM reservations rv
          WHERE ((rv.slot_id = s.id) AND (rv.status <> 'cancelled'::reservation_status))), (0)::bigint))::integer) AS remaining,
    r.cover_url,
    r.logo_url,
    rt.avg_rating,
    COALESCE(rt.review_count, 0) AS review_count,
    r.category,
    r.hours,
    r.instagram,
    r.menu_url,
    slot_next_discount(s.slot_date, s.start_time, s.discount_percent, s.discount_far, s.discount_mid) AS next_discount,
    slot_next_change_at(s.slot_date, s.start_time, s.discount_far, s.discount_mid) AS next_change_at
   FROM ((slots s
     JOIN restaurants r ON ((r.id = s.restaurant_id)))
     LEFT JOIN restaurant_ratings rt ON ((rt.restaurant_id = r.id)))
  WHERE r.approved;


-- ---------- 8) Tetikleyiciler ----------

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER trg_limit_restaurant_photos BEFORE INSERT ON public.restaurant_photos FOR EACH ROW EXECUTE FUNCTION limit_restaurant_photos();

CREATE TRIGGER trg_lock_reservation_discount BEFORE INSERT ON public.reservations FOR EACH ROW EXECUTE FUNCTION lock_reservation_discount();


-- ---------- 9) Satır güvenliği (RLS) ----------

alter table public.favorites enable row level security;

alter table public.profiles enable row level security;

alter table public.reservations enable row level security;

alter table public.restaurant_photos enable row level security;

alter table public.restaurants enable row level security;

alter table public.reviews enable row level security;

alter table public.slots enable row level security;


-- ---------- 10) Erişim kuralları (policy) ----------

create policy fav_delete_own on public.favorites as permissive for delete to authenticated using ((user_id = auth.uid()));

create policy fav_insert_own on public.favorites as permissive for insert to authenticated with check ((user_id = auth.uid()));

create policy fav_select_own on public.favorites as permissive for select to authenticated using ((user_id = auth.uid()));

create policy profiles_select on public.profiles as permissive for select to public using (((id = auth.uid()) OR is_admin()));

create policy profiles_update on public.profiles as permissive for update to public using ((id = auth.uid())) with check ((id = auth.uid()));

create policy reservations_select on public.reservations as permissive for select to public using (((user_id = auth.uid()) OR is_admin() OR (EXISTS ( SELECT 1
   FROM (slots s
     JOIN restaurants r ON ((r.id = s.restaurant_id)))
  WHERE ((s.id = reservations.slot_id) AND (r.owner_id = auth.uid()))))));

create policy rp_delete on public.restaurant_photos as permissive for delete to authenticated using (((restaurant_id IN ( SELECT restaurants.id
   FROM restaurants
  WHERE (restaurants.owner_id = auth.uid()))) OR is_admin()));

create policy rp_insert on public.restaurant_photos as permissive for insert to authenticated with check ((restaurant_id IN ( SELECT restaurants.id
   FROM restaurants
  WHERE (restaurants.owner_id = auth.uid()))));

create policy rp_select on public.restaurant_photos as permissive for select to anon, authenticated using ((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = restaurant_photos.restaurant_id) AND (r.approved OR (r.owner_id = auth.uid()) OR is_admin())))));

create policy restaurants_select on public.restaurants as permissive for select to public using ((approved OR (owner_id = auth.uid()) OR is_admin()));

create policy restaurants_update on public.restaurants as permissive for update to public using ((owner_id = auth.uid())) with check ((owner_id = auth.uid()));

create policy reviews_select_own on public.reviews as permissive for select to public using (((user_id = auth.uid()) OR is_admin()));

create policy slots_delete on public.slots as permissive for delete to public using ((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = slots.restaurant_id) AND (r.owner_id = auth.uid())))));

create policy slots_insert on public.slots as permissive for insert to public with check ((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = slots.restaurant_id) AND (r.owner_id = auth.uid()) AND r.approved))));

create policy slots_select on public.slots as permissive for select to public using ((is_admin() OR (EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = slots.restaurant_id) AND (r.approved OR (r.owner_id = auth.uid())))))));

create policy slots_update on public.slots as permissive for update to public using ((EXISTS ( SELECT 1
   FROM restaurants r
  WHERE ((r.id = slots.restaurant_id) AND (r.owner_id = auth.uid())))));

create policy ri_delete on storage.objects as permissive for delete to authenticated using (((bucket_id = 'restaurant-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (restaurants.id)::text AS id
   FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())))));

create policy ri_insert on storage.objects as permissive for insert to authenticated with check (((bucket_id = 'restaurant-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (restaurants.id)::text AS id
   FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())))));

create policy ri_select on storage.objects as permissive for select to public using ((bucket_id = 'restaurant-images'::text));

create policy ri_update on storage.objects as permissive for update to authenticated using (((bucket_id = 'restaurant-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (restaurants.id)::text AS id
   FROM restaurants
  WHERE (restaurants.owner_id = auth.uid())))));


-- ---------- 11) Yetkiler (Supabase varsayılanları + sütun bazlı yetkiler) ----------

grant DELETE on public.favorites to anon;

grant INSERT on public.favorites to anon;

grant REFERENCES on public.favorites to anon;

grant SELECT on public.favorites to anon;

grant TRIGGER on public.favorites to anon;

grant TRUNCATE on public.favorites to anon;

grant UPDATE on public.favorites to anon;

grant DELETE on public.favorites to authenticated;

grant INSERT on public.favorites to authenticated;

grant REFERENCES on public.favorites to authenticated;

grant SELECT on public.favorites to authenticated;

grant TRIGGER on public.favorites to authenticated;

grant TRUNCATE on public.favorites to authenticated;

grant UPDATE on public.favorites to authenticated;

grant DELETE on public.profiles to anon;

grant INSERT on public.profiles to anon;

grant REFERENCES on public.profiles to anon;

grant SELECT on public.profiles to anon;

grant TRIGGER on public.profiles to anon;

grant TRUNCATE on public.profiles to anon;

grant DELETE on public.profiles to authenticated;

grant INSERT on public.profiles to authenticated;

grant REFERENCES on public.profiles to authenticated;

grant SELECT on public.profiles to authenticated;

grant TRIGGER on public.profiles to authenticated;

grant TRUNCATE on public.profiles to authenticated;

grant REFERENCES on public.reservations to anon;

grant SELECT on public.reservations to anon;

grant TRIGGER on public.reservations to anon;

grant TRUNCATE on public.reservations to anon;

grant REFERENCES on public.reservations to authenticated;

grant SELECT on public.reservations to authenticated;

grant TRIGGER on public.reservations to authenticated;

grant TRUNCATE on public.reservations to authenticated;

grant DELETE on public.restaurant_photos to anon;

grant INSERT on public.restaurant_photos to anon;

grant REFERENCES on public.restaurant_photos to anon;

grant SELECT on public.restaurant_photos to anon;

grant TRIGGER on public.restaurant_photos to anon;

grant TRUNCATE on public.restaurant_photos to anon;

grant UPDATE on public.restaurant_photos to anon;

grant DELETE on public.restaurant_photos to authenticated;

grant INSERT on public.restaurant_photos to authenticated;

grant REFERENCES on public.restaurant_photos to authenticated;

grant SELECT on public.restaurant_photos to authenticated;

grant TRIGGER on public.restaurant_photos to authenticated;

grant TRUNCATE on public.restaurant_photos to authenticated;

grant UPDATE on public.restaurant_photos to authenticated;

grant DELETE on public.restaurant_ratings to anon;

grant INSERT on public.restaurant_ratings to anon;

grant REFERENCES on public.restaurant_ratings to anon;

grant SELECT on public.restaurant_ratings to anon;

grant TRIGGER on public.restaurant_ratings to anon;

grant TRUNCATE on public.restaurant_ratings to anon;

grant UPDATE on public.restaurant_ratings to anon;

grant DELETE on public.restaurant_ratings to authenticated;

grant INSERT on public.restaurant_ratings to authenticated;

grant REFERENCES on public.restaurant_ratings to authenticated;

grant SELECT on public.restaurant_ratings to authenticated;

grant TRIGGER on public.restaurant_ratings to authenticated;

grant TRUNCATE on public.restaurant_ratings to authenticated;

grant UPDATE on public.restaurant_ratings to authenticated;

grant DELETE on public.restaurants to anon;

grant INSERT on public.restaurants to anon;

grant REFERENCES on public.restaurants to anon;

grant SELECT on public.restaurants to anon;

grant TRIGGER on public.restaurants to anon;

grant TRUNCATE on public.restaurants to anon;

grant DELETE on public.restaurants to authenticated;

grant INSERT on public.restaurants to authenticated;

grant REFERENCES on public.restaurants to authenticated;

grant SELECT on public.restaurants to authenticated;

grant TRIGGER on public.restaurants to authenticated;

grant TRUNCATE on public.restaurants to authenticated;

grant REFERENCES on public.reviews to anon;

grant SELECT on public.reviews to anon;

grant TRIGGER on public.reviews to anon;

grant TRUNCATE on public.reviews to anon;

grant REFERENCES on public.reviews to authenticated;

grant SELECT on public.reviews to authenticated;

grant TRIGGER on public.reviews to authenticated;

grant TRUNCATE on public.reviews to authenticated;

grant DELETE on public.reviews_public to anon;

grant INSERT on public.reviews_public to anon;

grant REFERENCES on public.reviews_public to anon;

grant SELECT on public.reviews_public to anon;

grant TRIGGER on public.reviews_public to anon;

grant TRUNCATE on public.reviews_public to anon;

grant UPDATE on public.reviews_public to anon;

grant DELETE on public.reviews_public to authenticated;

grant INSERT on public.reviews_public to authenticated;

grant REFERENCES on public.reviews_public to authenticated;

grant SELECT on public.reviews_public to authenticated;

grant TRIGGER on public.reviews_public to authenticated;

grant TRUNCATE on public.reviews_public to authenticated;

grant UPDATE on public.reviews_public to authenticated;

grant DELETE on public.slots to anon;

grant INSERT on public.slots to anon;

grant REFERENCES on public.slots to anon;

grant SELECT on public.slots to anon;

grant TRIGGER on public.slots to anon;

grant TRUNCATE on public.slots to anon;

grant UPDATE on public.slots to anon;

grant DELETE on public.slots to authenticated;

grant INSERT on public.slots to authenticated;

grant REFERENCES on public.slots to authenticated;

grant SELECT on public.slots to authenticated;

grant TRIGGER on public.slots to authenticated;

grant TRUNCATE on public.slots to authenticated;

grant UPDATE on public.slots to authenticated;

grant DELETE on public.slots_public to anon;

grant INSERT on public.slots_public to anon;

grant REFERENCES on public.slots_public to anon;

grant SELECT on public.slots_public to anon;

grant TRIGGER on public.slots_public to anon;

grant TRUNCATE on public.slots_public to anon;

grant UPDATE on public.slots_public to anon;

grant DELETE on public.slots_public to authenticated;

grant INSERT on public.slots_public to authenticated;

grant REFERENCES on public.slots_public to authenticated;

grant SELECT on public.slots_public to authenticated;

grant TRIGGER on public.slots_public to authenticated;

grant TRUNCATE on public.slots_public to authenticated;

grant UPDATE on public.slots_public to authenticated;

grant UPDATE (full_name) on public.profiles to authenticated;

grant UPDATE (phone) on public.profiles to authenticated;

grant SELECT (discount_percent) on public.reservations to authenticated;

grant UPDATE (address) on public.restaurants to authenticated;

grant UPDATE (category) on public.restaurants to authenticated;

grant UPDATE (cover_url) on public.restaurants to authenticated;

grant UPDATE (description) on public.restaurants to authenticated;

grant UPDATE (district) on public.restaurants to authenticated;

grant UPDATE (hours) on public.restaurants to authenticated;

grant UPDATE (instagram) on public.restaurants to authenticated;

grant UPDATE (logo_url) on public.restaurants to authenticated;

grant UPDATE (menu_url) on public.restaurants to authenticated;

grant UPDATE (name) on public.restaurants to authenticated;

grant UPDATE (phone) on public.restaurants to authenticated;

grant INSERT (discount_far) on public.slots to authenticated;

grant UPDATE (discount_far) on public.slots to authenticated;

grant INSERT (discount_mid) on public.slots to authenticated;

grant UPDATE (discount_mid) on public.slots to authenticated;


-- ---------- 12) Fotoğraf deposu (bucket) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('restaurant-images', 'restaurant-images', 't', '2097152', '{image/jpeg,image/png,image/webp}') on conflict (id) do nothing;

-- ---------- Yama 8: kontenjan kontrolü ----------
create or replace function check_slot_capacity()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  booked int;
begin
  if new.capacity < old.capacity then
    select coalesce(sum(party_size), 0) into booked
    from reservations
    where slot_id = new.id and status <> 'cancelled';
    if new.capacity < booked then
      raise exception 'Bu slotta zaten % kişilik rezervasyon var, kontenjan bunun altına düşürülemez.', booked;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_slot_capacity on slots;
create trigger trg_check_slot_capacity
  before update of capacity on slots
  for each row execute function check_slot_capacity();

-- ---------- Yama 9: müşteri kişi sayısını değiştirebilir ----------
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

-- ---------- Yama 10: kötüye kullanım koruması (önceki tanımların üzerine yazar) ----------
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
