# Cronoanálise – LEIA-ME

## O que é
Uma página só (`index.html`) que monta e imprime o kit de folhas de cronoanálise de um equipamento:
- Alta Pressão e Hiper Vácuo: Motorista, Operador 1 e Operador 2
- Auto Vácuo: Motorista e Operador 1
- Aspirador de Pó: Operador 1 e Operador 2

## Como usar
1. Abra `index.html` no navegador (computador ou celular).
2. Escolha o equipamento, a vaga e o supervisor (o turno é marcado sozinho).
3. Clique em **Gerar kit e imprimir**. O banco devolve o código do kit (ex.: CR-0001) e a impressão abre.
   "Só ver prévia" mostra as folhas sem gerar código (não use para medir).

## Banco (Supabase, projeto PRODUTIVIDADE)
- Tabelas `crono_kits` e `crono_folhas`, com RLS ligado. Leitura aberta; gravação só pela função `crono_gerar_kit`.
- Mudanças do banco ficam em `sql/`, com data no nome.
- No navegador vai só a chave pública (`publishable`). Nunca coloque a chave secreta aqui.

## Sem login (decisão do dono)
Qualquer pessoa com a página consegue gerar kits. Se precisar restringir, ligar a Central de Login do SGE e tirar o acesso `anon` da função.

## Demonstração
`gerar_demo.py` cria a versão DEMO, com dados fictícios, a partir do sistema original (que não vai para o GitHub).
