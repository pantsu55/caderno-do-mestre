-- Mapas da mesa: imagem + grade, com tokens e objetos. O Mestre edita; jogadores só movem o próprio token.
-- (Já aplicada no projeto; guardada aqui como registro.)
create sequence if not exists private.map_seq;

create table public.maps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null default 'Mapa' check (char_length(name) between 1 and 80),
  img text check (img is null or char_length(img) <= 300),
  cfg jsonb not null default '{}'::jsonb check (jsonb_typeof(cfg) = 'object' and pg_column_size(cfg) < 8000),
  shown boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index maps_one_shown on public.maps (campaign_id) where shown;
create index maps_campaign on public.maps (campaign_id);

create table public.map_objs (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.maps(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  kind text not null check (kind in ('tok','obj')),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 4000),
  owner uuid references auth.users(id) on delete set null,
  hidden boolean not null default false,
  gone boolean not null default false,
  seq bigint not null default 0,
  updated_at timestamptz not null default now()
);
create index map_objs_map_seq on public.map_objs (map_id, seq);
create index map_objs_campaign on public.map_objs (campaign_id);

create function private.map_touch() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_table_name = 'map_objs' then new.seq := nextval('private.map_seq'); end if;
  return new;
end $$;
create trigger map_objs_touch before insert or update on public.map_objs for each row execute function private.map_touch();
create trigger maps_touch before insert or update on public.maps for each row execute function private.map_touch();

create function private.map_shown(mid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.maps m where m.id = mid and m.shown)
$$;
create function private.can_see_map(obj text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.maps m where m.img = obj and m.shown and (private.is_member(m.campaign_id) or private.is_owner(m.campaign_id)))
$$;

alter table public.maps enable row level security;
alter table public.map_objs enable row level security;

create policy "mapas: mestre" on public.maps for all to authenticated
  using (private.is_owner(campaign_id)) with check (private.is_owner(campaign_id));
create policy "mapas: jogador ve o da mesa" on public.maps for select to authenticated
  using (shown and private.is_member(campaign_id));
create policy "objetos: mestre" on public.map_objs for all to authenticated
  using (private.is_owner(campaign_id)) with check (private.is_owner(campaign_id) and exists (select 1 from public.maps m where m.id = map_id and m.campaign_id = map_objs.campaign_id));
create policy "objetos: jogador ve" on public.map_objs for select to authenticated
  using (not hidden and private.is_member(campaign_id) and private.map_shown(map_id));

grant select, insert, update, delete on public.maps, public.map_objs to authenticated;

create function public.move_obj(oid uuid, nx numeric, ny numeric) returns boolean
language plpgsql security definer set search_path = '' as $$
declare o public.map_objs;
begin
  select * into o from public.map_objs where id = oid;
  if not found or o.gone then return false; end if;
  if not (private.is_owner(o.campaign_id) or (o.kind = 'tok' and o.owner = (select auth.uid()) and private.is_member(o.campaign_id) and not o.hidden and private.map_shown(o.map_id))) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  update public.map_objs set data = data || jsonb_build_object('x', nx, 'y', ny) where id = oid;
  return true;
end $$;

create function public.patch_obj(oid uuid, p jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare o public.map_objs;
begin
  select * into o from public.map_objs where id = oid;
  if not found then return false; end if;
  if not private.is_owner(o.campaign_id) then raise exception 'sem permissão' using errcode = '42501'; end if;
  if jsonb_typeof(p) <> 'object' then raise exception 'formato inválido'; end if;
  update public.map_objs set data = data || p where id = oid;
  return true;
end $$;

create function public.set_map(cid uuid, mid uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner(cid) then raise exception 'sem permissão' using errcode = '42501'; end if;
  update public.maps set shown = false where campaign_id = cid and shown;
  if mid is not null then update public.maps set shown = true where id = mid and campaign_id = cid; end if;
  return true;
end $$;

revoke execute on function public.move_obj(uuid, numeric, numeric), public.patch_obj(uuid, jsonb), public.set_map(uuid, uuid) from public, anon;
grant execute on function public.move_obj(uuid, numeric, numeric), public.patch_obj(uuid, jsonb), public.set_map(uuid, uuid) to authenticated;
revoke execute on function private.map_touch(), private.map_shown(uuid), private.can_see_map(text) from public, anon;
grant execute on function private.map_shown(uuid), private.can_see_map(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mapas', 'mapas', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "mapas: mestre envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'mapas' and private.is_owner(private.uuid_or_null((storage.foldername(name))[1])));
create policy "mapas: mestre troca" on storage.objects for update to authenticated
  using (bucket_id = 'mapas' and private.is_owner(private.uuid_or_null((storage.foldername(name))[1])))
  with check (bucket_id = 'mapas' and private.is_owner(private.uuid_or_null((storage.foldername(name))[1])));
create policy "mapas: mestre apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'mapas' and private.is_owner(private.uuid_or_null((storage.foldername(name))[1])));
create policy "mapas: ver" on storage.objects for select to authenticated
  using (bucket_id = 'mapas' and (
    private.is_owner(private.uuid_or_null((storage.foldername(name))[1]))
    or (private.is_member(private.uuid_or_null((storage.foldername(name))[1])) and (storage.filename(name) like 't-%' or private.can_see_map(name)))
  ));
