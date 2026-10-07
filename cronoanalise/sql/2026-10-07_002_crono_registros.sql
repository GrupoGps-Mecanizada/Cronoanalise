-- Cronoanálise v0.2.0: lançamentos no formato da DEMO.
-- SEM LOGIN por enquanto: anon lê e grava. Só dados fictícios até ligar o login.
create table if not exists public.crono_registros (
  id            bigint generated always as identity primary key,
  data          date not null,
  turno         text check (turno in ('A','B','C','D','ADM','16 Horas')),
  horario       text check (char_length(horario) <= 20),
  area          text check (char_length(area) <= 80),
  nome          text check (char_length(nome) <= 80),
  papel         text not null check (papel in ('Motorista','Operador 1','Operador 2')),
  placa         text check (char_length(placa) <= 20),
  vaga          text check (char_length(vaga) <= 20),
  equip         text not null check (equip in ('Alta Pressão','Vácuo','Hiper Vácuo','Aspirador de Pó')),
  hi            text not null check (hi ~ '^[0-2][0-9]:[0-5][0-9]$'),
  hf            text not null check (hf ~ '^[0-2][0-9]:[0-5][0-9]$'),
  cod           int  check (cod between 1 and 69),
  descricao     text check (char_length(descricao) <= 120),
  cls           text check (cls in ('Produzindo','Improdutivo necessário','Improdutivo')),
  obs           text check (char_length(obs) <= 300),
  exec_aux      text check (exec_aux in ('E','A')),
  supervisor    text check (char_length(supervisor) <= 40),
  kit           text check (char_length(kit) <= 30),
  folha         text check (char_length(folha) <= 40),
  ficticio      boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists crono_registros_data_idx  on public.crono_registros(data);
create index if not exists crono_registros_folha_idx on public.crono_registros(folha);

alter table public.crono_registros enable row level security;

-- TEMPORÁRIO (sem login). Trocar para authenticated antes dos dados reais.
drop policy if exists "crono_registros: anon lê"     on public.crono_registros;
drop policy if exists "crono_registros: anon inclui" on public.crono_registros;
drop policy if exists "crono_registros: anon altera" on public.crono_registros;
drop policy if exists "crono_registros: anon exclui" on public.crono_registros;
create policy "crono_registros: anon lê"     on public.crono_registros for select to anon, authenticated using (true);
create policy "crono_registros: anon inclui" on public.crono_registros for insert to anon, authenticated with check (true);
create policy "crono_registros: anon altera" on public.crono_registros for update to anon, authenticated using (true) with check (true);
create policy "crono_registros: anon exclui" on public.crono_registros for delete to anon, authenticated using (true);

create or replace function public.crono_registros_atualizado() returns trigger
language plpgsql set search_path = public as $$
begin new.atualizado_em := now(); return new; end; $$;
drop trigger if exists crono_registros_atualizado on public.crono_registros;
create trigger crono_registros_atualizado before update on public.crono_registros
  for each row execute function public.crono_registros_atualizado();
