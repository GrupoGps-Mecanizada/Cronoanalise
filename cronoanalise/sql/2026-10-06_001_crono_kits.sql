-- Cronoanálise: kits e folhas com ID único (CR-0001, CR-0001-OP1...)
-- Projeto Supabase: PRODUTIVIDADE. Só lê frota_equipamento; não altera tabelas existentes.

create table if not exists public.crono_kits (
  id             bigint generated always as identity primary key,
  codigo         text generated always as ('CR-' || lpad(id::text, 4, '0')) stored unique,
  tipo           text not null check (tipo in ('ap','av','hv','as')),
  equipamento_id bigint references public.frota_equipamento(id),
  placa          text check (char_length(placa) <= 20),
  vaga           text check (char_length(vaga) <= 20),
  data           date,
  turno          text check (char_length(turno) <= 5),
  horario        text check (char_length(horario) <= 10),
  area           text check (char_length(area) <= 80),
  status         text not null default 'impresso'
                 check (status in ('impresso','parcial','concluido','cancelado')),
  criado_em      timestamptz not null default now()
);

create table if not exists public.crono_folhas (
  id        text primary key,                       -- ex.: CR-0001-OP1
  kit_id    bigint not null references public.crono_kits(id) on delete cascade,
  modelo    text not null check (modelo in ('AP-MOT','AP-OP','AV-MOT','AV-OP','HV-MOT','HV-OP','AS-OP')),
  papel     text not null check (papel in ('MOT','OP1','OP2')),
  status    text not null default 'impressa' check (status in ('impressa','lancada')),
  criado_em timestamptz not null default now()
);

create index if not exists crono_folhas_kit_idx on public.crono_folhas(kit_id);
create index if not exists crono_kits_data_idx on public.crono_kits(data);

alter table public.crono_kits   enable row level security;
alter table public.crono_folhas enable row level security;

-- Leitura liberada (reimpressão). Gravação só pela função abaixo.
drop policy if exists "crono_kits: leitura" on public.crono_kits;
create policy "crono_kits: leitura" on public.crono_kits
  for select to anon, authenticated using (true);
drop policy if exists "crono_folhas: leitura" on public.crono_folhas;
create policy "crono_folhas: leitura" on public.crono_folhas
  for select to anon, authenticated using (true);

-- Cria o kit e as folhas certas numa operação só e devolve os IDs.
create or replace function public.crono_gerar_kit(
  p_tipo text, p_equipamento_id bigint, p_placa text, p_vaga text,
  p_data date, p_turno text, p_horario text, p_area text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kit   public.crono_kits;
  v_sigla text := upper(p_tipo);
  v_papel text;
  v_papeis text[];
  v_folhas jsonb := '[]'::jsonb;
begin
  v_papeis := case p_tipo
    when 'ap' then array['MOT','OP1','OP2']
    when 'hv' then array['MOT','OP1','OP2']
    when 'av' then array['MOT','OP1']
    when 'as' then array['OP1','OP2']
    else null end;
  if v_papeis is null then
    raise exception 'Tipo de equipamento inválido: %', p_tipo;
  end if;

  insert into public.crono_kits (tipo, equipamento_id, placa, vaga, data, turno, horario, area)
  values (p_tipo, p_equipamento_id, nullif(trim(p_placa),''), nullif(trim(p_vaga),''),
          p_data, nullif(p_turno,''), nullif(p_horario,''), nullif(trim(p_area),''))
  returning * into v_kit;

  foreach v_papel in array v_papeis loop
    insert into public.crono_folhas (id, kit_id, modelo, papel)
    values (v_kit.codigo || '-' || v_papel, v_kit.id,
            v_sigla || '-' || case when v_papel = 'MOT' then 'MOT' else 'OP' end, v_papel);
    v_folhas := v_folhas || jsonb_build_object(
      'id', v_kit.codigo || '-' || v_papel,
      'modelo', v_sigla || '-' || case when v_papel = 'MOT' then 'MOT' else 'OP' end,
      'papel', v_papel);
  end loop;

  return jsonb_build_object('codigo', v_kit.codigo, 'kit', to_jsonb(v_kit), 'folhas', v_folhas);
end;
$$;

revoke all on function public.crono_gerar_kit(text,bigint,text,text,date,text,text,text) from public;
grant execute on function public.crono_gerar_kit(text,bigint,text,text,date,text,text,text) to anon, authenticated;
