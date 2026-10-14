-- Cronoanálise v0.6.0 · entra no Portal SGE (pedido do Warlison, 14/10/2026).
-- Abre dentro do portal em /cronoanalise/ (o roteador do portal manda para sge-cronoanalise.pages.dev).
-- O "Mapeamento de Atividades" continua no portal (decisão do dono). A Cronoanálise segue sem login próprio por enquanto.
-- Libera ADMIN para quem é ADMIN da Central (sge_hub); os demais acessos são dados na tela de Usuários da Central.
-- Pode rodar de novo sem duplicar nada. Rodar no Supabase onde fica a Central (schema gps_compartilhado).

begin;

-- 1. Sistema no menu do portal (área Operação, logo depois do Mapeamento de Atividades)
insert into gps_compartilhado.sge_central_sistemas
  (slug, nome, descricao, url_origem, icone, cor, area_menu, ordem, abre_fora, mostrar_portal, is_active)
values
  ('cronoanalise', 'Cronoanálise', 'Tempo das equipes em campo: o que é produção, preparação e espera', '/cronoanalise/',
   'clock', '#1d4fa3', 'Operação', 7, false, true, true)
on conflict (slug) do update set
  nome = excluded.nome, descricao = excluded.descricao, url_origem = excluded.url_origem,
  abre_fora = false, mostrar_portal = true, is_active = true;

-- 2. Acesso: os ADMIN da Central veem a Cronoanálise no portal
insert into gps_compartilhado.acesso_permissoes (usuario_id, sistema_id, papel, ativo)
select adm.usuario_id, s.id, 'ADMIN', true
from gps_compartilhado.sge_central_sistemas s
cross join (select distinct p.usuario_id from gps_compartilhado.acesso_permissoes p
            join gps_compartilhado.sge_central_sistemas c on c.id = p.sistema_id and c.slug = 'sge_hub'
            where p.papel = 'ADMIN' and p.ativo) adm
where s.slug = 'cronoanalise'
on conflict (usuario_id, sistema_id) do nothing;

-- 3. Conferência: espera 1 linha com url_origem /cronoanalise/, mostrar_portal = true e o número de ADMIN liberados
select s.slug, s.nome, s.url_origem, s.mostrar_portal, s.abre_fora, count(ap.*) as pessoas_com_acesso
from gps_compartilhado.sge_central_sistemas s
left join gps_compartilhado.acesso_permissoes ap on ap.sistema_id = s.id and ap.ativo
where s.slug = 'cronoanalise'
group by 1, 2, 3, 4, 5;

commit;
