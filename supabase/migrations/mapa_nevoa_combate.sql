-- (Já aplicada no projeto; guardada como registro.)
-- v2 do mapa: névoa de guerra, o que cada jogador recebe (map_views), objetos escondidos pela névoa e combate.
alter table public.maps add column fog text check (fog is null or char_length(fog) <= 60000);
alter table public.maps add column fog_cols int check (fog_cols is null or fog_cols between 1 and 2000);
alter table public.maps add column fog_rows int check (fog_rows is null or fog_rows between 1 and 2000);
alter table public.map_objs add column cell int;

create table public.map_views (
  map_id uuid primary key references public.maps(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null default 'Mapa' check (char_length(name) between 1 and 80),
  view jsonb not null default '{}'::jsonb check (jsonb_typeof(view) = 'object' and pg_column_size(view) < 16000),
  pimg text check (pimg is null or char_length(pimg) <= 300),
  shown boolean not null default false,
  rev int not null default 0,
  updated_at timestamptz not null default now()
);
create unique index map_views_one_shown on public.map_views (campaign_id) where shown;
create index map_views_campaign on public.map_views (campaign_id);

create function private.bump_rev() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.rev := 0; else new.rev := old.rev + 1; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger map_views_rev before insert or update on public.map_views for each row execute function private.bump_rev();

insert into public.map_views (map_id, campaign_id, name, shown) select id, campaign_id, name, shown from public.maps;

alter table public.map_views enable row level security;
create policy "visao: mestre" on public.map_views for all to authenticated
  using (private.is_owner(campaign_id))
  with check (private.is_owner(campaign_id) and exists (select 1 from public.maps m where m.id = map_id and m.campaign_id = map_views.campaign_id));
create policy "visao: jogador ve a da mesa" on public.map_views for select to authenticated using (shown and private.is_member(campaign_id));
grant select, insert, update, delete on public.map_views to authenticated;

drop policy "mapas: jogador ve o da mesa" on public.maps;

create or replace function private.map_shown(mid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.map_views v where v.map_id = mid and v.shown)
$$;
create or replace function private.can_see_map(obj text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.map_views v where v.pimg = obj and v.shown and private.is_member(v.campaign_id))
$$;
create function private.fog_ok(mid uuid, c int) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select case
      when m.fog is null then true
      when c is null then true
      when c < 0 or c >= coalesce(m.fog_cols, 0) * coalesce(m.fog_rows, 0) then false
      when c >= length(decode(m.fog, 'base64')) * 8 then false
      else get_bit(decode(m.fog, 'base64'), c) = 1
    end
    from public.maps m where m.id = mid), false)
$$;
revoke execute on function private.fog_ok(uuid, int), private.bump_rev() from public, anon;
grant execute on function private.fog_ok(uuid, int) to authenticated;

drop policy "objetos: jogador ve" on public.map_objs;
create policy "objetos: jogador ve" on public.map_objs for select to authenticated
  using (not hidden and private.is_member(campaign_id) and private.map_shown(map_id)
         and (owner = (select auth.uid()) or private.fog_ok(map_id, cell)));

drop function public.move_obj(uuid, numeric, numeric);
-- (move_obj nova: ver mover_calcula_celula.sql)

create or replace function public.set_map(cid uuid, mid uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner(cid) then raise exception 'sem permissão' using errcode = '42501'; end if;
  update public.maps set shown = false where campaign_id = cid and shown;
  update public.map_views set shown = false where campaign_id = cid and shown;
  if mid is not null then
    update public.maps set shown = true where id = mid and campaign_id = cid;
    insert into public.map_views (map_id, campaign_id, name, shown)
      select m.id, m.campaign_id, m.name, true from public.maps m where m.id = mid and m.campaign_id = cid
      on conflict (map_id) do update set shown = true;
  end if;
  return true;
end $$;

create table public.combats (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 16000),
  rev int not null default 0,
  updated_at timestamptz not null default now()
);
create trigger combats_rev before insert or update on public.combats for each row execute function private.bump_rev();
alter table public.combats enable row level security;
create policy "combate: mestre" on public.combats for all to authenticated using (private.is_owner(campaign_id)) with check (private.is_owner(campaign_id));
create policy "combate: jogador ve" on public.combats for select to authenticated using (private.is_member(campaign_id));
grant select, insert, update, delete on public.combats to authenticated;

create function public.set_init(cid uuid, k text, v numeric) returns boolean
language plpgsql security definer set search_path = '' as $$
declare d jsonb; i int; e jsonb; ok boolean := false;
begin
  if not private.is_member(cid) and not private.is_owner(cid) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if v is null or v < -99 or v > 999 then raise exception 'valor inválido'; end if;
  select data into d from public.combats where campaign_id = cid for update;
  if d is null or jsonb_typeof(d->'list') <> 'array' then return false; end if;
  for i in 0 .. jsonb_array_length(d->'list') - 1 loop
    e := d->'list'->i;
    if e->>'k' = k and (private.is_owner(cid) or exists (select 1 from public.map_objs o where o.id::text = k and o.owner = (select auth.uid()) and o.campaign_id = cid)) then
      d := jsonb_set(d, array['list', i::text, 'ini'], to_jsonb(v));
      ok := true;
    end if;
  end loop;
  if ok then update public.combats set data = d where campaign_id = cid; end if;
  return ok;
end $$;
revoke execute on function public.set_init(uuid, text, numeric) from public, anon;
grant execute on function public.set_init(uuid, text, numeric) to authenticated;

alter table public.rolls drop constraint rolls_kind_check;
alter table public.rolls add constraint rolls_kind_check check (kind = any (array['roll','item','luta']));

drop policy "mapas: ver" on storage.objects;
create policy "mapas: ver" on storage.objects for select to authenticated
  using (bucket_id = 'mapas' and (
    private.is_owner(private.uuid_or_null((storage.foldername(name))[1]))
    or (private.is_member(private.uuid_or_null((storage.foldername(name))[1])) and (storage.filename(name) like 't-%' or private.can_see_map(name)))
  ));
