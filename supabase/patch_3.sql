-- Kayıt kaynağı takibi (QR, yurt grubu vb.)
alter table profiles add column if not exists signup_source text;

create or replace function set_signup_source(p_source text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
     set signup_source = left(regexp_replace(lower(coalesce(p_source, '')), '[^a-z0-9_-]', '', 'g'), 40)
   where id = auth.uid() and signup_source is null;
end;
$$;

revoke all on function set_signup_source(text) from public;
grant execute on function set_signup_source(text) to authenticated;
