-- (Já aplicada no projeto; guardada como registro.)
-- ao mover um token, o banco calcula a célula (para a névoa) sozinho; o jogador não precisa saber o tamanho da grade
create or replace function public.move_obj(oid uuid, nx numeric, ny numeric, nc int default null) returns boolean
language plpgsql security definer set search_path = '' as $$
declare o public.map_objs; m public.maps; c int; cx int; cy int; sz numeric;
begin
  select * into o from public.map_objs where id = oid;
  if not found or o.gone then return false; end if;
  if not (private.is_owner(o.campaign_id) or (o.kind = 'tok' and o.owner = (select auth.uid()) and private.is_member(o.campaign_id) and not o.hidden and private.map_shown(o.map_id))) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;
  if o.kind = 'tok' then
    select * into m from public.maps where id = o.map_id;
    if m.fog_cols is not null and m.fog_rows is not null and jsonb_typeof(m.cfg->'f0') = 'array' then
      sz := greatest(coalesce((o.data->>'s')::numeric, 1), 0.5);
      if coalesce(m.cfg->>'gt', 'sq') = 'hx' then cx := round(nx); cy := round(ny);
      else cx := round(nx) + floor(sz / 2); cy := round(ny) + floor(sz / 2); end if;
      cx := cx - (m.cfg->'f0'->>0)::int; cy := cy - (m.cfg->'f0'->>1)::int;
      if cx < 0 or cy < 0 or cx >= m.fog_cols or cy >= m.fog_rows then c := -1; else c := cy * m.fog_cols + cx; end if;
    else c := o.cell; end if;
  else
    c := coalesce(nc, o.cell);
  end if;
  update public.map_objs set data = data || jsonb_build_object('x', nx, 'y', ny), cell = c where id = oid;
  return true;
end $$;
revoke execute on function public.move_obj(uuid, numeric, numeric, int) from public, anon;
grant execute on function public.move_obj(uuid, numeric, numeric, int) to authenticated;
