-- RSVP storage for the Ahmad & Menna invitation (Supabase project: ahmad-menna-wedding).
-- Guests (anon key) may only INSERT. Nobody can SELECT through the API;
-- responses are read only through get_rsvps(), which checks the passcode in the database.
-- Replace __PASSCODE__ with the real passcode before running. Do not commit the real value.

create table if not exists public.rsvps (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  attending boolean not null,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  companions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(companions) = 'array' and jsonb_array_length(companions) <= 20),
  song text check (song is null or char_length(song) <= 200),
  message text check (message is null or char_length(message) <= 2000)
);

alter table public.rsvps enable row level security;

revoke all on public.rsvps from anon, authenticated;
grant insert (attending, full_name, companions, song, message) on public.rsvps to anon;

drop policy if exists "guests can submit rsvps" on public.rsvps;
create policy "guests can submit rsvps" on public.rsvps
  for insert to anon
  with check (true);

create or replace function public.get_rsvps(passcode text)
returns setof public.rsvps
language plpgsql
security definer
set search_path = public
as $$
begin
  if passcode is distinct from '__PASSCODE__' then
    raise exception 'invalid passcode' using errcode = '28P01';
  end if;
  return query select * from public.rsvps order by created_at desc;
end;
$$;

revoke all on function public.get_rsvps(text) from public;
grant execute on function public.get_rsvps(text) to anon;
