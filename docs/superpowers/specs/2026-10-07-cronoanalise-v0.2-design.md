# Cronoanálise v0.2.0 — Junção (gerador de kit + painel da DEMO)

> Data: 07/10/2026. Aprovado em conversa: caminho A (um sistema só, um arquivo por tela).
> Complementa `2026-10-06-cronoanalise-design.md` (códigos, folhas, ID). O que estiver aqui vale mais.

## 1. Objetivo
Um sistema só, com o visual do SGE, publicado no GitHub Pages, com 4 telas:
1. **Painel**: os gráficos do `sistema (3)`, lendo os dados no formato da DEMO.
2. **Novo documento**: o gerador de kit atual (código CR vindo do banco).
3. **Lançar**: passar uma folha preenchida para o sistema, pelo ID da folha.
4. **Editar**: corrigir ou excluir linhas já lançadas.

## 2. Decisões
| Assunto | Decisão |
|---|---|
| Estrutura | Um `index.html` com menu + um arquivo JS por tela |
| Visual | `sge-core` v1 (`<body class="sge">`) + estilos próprios da folha e dos gráficos |
| Login | **Sem login por enquanto** (decisão do dono, 07/10/2026) |
| Dados | Só **fictícios** (os 974 registros da DEMO) enquanto não houver login. Dados reais entram só depois de ligar o login |
| Formato | Tabela `crono_registros` com as mesmas colunas dos registros da DEMO |
| Publicação | GitHub Pages do repositório `Cronoanalise`, branch `main`, pasta raiz |
| Versão | v0.2.0 |

## 3. Arquivos
```
CRONOANALISE/                  (raiz do repositório)
  index.html                   atalho: redireciona para cronoanalise/
  cronoanalise/
    index.html                 casca: faixa "versão de teste", menu e as 4 telas
    css/cronoanalise.css       estilos da folha impressa, do painel e do menu
    js/config.js               URL e chave publishable, códigos (1–69) e classificação, equipamentos, vagas, supervisores
    js/banco.js                todas as conversas com o Supabase (supabase-js v2 por CDN)
    js/app.js                  menu e troca de telas
    js/kit.js                  tela Novo documento (código atual, só mudado de lugar)
    js/painel-calculo.js       transforma registros em dados dos gráficos (cópia fiel de calcular_painel do gerar_demo.py)
    js/painel.js               desenha os gráficos (código de desenho do sistema (3), adaptado)
    js/lancar.js               tela Lançar
    js/editar.js               tela Editar
    sql/2026-10-07_002_crono_registros.sql
    testes/                    testes do cálculo e das conferências (rodam com Node)
```
Bibliotecas grátis por CDN: supabase-js v2, Chart.js (já usado no sistema (3)), qrcodejs.
O `.gitignore` em lista branca passa a liberar também o `index.html` da raiz.

## 4. Telas

**Menu**: barra no topo com 4 botões (Painel, Novo documento, Lançar, Editar). No celular, os botões quebram em 2 linhas. A tela escolhida fica no endereço (`#painel`, `#kit`, `#lancar`, `#editar`), para o botão Voltar funcionar.
**Faixa no topo**: "Versão de teste: sem login, dados fictícios".

### 4.1 Painel
- As abas do sistema (3): **Dashboard, Timeline por equipe, Produtividade, Equipamentos**, com os mesmos filtros (data e equipe).
- Ao abrir, busca todos os registros em `crono_registros` (em páginas de 1.000) e calcula os gráficos no navegador com `painel-calculo.js`.
- Classificações: **Produzindo**, **Improdutivo necessário** e **Improdutivo** (como na DEMO).
- A aba Lançamentos do sistema (3) sai do Painel e vira a tela Editar.

### 4.2 Novo documento
- O mesmo de hoje: equipamento, vaga, supervisor, data, turno, horário, placa e área. "Gerar kit e imprimir" chama `crono_gerar_kit` e imprime.
- Reimprimir: busca o kit pelo código (CR-0002) no banco e imprime com o mesmo código. A lista local "kits deste computador" continua.

### 4.3 Lançar
1. A pessoa digita o ID da folha (ex.: `CR-0002-OP1`). O sistema busca a folha e o kit, e preenche equipamento, vaga, placa, papel, data, turno, horário, área e supervisor.
   - Se o ID não existir: "Folha não encontrada. Confira o código impresso no topo da folha."
   - Se a folha já tiver linhas lançadas: "Esta folha já foi lançada" e um botão "Abrir em Editar".
2. Digita o nome e as linhas: início, fim, código, E/A (executante/auxiliar) e observação. O botão "+ linha" acrescenta uma linha, já começando no fim da anterior.
3. A descrição e a classificação aparecem sozinhas, pelo código.
4. Conferências ao salvar:
   - **Bloqueia**: linha sem código; código que não vale para aquela folha; fim antes do início (exceto no turno que passa da meia-noite); horários que se sobrepõem.
   - **Só avisa**: buraco entre uma linha e a próxima.
5. Salvar grava as linhas em `crono_registros` de uma vez. O que foi digitado fica guardado no navegador até salvar, para não perder com internet ruim.

### 4.4 Editar
- Filtros: data (de/até), equipamento, vaga, nome e ID da folha.
- A lista de linhas aparece em páginas de 50, como a aba Lançamentos do sistema (3), com os botões ✎ Editar e 🗑 Excluir.
- Editar abre o mesmo formulário do sistema (3). Excluir pede confirmação.
- Também tem "+ Novo lançamento" avulso (sem folha), igual ao do sistema (3), para dados antigos.

## 5. Banco (Supabase PRODUTIVIDADE)

Tabela nova `crono_registros` (formato da DEMO):

| Coluna | Tipo | Exemplo |
|---|---|---|
| id | bigint identity PK | 1 |
| data | date | 2026-09-14 |
| turno | text (≤5) | A |
| horario | text (≤20) | 19h às 07h |
| area | text (≤80) | Alto Forno 3 |
| nome | text (≤80) | Carlos Andrade |
| papel | text: Motorista, Operador 1, Operador 2 | Motorista |
| placa | text (≤20) | DSY6474 |
| vaga | text (≤20) | AV-04 |
| equip | text: Alta Pressão, Vácuo, Hiper Vácuo, Aspirador de Pó | Vácuo |
| hi, hf | text `HH:MM` | 19:00 |
| cod | int 1–69 | 2 |
| descricao | text | Bater Ponto |
| cls | text: Produzindo, Improdutivo necessário, Improdutivo | Improdutivo necessário |
| obs | text (≤300) | |
| exec_aux | text: E, A ou vazio | E |
| supervisor | text (≤40) | Ozias |
| kit | text | CR-0002 |
| folha | text | CR-0002-MOT |
| ficticio | boolean, padrão false | true |
| criado_em, atualizado_em | timestamptz | |

- `desc` vira `descricao` no banco (`desc` é palavra reservada). O `banco.js` devolve no formato da DEMO (`desc`, `execAux`).
- `folha` não tem ligação obrigatória com `crono_folhas`, porque os dados antigos e os fictícios têm códigos de folha que não existem lá.
- Índices: `data`, `folha`.
- **RLS ligado.** Por enquanto, sem login, `anon` pode ler, incluir, alterar e excluir (regras `using (true)`). A revisão do Supabase vai avisar disso, e o aviso é esperado.
- **Antes dos dados reais**: ligar o login e trocar as regras para `authenticated`, com um SQL novo. Os fictícios saem com `delete from crono_registros where ficticio`.
- Carga dos fictícios: os 974 registros da DEMO vão para o banco uma vez, pelo Claude, com `ficticio = true`. O arquivo de carga não vai para o GitHub.

## 6. Cálculo do painel
- `painel-calculo.js` recebe a lista de registros e devolve o mesmo objeto `{timeline, charts}` que hoje fica gravado dentro do HTML da DEMO.
- É uma cópia fiel da função `calcular_painel` do `gerar_demo.py`.
- O desenho dos gráficos (`painel.js`) continua lendo esse objeto como antes. Assim, o código de desenho do sistema (3) muda pouco.
- **Teste de igualdade**: o mesmo conjunto de registros, calculado pelo Python e pelo JS, tem de dar o mesmo resultado (diferença menor que 0,01 h).

## 7. Erros e situações especiais
- Sem internet: "Sem internet. Confira a conexão e tente de novo." Nada se perde do que foi digitado.
- Banco com erro: mensagem simples e botão "Tentar de novo". Nunca uma tela branca.
- Painel sem registros: "Ainda não há lançamentos neste período."
- Impressão do kit: o menu, a faixa e as outras telas não saem no papel.

## 8. Testes
- **Node** (sem instalar nada): igualdade do cálculo (seção 6) e conferências do Lançar (4.3, item 4).
- **Banco**: inserir, editar e excluir uma linha de teste pela chave pública, e depois apagar.
- **Pelo usuário**: computador e celular, F12 sem erro vermelho, impressão do kit, um lançamento completo de ponta a ponta.

## 9. Fora do escopo (agora)
Login; sorteio de placa; quadros de bica e descarte da folha do motorista; exportar Excel; leitura do QR pela câmera; importação dos dados reais (só depois do login).
