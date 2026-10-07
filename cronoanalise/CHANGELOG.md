# CHANGELOG – Cronoanálise

## v0.1.0 (ainda não publicada)
- O botão "Gerar kit e imprimir" pede o código ao Supabase (função `crono_gerar_kit`) e usa o número devolvido pelo banco (CR-0001, CR-0002…). Antes o código era sorteado só na tela.
- Sem internet ou com erro no banco, o kit não é gerado e aparece uma mensagem clara.
- Banco: tabelas `crono_kits` e `crono_folhas` com RLS (arquivo `sql/2026-10-06_001_crono_kits.sql`).
