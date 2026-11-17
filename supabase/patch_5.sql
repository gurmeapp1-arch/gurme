-- Yönetici: kullanıcıları listele ve (bağlı kayıtlarıyla birlikte) sil

create or replace function admin_list_users()
returns table (
  id uuid, email text, full_name text, phone text,
  role text, created_at timestamptz, restaurant_name text
)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function admin_list_users() from public;
revoke all on function admin_delete_user(uuid) from public;
grant execute on function admin_list_users() to authenticated;
grant execute on function admin_delete_user(uuid) to authenticated;
