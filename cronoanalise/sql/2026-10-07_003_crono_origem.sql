-- Cronoanálise v0.4.0: separa as folhas novas da planilha antiga (09 a 22/09/2026).
-- Linhas que já existem ficam como 'folha'.
alter table public.crono_registros
  add column if not exists origem text not null default 'folha'
  check (origem in ('folha', 'planilha_antiga'));
create index if not exists crono_registros_origem_idx on public.crono_registros(origem);
