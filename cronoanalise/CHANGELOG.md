# CHANGELOG – Cronoanálise

## v0.2.0 (2026-10-07)
- Um sistema só, com o visual do SGE da DEMO e 4 telas no menu: **Painel**, **Novo documento**, **Lançar** e **Editar**.
- Painel: as abas do sistema (3) (Dashboard, Timeline por equipe, Produtividade, Equipamentos), calculadas no navegador a partir do banco.
- Novo documento: o gerador de kit de antes, mais "reimprimir pelo código" (CR-0002) de qualquer computador.
- Lançar: digita o ID da folha (CR-0002-OP1) e as linhas; confere código errado, horário invertido, sobreposto ou vazio, e avisa buracos. Guarda rascunho no aparelho.
- Editar: lista com busca, filtro por data e por folha, páginas de 50, editar e excluir.
- Banco: tabela `crono_registros` no formato da DEMO (`sql/2026-10-07_002_crono_registros.sql`).
- **Sem login: só dados fictícios.** Dados reais só depois de ligar o login.
- Testes automáticos em `testes/` (cálculo igual ao Python, conferências, banco, editar, lançar).

## v0.1.0 (2026-10-07)
- O botão "Gerar kit e imprimir" pede o código ao Supabase (função `crono_gerar_kit`) e usa o número devolvido pelo banco (CR-0001, CR-0002…). Antes o código era sorteado só na tela.
- Sem internet ou com erro no banco, o kit não é gerado e aparece uma mensagem clara.
- Banco: tabelas `crono_kits` e `crono_folhas` com RLS (arquivo `sql/2026-10-06_001_crono_kits.sql`).
