-- (Já aplicada no projeto; guardada como registro.)
create table public.map_pings (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  map_id uuid not null references public.maps(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  x numeric not null check (x between -100000 and 100000),
  y numeric not null check (y between -100000 and 100000),
  who text not null default '' check (char_length(who) <= 60),
  col text not null default '' check (char_length(col) <= 16),
  at timestamptz not null default now()
);
create index map_pings_campaign on public.map_pings (campaign_id, id);
alter table public.map_pings enable row level security;
create policy "sinais: ver" on public.map_pings for select to authenticated
  using (private.is_owner(campaign_id) or (private.is_member(campaign_id) and private.map_shown(map_id)));
create policy "sinais: apontar" on public.map_pings for insert to authenticated
  with check (user_id = (select auth.uid()) and (private.is_owner(campaign_id) or (private.is_member(campaign_id) and private.map_shown(map_id)))
              and exists (select 1 from public.maps m where m.id = map_id and m.campaign_id = map_pings.campaign_id));
create policy "sinais: mestre limpa" on public.map_pings for delete to authenticated using (private.is_owner(campaign_id));
grant select, insert, delete on public.map_pings to authenticated;

create or replace function private.uuid_or_null(x text) returns uuid language sql immutable set search_path = '' as $$
  select case when x ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then x::uuid end
$$;
