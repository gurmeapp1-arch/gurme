-- =====================================================
-- YAMA 8: Slot kontenjanı, mevcut rezervasyonların altına düşürülemesin
-- Supabase > SQL Editor > New query'ye (BOŞ sorgu) yapıştırıp RUN
-- Tekrar çalıştırılırsa zarar vermez.
-- =====================================================
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
