-- RSVP storage for the Ahmad & Menna invitation (Supabase project: ahmad-menna-wedding).
-- Guests (anon key) may only INSERT. Nobody can SELECT through the API;
-- responses are read only through get_rsvps(), which checks the passcode in the database
-- and locks out everyone for 15 minutes after 10 wrong passcodes.
-- Replace __PASSCODE__ with the real passcode before running. Do not commit the real value.

-- Every companion must be {"type": "adult"|"child", "name": "<1-120 chars>"}; at most 20.
create or replace function public.valid_companions(c jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(c) = 'array'
     and jsonb_array_length(c) <= 20
     and not exists (
       select 1 from jsonb_array_elements(c) e
       where jsonb_typeof(e) <> 'object'
          or coalesce(e->>'type', '') not in ('adult', 'child')
          or coalesce(jsonb_typeof(e->'name'), '') <> 'string'
          or char_length(btrim(e->>'name')) not between 1 and 120
          or (select count(*) from jsonb_object_keys(e)) > 2
     )
$$;

create table if not exists public.rsvps (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  attending boolean not null,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  companions jsonb not null default '[]'::jsonb,
  song text check (song is null or char_length(song) <= 200),
  message text check (message is null or char_length(message) <= 2000)
);

alter table public.rsvps drop constraint if exists rsvps_companions_check;
alter table public.rsvps drop constraint if exists rsvps_companions_valid;
alter table public.rsvps add constraint rsvps_companions_valid check (public.valid_companions(companions));

alter table public.rsvps enable row level security;

revoke all on public.rsvps from anon, authenticated;
grant insert (attending, full_name, companions, song, message) on public.rsvps to anon;

drop policy if exists "guests can submit rsvps" on public.rsvps;
create policy "guests can submit rsvps" on public.rsvps
  for insert to anon
  with check (true);

-- Failed passcode attempts live in a schema the Data API does not expose.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.passcode_failures (
  at timestamptz not null default now()
);

drop function if exists public.get_rsvps(text);
create function public.get_rsvps(passcode text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  recent int;
begin
  select count(*) into recent from private.passcode_failures where at > now() - interval '15 minutes';
  if recent >= 10 then
    return jsonb_build_object('error', 'locked');
  end if;

  if passcode is distinct from '__PASSCODE__' then
    insert into private.passcode_failures default values;
    delete from private.passcode_failures where at < now() - interval '1 day';
    return jsonb_build_object('error', 'invalid_passcode');
  end if;

  return jsonb_build_object('rows', coalesce(
    (select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.rsvps r),
    '[]'::jsonb
  ));
end;
$$;

revoke all on function public.get_rsvps(text) from public;
grant execute on function public.get_rsvps(text) to anon;
