# Cronoanálise – LEIA-ME

## O que é
Sistema da cronoanálise das equipes (Alta Pressão, Auto Vácuo, Hiper Vácuo e Aspirador de Pó), com 4 telas:

| Tela | Para quê |
|---|---|
| **Painel** | Gráficos: Dashboard, Timeline por equipe, Produtividade e Equipamentos |
| **Novo documento** | Gera o kit de folhas com código único do banco (CR-0002) e imprime. Reimprime pelo código |
| **Lançar** | Passa uma folha preenchida para o sistema, pelo ID impresso (CR-0002-OP1) |
| **Editar** | Busca, corrige e exclui linhas já lançadas |

## Como usar
1. Abra o endereço do GitHub Pages (ou `index.html` por um servidor local).
2. **Novo documento** → escolha equipamento, vaga e supervisor → **Gerar kit e imprimir**.
3. Com a folha preenchida: **Lançar** → digite o ID da folha → nome e linhas (início, fim, código) → **Salvar folha**.
4. O **Painel** mostra o resultado. Correções no **Editar**.

## Banco (Supabase, projeto PRODUTIVIDADE)
- `crono_kits`, `crono_folhas` (função `crono_gerar_kit`) e `crono_registros` (lançamentos, formato da DEMO). RLS ligado em todas.
- Mudanças do banco ficam em `sql/`, com data no nome. Rodar na ordem.
- No navegador vai só a chave pública (`publishable`), em `js/config.js`. Nunca coloque a chave secreta aqui.

## Sem login (decisão do dono, temporária)
Qualquer pessoa com o endereço lê e grava. Por isso **só dados fictícios** (marcados com `ficticio = true`).
**Antes dos dados reais:** ligar o login, trocar as regras de `crono_registros` para `authenticated` (SQL novo) e apagar os fictícios (`delete from crono_registros where ficticio`).

## Arquivos
```
index.html            casca: menu e as 4 telas
css/painel.css        visual da DEMO + menu
css/kit.css           tela do kit e folha A4
js/config.js          banco (chave pública), códigos 1–69, equipamentos, turnos
js/banco.js           todas as conversas com o Supabase
js/painel-calculo.js  registros → gráficos (igual ao gerar_demo.py)
js/painel.js          desenho do painel
js/kit.js             Novo documento
js/conferencias.js    regras do Lançar
js/lancar.js          Lançar
js/editar.js          Editar
js/app.js             menu
sql/                  mudanças do banco
testes/               testes automáticos
```

## Testes (grátis, sem instalar nada além de Python e Node)
```
python -I cronoanalise/testes/gerar_referencia.py
for t in painel-calculo banco editar conferencias lancar; do node cronoanalise/testes/$t.test.js; done
```
`testes/painel-offline.html` (por um servidor local) desenha o Painel com os dados de referência e um texto malicioso, para conferir que nada é executado.

## Demonstração
`gerar_demo.py` cria a versão DEMO, com dados fictícios, a partir do sistema original (que não vai para o GitHub).
