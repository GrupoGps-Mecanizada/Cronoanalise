# CHANGELOG – Cronoanálise

## v0.2.0 (2026-10-07)
- Correções da revisão: tela Editar aparecia em branco; Painel travava com papel fora da composição (ex.: Motorista no Aspirador); supervisor passa a ser gravado no Lançar; turno 23h às 07h entra no gráfico por horário; erro no desenho não deixa mais a tela branca; menu legível no modo escuro; Editar cabe no celular; conferência de horários lê a virada da meia-noite em sequência.
- Sem faixa de "versão de teste" e sem marcar dados como fictícios: pronto para os dados reais.
- Um sistema só, com o visual do SGE da DEMO e 4 telas no menu: **Painel**, **Novo documento**, **Lançar** e **Editar**.
- Painel: as abas do sistema (3) (Dashboard, Timeline por equipe, Produtividade, Equipamentos), calculadas no navegador a partir do banco.
- Novo documento: o gerador de kit de antes, mais "reimprimir pelo código" (CR-0002) de qualquer computador.
- Lançar: digita o ID da folha (CR-0002-OP1) e as linhas; confere código errado, horário invertido, sobreposto ou vazio, e avisa buracos. Guarda rascunho no aparelho.
- Editar: lista com busca, filtro por data e por folha, páginas de 50, editar e excluir.
- Banco: tabela `crono_registros` no formato da DEMO (`sql/2026-10-07_002_crono_registros.sql`).
- Sem login (decisão do dono): qualquer pessoa com o endereço lê e grava.
- Testes automáticos em `testes/` (cálculo igual ao Python, conferências, banco, editar, lançar).

## v0.1.0 (2026-10-07)
- O botão "Gerar kit e imprimir" pede o código ao Supabase (função `crono_gerar_kit`) e usa o número devolvido pelo banco (CR-0001, CR-0002…). Antes o código era sorteado só na tela.
- Sem internet ou com erro no banco, o kit não é gerado e aparece uma mensagem clara.
- Banco: tabelas `crono_kits` e `crono_folhas` com RLS (arquivo `sql/2026-10-06_001_crono_kits.sql`).
