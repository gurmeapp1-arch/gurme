-- =====================================================
-- VERİTABANI YEDEĞİ (yapı): Supabase > SQL Editor > New query'ye yapıştırıp RUN
-- Hiçbir şeyi değiştirmez, sadece okur. Sonuç tablosunda her satır bir SQL komutudur.
-- Sonucu CSV olarak indirip (Results'ın sağ üstündeki Export / "Download CSV") bana gönder.
-- =====================================================
with parts as (
  -- 0) Özel türler (enum)
  select 0 as ord, t.typname::text as name,
    'create type public.' || quote_ident(t.typname) || ' as enum ('
      || string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder) || ');' as stmt
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace and n.nspname = 'public'
  group by t.typname

  union all
  -- 1) Tablolar
  select 1, c.relname::text,
    'create table if not exists public.' || quote_ident(c.relname) || ' (' || E'\n  '
      || string_agg(
           quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
           || case when a.attnotnull then ' not null' else '' end
           || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), ''),
           E',\n  ' order by a.attnum)
      || E'\n);'
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  where c.relkind = 'r'
  group by c.relname

  union all
  -- 2) Birincil anahtar, benzersiz ve kontrol kuralları
  select 2, k.relname::text,
    'alter table public.' || quote_ident(k.relname) || ' add constraint ' || quote_ident(o.conname)
      || ' ' || pg_get_constraintdef(o.oid) || ';'
  from pg_constraint o
  join pg_class k on k.oid = o.conrelid
  where o.connamespace = (select oid from pg_namespace where nspname = 'public') and o.contype in ('p', 'u', 'c')

  union all
  -- 3) Yabancı anahtarlar
  select 3, k.relname::text,
    'alter table public.' || quote_ident(k.relname) || ' add constraint ' || quote_ident(o.conname)
      || ' ' || pg_get_constraintdef(o.oid) || ';'
  from pg_constraint o
  join pg_class k on k.oid = o.conrelid
  where o.connamespace = (select oid from pg_namespace where nspname = 'public') and o.contype = 'f'

  union all
  -- 4) Dizinler (kural kaynaklı olanlar hariç)
  select 4, indexname::text, indexdef || ';'
  from pg_indexes
  where schemaname = 'public'
    and indexname not in (select conname from pg_constraint)

  union all
  -- 5) Fonksiyonlar
  select 5, p.proname::text, pg_get_functiondef(p.oid) || ';'
  from pg_proc p
  where p.pronamespace = (select oid from pg_namespace where nspname = 'public') and p.prokind = 'f'

  union all
  -- 6) Görünümler
  select 6, viewname::text,
    'create or replace view public.' || quote_ident(viewname) || ' as ' || definition
  from pg_views
  where schemaname = 'public'

  union all
  -- 7) Tetikleyiciler (public ve auth tabloları)
  select 7, t.tgname::text, pg_get_triggerdef(t.oid) || ';'
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace and n.nspname in ('public', 'auth')
  where not t.tgisinternal

  union all
  -- 8) Satır güvenliği (RLS) açık olan tablolar
  select 8, c.relname::text,
    'alter table public.' || quote_ident(c.relname) || ' enable row level security;'
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  where c.relkind = 'r' and c.relrowsecurity

  union all
  -- 9) Erişim kuralları (policy): public ve storage
  select 9, (schemaname || '.' || tablename || '.' || policyname)::text,
    'create policy ' || quote_ident(policyname) || ' on ' || schemaname || '.' || quote_ident(tablename)
      || ' as ' || lower(permissive) || ' for ' || lower(cmd)
      || ' to ' || array_to_string(roles, ', ')
      || coalesce(' using (' || qual || ')', '')
      || coalesce(' with check (' || with_check || ')', '') || ';'
  from pg_policies
  where schemaname in ('public', 'storage')

  union all
  -- 10) Tablo ve görünüm yetkileri (anon / authenticated)
  select 10, (c.relname || '.' || r.rolname || '.' || x.privilege_type)::text,
    'grant ' || x.privilege_type || ' on public.' || quote_ident(c.relname) || ' to ' || r.rolname || ';'
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  cross join lateral aclexplode(c.relacl) x
  join pg_roles r on r.oid = x.grantee and r.rolname in ('anon', 'authenticated')
  where c.relkind in ('r', 'v')

  union all
  -- 11) Sütun bazlı yetkiler
  select 11, (c.relname || '.' || a.attname || '.' || r.rolname || '.' || x.privilege_type)::text,
    'grant ' || x.privilege_type || ' (' || quote_ident(a.attname) || ') on public.'
      || quote_ident(c.relname) || ' to ' || r.rolname || ';'
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  cross join lateral aclexplode(a.attacl) x
  join pg_roles r on r.oid = x.grantee and r.rolname in ('anon', 'authenticated')
  where a.attacl is not null

  union all
  -- 12) Fotoğraf deposu (bucket) ayarları
  select 12, b.id::text,
    format(
      'insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (%L, %L, %L, %L, %L) on conflict (id) do nothing;',
      b.id, b.name, b."public", b.file_size_limit, b.allowed_mime_types)
  from storage.buckets b
)
select row_number() over (order by ord, name, stmt) as n, stmt
from parts
order by n;
