# Cronoanálise v0.2.0 — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** juntar o gerador de kit (`cronoanalise/index.html`) e o painel da DEMO num sistema só, com 4 telas (Painel, Novo documento, Lançar, Editar), lendo e gravando no Supabase.

**Architecture:** página estática (GitHub Pages) com uma casca `index.html` e um arquivo JS por tela, sem build. Os dados ficam numa tabela `crono_registros` no formato da DEMO. O painel é calculado no navegador por uma cópia fiel de `calcular_painel` (Python), e um teste prova que os dois dão o mesmo resultado.

**Tech Stack:** HTML/CSS/JS puro (ES2019, sem módulos, scripts clássicos com `window.Crono`), supabase-js v2 (jsDelivr), qrcodejs (cdnjs), Node 18+ só para os testes, Python 3 para gerar a referência dos testes.

**Spec:** `docs/superpowers/specs/2026-10-07-cronoanalise-v0.2-design.md` (e `2026-10-06-cronoanalise-design.md` para códigos e folhas).

## Global Constraints
- Supabase PRODUTIVIDADE `mfsyrsegkvjmefcdaegh`, URL `https://mfsyrsegkvjmefcdaegh.supabase.co`, chave `sb_publishable_rw878qLgcmUdixI8QsejBA_lSXYAsIv`. Nunca chave secreta.
- Sem login nesta versão. Só dados **fictícios** (`ficticio = true`) no banco.
- Classificações exatas: `Produzindo`, `Improdutivo necessário`, `Improdutivo`.
- Equipamentos (valor gravado → rótulo): `Alta Pressão`→Alta Pressão, `Vácuo`→Auto Vácuo, `Hiper Vácuo`→Hiper Vácuo, `Aspirador de Pó`→Aspirador.
- Turnos: `A`, `B`, `C`, `D`, `ADM`, `16 Horas`.
- Textos para o usuário em português simples. Erros: "Sem internet. Confira a conexão e tente de novo." / "O banco não respondeu. Tente de novo em instantes."
- Nada de `sistema (3).html`, PDFs, planilhas ou dados reais no repositório.
- Todo texto vindo do banco é escapado antes de ir para `innerHTML`.
- Versão final: v0.2.0.

## Review Focus
1. **Texto malicioso no banco** (ex.: obs = `<img src=x onerror=alert(1)>`, já que anon grava): o painel e o Editar mostram o texto literal, sem executar nada. Teste na Task 4 (`escaparRegistro`) e checagem manual na Task 9.
2. **Turno que passa da meia-noite** (19h às 07h, 23h às 07h, 15h às 23h terminando 00:10): as horas somam certo e a linha do tempo não "volta". Teste na Task 2 (`minutosDoDia`).
3. **Registro antigo sem kit/folha, sem vaga com número ou com equipamento desconhecido**: o painel não quebra; o registro entra no total e só sai dos gráficos por vaga/equipamento. Teste na Task 2.
4. **Dois cliques em Salvar no Lançar com internet lenta**: grava uma vez só (botão travado até a resposta). Checagem manual na Task 6.
5. **Folha já lançada sendo lançada de novo**: o Lançar avisa e manda para o Editar, sem duplicar linhas. Teste na Task 5 (`conferirLinhas` não cobre; a busca `folhaJaLancada` sim, checagem manual na Task 6).

---

### Task 1: Tabela `crono_registros` no banco

**Files:**
- Create: `cronoanalise/sql/2026-10-07_002_crono_registros.sql`

**Interfaces:**
- Produces: tabela `public.crono_registros` (colunas da spec §5), acessível por `anon` (select/insert/update/delete).

- [ ] **Step 1: Escrever o SQL**

```sql
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
```

- [ ] **Step 2: Aplicar** com `apply_migration` (nome `crono_registros`). Se for recusado como produção, **não contornar**: pedir ao usuário para rodar o arquivo no SQL Editor e esperar o "ok".
- [ ] **Step 3: Conferir** com `list_tables` (crono_registros com RLS) e `get_advisors` security. Esperado: novos avisos "RLS policy always true" para crono_registros (aceitos, temporários).
- [ ] **Step 4: Testar pela chave pública** (curl): inserir 1 linha com `"ficticio":true`, ler, alterar `obs`, excluir. Cada chamada responde 2xx.

```bash
URL=https://mfsyrsegkvjmefcdaegh.supabase.co/rest/v1/crono_registros
K=sb_publishable_rw878qLgcmUdixI8QsejBA_lSXYAsIv
curl -s -X POST "$URL" -H "apikey: $K" -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"data":"2026-10-07","papel":"Motorista","equip":"Vácuo","hi":"07:00","hf":"07:10","cod":2,"ficticio":true,"obs":"teste"}'
# anotar o id devolvido e:
curl -s -X PATCH "$URL?id=eq.<id>" -H "apikey: $K" -H "Content-Type: application/json" -d '{"obs":"teste 2"}' -w "%{http_code}\n"
curl -s -X DELETE "$URL?id=eq.<id>" -H "apikey: $K" -w "%{http_code}\n"
```

- [ ] **Step 5: Commit** `git add cronoanalise/sql/2026-10-07_002_crono_registros.sql && git commit -m "Banco: tabela crono_registros (formato da DEMO)"`

---

### Task 2: `config.js` + `painel-calculo.js` com teste de igualdade

**Files:**
- Create: `cronoanalise/js/config.js`, `cronoanalise/js/painel-calculo.js`
- Create: `cronoanalise/testes/gerar_referencia.py`, `cronoanalise/testes/painel-calculo.test.js`
- Modify: `.gitignore` (acrescentar `cronoanalise/testes/referencia.json`)

**Interfaces:**
- Produces (`window.Crono`, e `module.exports` no Node):
  - `Crono.config` = `{ SUPABASE_URL, SUPABASE_CHAVE, CLS_ORDER, DESC /* {cod: texto} */, classe(cod) -> cls, EQUIP /* igual ao Python */, PAPEL_NOME, TURNOS }`
  - `Crono.minutosDoDia(hhmm, horario) -> number` (minutos, +1440 depois da meia-noite)
  - `Crono.calcularPainel(registros) -> {timeline, charts}` (registros no formato da DEMO, sem `_ini/_fim`)

- [ ] **Step 1: `config.js`** — copiar de `gerar_demo.py` linhas 16–71 exatamente (GERAIS, ESPECIFICOS, PRODUZINDO, IMPRODUTIVO, EQUIP, PAPEL_NOME), em JS:

```js
(function (raiz) {
  const PROD = 'Produzindo', NEC = 'Improdutivo necessário', IMP = 'Improdutivo';
  const DESC = { 1: 'Atividade (outra – descrever)', 2: 'Bater Ponto', /* … copiar 1–69 do gerar_demo.py, mesmo texto … */ };
  const PRODUZINDO = new Set([1, 32, 33, 34, 35, 36, 37, 42, 43, 50, 57, 64, 66]);
  const IMPRODUTIVO = new Set([22, 23, 24, 25, 26, 27, 28, 29, 44, 63, 68]);
  const config = {
    SUPABASE_URL: 'https://mfsyrsegkvjmefcdaegh.supabase.co',
    SUPABASE_CHAVE: 'sb_publishable_rw878qLgcmUdixI8QsejBA_lSXYAsIv',
    CLS_ORDER: [PROD, NEC, IMP],
    DESC,
    classe: cod => PRODUZINDO.has(cod) ? PROD : IMPRODUTIVO.has(cod) ? IMP : NEC,
    EQUIP: {
      ap: { nome: 'Alta Pressão', chave: 'alta_pressao', label: 'Alta Pressão', slots: 10, papeis: ['MOT', 'OP1', 'OP2'] },
      av: { nome: 'Vácuo', chave: 'auto_vacuo', label: 'Auto Vácuo', slots: 8, papeis: ['MOT', 'OP1'] },
      hv: { nome: 'Hiper Vácuo', chave: 'hiper_vacuo', label: 'Hiper Vácuo', slots: 4, papeis: ['MOT', 'OP1', 'OP2'] },
      as: { nome: 'Aspirador de Pó', chave: 'aspirador', label: 'Aspirador', slots: 10, papeis: ['OP1', 'OP2'] }
    },
    PAPEL_NOME: { MOT: 'Motorista', OP1: 'Operador 1', OP2: 'Operador 2' },
    TURNOS: ['A', 'B', 'C', 'D', 'ADM', '16 Horas']
  };
  raiz.Crono = Object.assign(raiz.Crono || {}, { config });
  if (typeof module !== 'undefined') module.exports = raiz.Crono;
})(typeof window !== 'undefined' ? window : globalThis);
```
(O `/* … */` acima é instrução para quem executa: o objeto final tem as 64 chaves, copiadas sem mudar uma letra.)

- [ ] **Step 2: `gerar_referencia.py`** — gera a entrada e a saída esperada a partir do próprio gerador:

```python
"""Gera testes/referencia.json: registros fictícios + painel calculado pelo Python."""
import json, os, random, sys
from datetime import date
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import gerar_demo as g

rng = random.Random(20261006)
kits = g.gerar_kits(rng, date(2026, 9, 14), date(2026, 10, 6))
regs = g.montar_registros(kits, rng)
painel = g.calcular_painel(regs, kits)
saida = [{k: v for k, v in r.items() if not k.startswith('_')} for r in regs]
destino = os.path.join(os.path.dirname(__file__), 'referencia.json')
json.dump({'registros': saida, 'painel': painel}, open(destino, 'w', encoding='utf-8'), ensure_ascii=False)
print(len(saida), 'registros ->', destino)
```

Run: `python -I cronoanalise/testes/gerar_referencia.py` → `974 registros -> …referencia.json`

- [ ] **Step 3: Teste (falha primeiro)** `painel-calculo.test.js`:

```js
const assert = require('assert');
const path = require('path');
require('../js/config.js');
const Crono = require('../js/painel-calculo.js');
const ref = require(path.join(__dirname, 'referencia.json'));

function quase(a, b, onde) {
  if (typeof a === 'number' && typeof b === 'number') return assert.ok(Math.abs(a - b) < 0.011, `${onde}: ${a} != ${b}`);
  if (a === null || b === null || typeof a !== 'object') return assert.deepStrictEqual(a, b, onde);
  if (Array.isArray(a)) { assert.strictEqual(a.length, b.length, onde + '.length'); return a.forEach((x, i) => quase(x, b[i], `${onde}[${i}]`)); }
  assert.deepStrictEqual(Object.keys(a).sort(), Object.keys(b).sort(), onde + ' chaves');
  Object.keys(a).forEach(k => quase(a[k], b[k], `${onde}.${k}`));
}

// 1) igualdade com o Python
quase(Crono.calcularPainel(ref.registros), ref.painel, 'painel');

// 2) meia-noite
assert.strictEqual(Crono.minutosDoDia('01:00', '19h às 07h'), 25 * 60);
assert.strictEqual(Crono.minutosDoDia('20:00', '19h às 07h'), 20 * 60);
assert.strictEqual(Crono.minutosDoDia('00:10', '15h às 23h'), 24 * 60 + 10);
assert.strictEqual(Crono.minutosDoDia('08:00', '07h às 17h'), 8 * 60);
assert.strictEqual(Crono.minutosDoDia('08:00', ''), 8 * 60);

// 3) registros soltos não quebram
const solto = { data: '2026-10-01', turno: 'A', horario: '07h às 17h', area: 'X', nome: 'N', papel: 'Motorista',
  placa: null, vaga: 'sem numero', equip: 'Desconhecido', hi: '07:00', hf: '08:00', cod: 2, desc: 'Bater Ponto',
  cls: 'Improdutivo necessário', obs: null, kit: null, folha: null, execAux: null, supervisor: null };
const p = Crono.calcularPainel([solto]);
assert.strictEqual(p.timeline.overall.totalHoras, 1);
assert.strictEqual(p.timeline.crews.length, 1);
console.log('OK painel-calculo');
```

Run: `node cronoanalise/testes/painel-calculo.test.js` → FAIL (`Cannot find module '../js/painel-calculo.js'`).

- [ ] **Step 4: `painel-calculo.js`** — tradução linha a linha de `calcular_painel` (gerar_demo.py 281–393), com estas regras:
  - Os kits saem dos registros: agrupar por `r.kit` ou, se não tiver, por `data|vaga|turno|horario|equip`, **na ordem em que aparecem**. Tipo do kit = chave de `EQUIP` cujo `nome === r.equip`. Se não houver, usar `{nome: r.equip, label: r.equip, papeis: [papel do registro]}`.
  - `_ini = minutosDoDia(hi, horario)`; `_fim = minutosDoDia(hf, horario)`; se `_fim < _ini`, `_fim += 1440`.
  - `minutosDoDia(hhmm, horario)`: `m = hh*60+mm`; `ini = número antes do "h"` em `horario` (ex.: "19h às 07h" → 19); se existir e `m < (ini-4)*60`, `m += 1440`.
  - Registro com `cls` fora de `CLS_ORDER`: conta em `totalRegistros` mas não soma horas.
  - Registro com `equip` desconhecido ou `vaga` sem número: soma no geral, turno, horário e papel; fica fora de `equip`/`vagas`/`equipOverall`.
  - `round(x, 2)` → `Math.round(x * 100) / 100`. `pctProd` sem arredondar, `null` se total 0.
  - Ordenação das equipes: `sort` estável por `data` decrescente, depois `id` = índice.
  - O segmento copia o registro (sem `_`) e acrescenta `startMin`/`endMin`.
  - Exportar `Crono.minutosDoDia` e `Crono.calcularPainel`; no Node, `module.exports = Crono`.

- [ ] **Step 5: Rodar** `node cronoanalise/testes/painel-calculo.test.js` → `OK painel-calculo`. Se a igualdade falhar, corrigir o JS (o Python é a referência).
- [ ] **Step 6: Commit** (sem `referencia.json`): `git add .gitignore cronoanalise/js cronoanalise/testes && git commit -m "Cálculo do painel em JS igual ao Python"`

---

### Task 3: Casca (`index.html`, `app.js`, CSS) + tela Novo documento

**Files:**
- Modify: `cronoanalise/index.html` (vira a casca)
- Create: `cronoanalise/css/painel.css` (CSS da DEMO, linhas 5–264 de `sistema (3) - DEMO dados ficticios.html`)
- Create: `cronoanalise/css/kit.css` (CSS atual do kit, linhas 9–114 de `cronoanalise/index.html`)
- Create: `cronoanalise/js/app.js`, `cronoanalise/js/kit.js` (JS atual do kit, linhas 179–627)

**Interfaces:**
- Produces: `Crono.app.ir(tela)`, `Crono.app.painelDesatualizado()`, telas `#tela-painel`, `#tela-kit`, `#tela-lancar`, `#tela-editar`; `Crono.esc(texto)`.

- [ ] **Step 1: `kit.css`** — copiar o `<style>` atual. Prefixar com `#tela-kit ` todas as regras da seção "TELA" (`.tela`, `.card`, `.grade`, `label`, `input,select`, `.botoes`, `button`, `.aviso*`, `table.hist`, `.previa-titulo`). Renomear as variáveis `--brand`, `--bg`, `--border`, `--text*`, `--bad`, `--good`, `--surface`, `--brand-soft` para `--kit-*` (para não mudar as cores da DEMO). As regras da folha (`.folha`, `.f-*`, `.v-*`, `table.ap`, `.bloco*`, `.cx`, `.marca-previa`) ficam sem prefixo. Trocar o `@media print` por:

```css
@media print{
  body{background:#fff}
  body > *:not(#areaFolhas){display:none!important}
  #areaFolhas .folha{box-shadow:none;margin:0;page-break-after:always;break-after:page}
  #areaFolhas .folha:last-child{page-break-after:auto;break-after:auto}
}
```
- [ ] **Step 2: `painel.css`** — copiar o `<style>` da DEMO e acrescentar o menu:

```css
.faixa-teste{position:sticky;top:0;z-index:9999;background:#B42318;color:#fff;text-align:center;font:700 13px/1.4 sans-serif;padding:6px 10px}
.menu{display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--border)}
.menu a{flex:1 1 140px;text-align:center;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;color:var(--brand);border:1px solid var(--border)}
.menu a.ativo{background:var(--brand);color:#fff;border-color:var(--brand)}
.tela-app{display:none}.tela-app.ativa{display:block}
.estado{padding:24px;text-align:center;color:var(--text-2)}
```
- [ ] **Step 3: `index.html`** — estrutura (o miolo de cada tela vem das fontes indicadas):

```html
<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cronoanálise – SGE</title>
<link rel="stylesheet" href="css/painel.css"><link rel="stylesheet" href="css/kit.css">
</head><body>
<div class="faixa-teste">Versão de teste: sem login, dados fictícios</div>
<header class="app-header"><!-- copiar da DEMO linhas 268–276 (marca GRUPO GPS Mecanizada) --></header>
<nav class="menu" id="menu">
  <a href="#painel" data-tela="painel">📊 Painel</a>
  <a href="#kit" data-tela="kit">🖨️ Novo documento</a>
  <a href="#lancar" data-tela="lancar">✍️ Lançar</a>
  <a href="#editar" data-tela="editar">✎ Editar</a>
</nav>
<section class="tela-app" id="tela-painel"><!-- DEMO 279–470, sem o botão/aba "Lançamentos" (285) e sem a view-lancamentos (452–469); rodapé 530–532 --><div class="estado" id="painelEstado">Carregando…</div></section>
<section class="tela-app" id="tela-kit"><!-- index.html atual 119–174 (div.tela) --></section>
<section class="tela-app" id="tela-lancar"><!-- Task 6 --></section>
<section class="tela-app" id="tela-editar"><!-- DEMO 452–469 (sem a frase do localStorage) + modal 473–528 + paginação (Task 5) --></section>
<div id="areaFolhas"></div><div id="tip"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script src="js/config.js"></script><script src="js/banco.js"></script>
<script src="js/painel-calculo.js"></script><script src="js/painel.js"></script>
<script src="js/kit.js"></script><script src="js/lancar.js"></script><script src="js/editar.js"></script>
<script src="js/app.js"></script>
</body></html>
```
- [ ] **Step 4: `app.js`**:

```js
(function () {
  const TELAS = ['painel', 'kit', 'lancar', 'editar'];
  let desatualizado = false;
  const iniciadas = {};
  function ir(tela) {
    if (!TELAS.includes(tela)) tela = 'painel';
    if (tela === 'painel' && desatualizado) { location.reload(); return; }
    TELAS.forEach(t => document.getElementById('tela-' + t).classList.toggle('ativa', t === tela));
    document.querySelectorAll('#menu a').forEach(a => a.classList.toggle('ativo', a.dataset.tela === tela));
    const modulo = { painel: Crono.painel, kit: Crono.kit, lancar: Crono.lancar, editar: Crono.editar }[tela];
    if (modulo && !iniciadas[tela]) { iniciadas[tela] = true; modulo.iniciar(); }
  }
  Crono.esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Crono.app = { ir, painelDesatualizado: () => { desatualizado = true; } };
  window.addEventListener('hashchange', () => ir(location.hash.slice(1)));
  ir(location.hash.slice(1) || 'painel');
})();
```
- [ ] **Step 5: `kit.js`** — mover o JS do kit para `Crono.kit = { iniciar }`. O bloco "INÍCIO" (linhas 600–624) vira o corpo de `iniciar()`. `SUPABASE_URL/CHAVE` passam a vir de `Crono.config`. O atalho `#previa=` sai (o endereço agora é das telas).
- [ ] **Step 6: Testar** abrindo `cronoanalise/index.html` (servidor local: `python -m http.server 8080` na pasta `cronoanalise`). A tela Novo documento gera a prévia. Ctrl+P só mostra as folhas. O F12 fica sem erro vermelho (o painel ainda mostra "Carregando…").
- [ ] **Step 7: Commit** `git commit -am "Casca com menu e tela Novo documento"` (antes, `git add` dos arquivos novos)

---

### Task 4: `banco.js` + tela Painel

**Files:**
- Create: `cronoanalise/js/banco.js`, `cronoanalise/js/painel.js`
- Test: `cronoanalise/testes/banco.test.js`

**Interfaces:**
- Consumes: `Crono.config`, `Crono.calcularPainel`, `Crono.esc`
- Produces:
  - `Crono.banco.paraDemo(linha) -> registro` e `Crono.banco.paraBanco(registro) -> linha` (`descricao`↔`desc`, `exec_aux`↔`execAux`, `id`→`seq`); `paraBanco` sempre grava `ficticio: true` nesta versão (sem login)
  - `Crono.banco.escaparRegistro(r) -> r` (todo campo texto passa por `Crono.esc`)
  - `async Crono.banco.listarRegistros(filtros?) -> registro[]` (pagina de 1000 em 1000, ordem `data, id`)
  - `async Crono.banco.inserirRegistros(registros) -> registro[]`, `atualizarRegistro(seq, registro)`, `excluirRegistro(seq)`
  - `async Crono.banco.buscarFolha(idFolha) -> {folha, kit} | null`, `async Crono.banco.folhaJaLancada(idFolha) -> boolean`
  - `async Crono.banco.gerarKit(dados) -> codigo` (sai do kit.js)
  - Erros sempre `throw new Error(<mensagem simples>)`.
  - `Crono.painel = { iniciar }`

- [ ] **Step 1: Teste (falha primeiro)** `banco.test.js`:

```js
const assert = require('assert');
globalThis.Crono = { esc: t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) };
require('../js/config.js'); const { banco } = require('../js/banco.js');
const linha = { id: 7, data: '2026-10-01', descricao: 'DDS', exec_aux: 'E', obs: '<img src=x onerror=alert(1)>', cod: 6, ficticio: true };
const r = banco.paraDemo(linha);
assert.strictEqual(r.seq, 7); assert.strictEqual(r.desc, 'DDS'); assert.strictEqual(r.execAux, 'E');
assert.deepStrictEqual(banco.paraBanco(r).descricao, 'DDS');
assert.ok(!('seq' in banco.paraBanco(r)) && !('id' in banco.paraBanco(r)));
assert.strictEqual(banco.paraBanco(r).ficticio, true);
assert.strictEqual(banco.escaparRegistro(r).obs, '&lt;img src=x onerror=alert(1)&gt;');
assert.strictEqual(banco.escaparRegistro(r).cod, 6);
console.log('OK banco');
```
Run: `node cronoanalise/testes/banco.test.js` → FAIL.

- [ ] **Step 2: `banco.js`** — cliente único `supabase.createClient(URL, CHAVE)` (só no navegador, `typeof supabase !== 'undefined'`). As funções de conversão são puras (testáveis no Node). Toda chamada passa por `chamar(fn)`: `try { const {data, error} = await fn(); if (error) throw error; return data; } catch (e) { throw new Error(navigator.onLine === false || /fetch/i.test(e.message) ? 'Sem internet. Confira a conexão e tente de novo.' : 'O banco não respondeu. Tente de novo em instantes.'); }`. `listarRegistros` usa `.range(i, i+999)` até vir menos de 1000. `gerarKit` usa `rpc('crono_gerar_kit', {...})` com os mesmos parâmetros de hoje. `buscarFolha` lê `crono_folhas` (`id, modelo, papel, kit_id`) e o `crono_kits` dela. `folhaJaLancada` faz `select id, count: 'exact', head: true` com `eq('folha', id)`.
- [ ] **Step 3: Rodar** o teste → `OK banco`.
- [ ] **Step 4: `painel.js`** — copiar o JS da DEMO, linhas 540–1173 (até antes de "LANÇAMENTOS"), para dentro de `function desenhar(ALL) { … }` e aplicar:
  1. Apagar a linha 542 (`var ALL = JSON.parse(...)`).
  2. Linha 567: o selo passa a ser `DATA.overall.totalRegistros + ' lançamentos'`.
  3. Linha 746: trocar `dateLabel(c.data)+'/2026'` por `c.data.split('-').reverse().join('/')`.
  4. Linhas 746–748: `.textContent` vira `.innerHTML` (os dados já chegam escapados).
  5. No handler das abas (570–578), só as abas do painel: `#topTabs .tab` e `#tela-painel .view`.
  - E por fora:
```js
Crono.painel = { async iniciar() {
  const estado = document.getElementById('painelEstado');
  try {
    const regs = (await Crono.banco.listarRegistros()).map(Crono.banco.escaparRegistro);
    if (!regs.length) { estado.textContent = 'Ainda não há lançamentos.'; return; }
    estado.remove(); desenhar(Crono.calcularPainel(regs));
  } catch (e) {
    estado.innerHTML = Crono.esc(e.message) + ' <button type="button" onclick="location.reload()">Tentar de novo</button>';
  }
} };
```
- [ ] **Step 5: Testar** no navegador com 1 linha de teste no banco (Task 1, Step 4, sem excluir). As 4 abas abrem sem erro vermelho. Uma `obs` com `<b>x</b>` aparece escrita, não em negrito. Depois, excluir a linha.
- [ ] **Step 6: Commit** `git add cronoanalise/js/banco.js cronoanalise/js/painel.js cronoanalise/testes/banco.test.js && git commit -m "Painel lendo do Supabase"`

---

### Task 5: Tela Editar

**Files:**
- Create: `cronoanalise/js/editar.js`
- Modify: `cronoanalise/index.html` (seção `#tela-editar`: filtros + paginação)

**Interfaces:**
- Consumes: `Crono.banco.listarRegistros/atualizarRegistro/excluirRegistro/inserirRegistros`, `Crono.config.DESC/classe/TURNOS`, `Crono.app.painelDesatualizado`
- Produces: `Crono.editar = { iniciar, abrirFolha(idFolha) }`

- [ ] **Step 1: HTML** — na barra (DEMO 454–457), além da busca: `<input type="date" id="edDe">`, `<input type="date" id="edAte">`, `<input id="edFolha" placeholder="ID da folha">`. Abaixo da tabela: `<div class="botoes"><button id="edAnt">‹ Anterior</button><span id="edPag"></span><button id="edProx">Próxima ›</button></div>`. A nota diz: "As alterações ficam salvas no banco e aparecem para todos."
- [ ] **Step 2: `editar.js`** — copiar a DEMO linhas 1176–1314 para `Crono.editar.iniciar`, trocando:
  - `RECORDS` vem de `await Crono.banco.listarRegistros()` (sem escapar: a tabela já usa `esc`). Erro → mensagem na `#lancEmpty` com "Tentar de novo".
  - Os filtros (busca, de/até, folha) e a página de 50 (`pagina`, `edAnt/edProx`, "Página 2 de 7").
  - `persist()` sai. Salvar: `seq` existe → `await atualizarRegistro(seq, data)`, senão `await inserirRegistros([data])`. Recarregar a lista e chamar `Crono.app.painelDesatualizado()`. O botão Salvar fica travado durante a gravação.
  - Excluir: `await excluirRegistro(seq)`, recarregar e chamar `painelDesatualizado()`.
  - Ao digitar o código no modal (`fCod`), preencher `fDesc` e `fCls` com `Crono.config.DESC[cod]` e `classe(cod)`, se existirem.
  - `<select id="fTurno">` montado de `Crono.config.TURNOS`.
  - `abrirFolha(id)`: coloca o id em `#edFolha`, vai para `#editar` e filtra.
- [ ] **Step 3: Testar** no navegador: criar, editar e excluir 1 linha (o `paraBanco` já marca `ficticio: true`). Voltar ao Painel recarrega e mostra a mudança.
- [ ] **Step 4: Commit** `git commit -am "Tela Editar gravando no banco"` (com `git add` do arquivo novo)

---

### Task 6: Tela Lançar (com conferências testadas)

**Files:**
- Create: `cronoanalise/js/conferencias.js`, `cronoanalise/js/lancar.js`
- Test: `cronoanalise/testes/conferencias.test.js`
- Modify: `cronoanalise/index.html` (seção `#tela-lancar`)

**Interfaces:**
- Consumes: `Crono.banco.buscarFolha/folhaJaLancada/inserirRegistros`, `Crono.minutosDoDia`, `Crono.config`
- Produces: `Crono.conferirLinhas(linhas, {modelo, horario}) -> {bloqueios: string[], avisos: string[]}`; `Crono.CODIGOS_DA_FOLHA[modelo] -> Set<int>`; `Crono.lancar = { iniciar }`

- [ ] **Step 1: Teste (falha primeiro)** `conferencias.test.js`:

```js
const assert = require('assert');
require('../js/config.js'); require('../js/painel-calculo.js');
const Crono = require('../js/conferencias.js');
const ctx = { modelo: 'AP-OP', horario: '07h às 17h' };
const ok = Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: 6 }, { hi: '07:20', hf: '08:00', cod: 32 }], ctx);
assert.deepStrictEqual(ok, { bloqueios: [], avisos: [] });
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: null }], ctx).bloqueios[0], /sem código/);
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: 42 }], ctx).bloqueios[0], /não vale/);
assert.match(Crono.conferirLinhas([{ hi: '08:00', hf: '07:00', cod: 6 }], ctx).bloqueios[0], /fim antes do início/);
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '08:00', cod: 6 }, { hi: '07:30', hf: '09:00', cod: 32 }], ctx).bloqueios[0], /sobrep/);
assert.match(Crono.conferirLinhas([{ hi: '07:00', hf: '07:20', cod: 6 }, { hi: '07:40', hf: '08:00', cod: 32 }], ctx).avisos[0], /buraco/);
// noturno: 23:30 → 00:30 é válido
assert.deepStrictEqual(Crono.conferirLinhas([{ hi: '23:30', hf: '00:30', cod: 6 }], { modelo: 'AP-OP', horario: '19h às 07h' }).bloqueios, []);
console.log('OK conferencias');
```
Run: `node cronoanalise/testes/conferencias.test.js` → FAIL.

- [ ] **Step 2: `conferencias.js`**:

```js
(function (raiz) {
  const Crono = raiz.Crono;
  const faixa = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const GERAIS = faixa(1, 29);
  Crono.CODIGOS_DA_FOLHA = {
    'AP-MOT': new Set([...GERAIS, 30, 31, 38, 65, 66, 68, 69]),
    'AP-OP': new Set([...GERAIS, ...faixa(30, 39)]),
    'AV-MOT': new Set([...GERAIS, 40, 41, ...faixa(45, 49), ...faixa(65, 69)]),
    'AV-OP': new Set([...GERAIS, ...faixa(40, 50)]),
    'HV-MOT': new Set([...GERAIS, 40, 41, ...faixa(45, 47), 49, ...faixa(65, 69)]),
    'HV-OP': new Set([...GERAIS, ...faixa(40, 47), 49, 50]),
    'AS-OP': new Set([...GERAIS, ...faixa(55, 64)])
  };
  Crono.conferirLinhas = function (linhas, { modelo, horario }) {
    const bloqueios = [], avisos = [], validos = Crono.CODIGOS_DA_FOLHA[modelo];
    const tempos = linhas.map((l, i) => {
      const n = i + 1;
      if (l.cod == null || l.cod === '') bloqueios.push(`Linha ${n}: sem código.`);
      else if (validos && !validos.has(Number(l.cod))) bloqueios.push(`Linha ${n}: o código ${l.cod} não vale para esta folha.`);
      const ini = Crono.minutosDoDia(l.hi, horario); let fim = Crono.minutosDoDia(l.hf, horario);
      if (fim < ini) { if (ini >= 18 * 60 && fim + 1440 - ini <= 12 * 60) fim += 1440; else bloqueios.push(`Linha ${n}: fim antes do início.`); }
      return { ini, fim, n };
    });
    for (let i = 1; i < tempos.length; i++) {
      const a = tempos[i - 1], b = tempos[i];
      if (b.ini < a.fim) bloqueios.push(`Linhas ${a.n} e ${b.n}: horários se sobrepõem.`);
      else if (b.ini > a.fim) avisos.push(`Entre a linha ${a.n} e a ${b.n} há um buraco de ${b.ini - a.fim} min.`);
    }
    return { bloqueios, avisos };
  };
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
```
- [ ] **Step 3: Rodar** → `OK conferencias`. (O `kit.js` passa a usar `Crono.CODIGOS_DA_FOLHA` só se for trivial; se não, fica como está.)
- [ ] **Step 4: HTML `#tela-lancar`**: card 1 tem `<input id="lcFolha" placeholder="Ex.: CR-0002-OP1">` e `<button id="lcBuscar">Buscar folha</button>`. O card 2 começa escondido e tem um resumo da folha (equipamento, vaga, placa, papel, data, turno, horário, área, supervisor), `<input id="lcNome">` e a tabela `#lcLinhas` (colunas Início, Fim, Código, Descrição automática, E/A, Observação, 🗑), com os botões `+ linha` e `Salvar folha`. Também tem `<div class="aviso" id="lcAviso">`.
- [ ] **Step 5: `lancar.js`**:
  - Buscar: `id = lcFolha.value.trim().toUpperCase()`. Se `folhaJaLancada(id)` → aviso "Esta folha já foi lançada." e botão "Abrir em Editar" (`Crono.editar.abrirFolha(id)`). Se `buscarFolha(id)` der `null` → "Folha não encontrada. Confira o código impresso no topo da folha."
  - `+ linha`: nova linha com `hi` = `hf` da anterior.
  - Código digitado → descrição e classificação aparecem (`Crono.config.DESC`/`classe`).
  - Salvar: `conferirLinhas`. Se houver bloqueios, mostra a lista e para. Se houver avisos, `confirm('…\nSalvar mesmo assim?')`. Monta os registros no formato da DEMO (`papel` = `PAPEL_NOME[folha.papel]`, `equip` = `EQUIP[kit.tipo].nome`, `kit`, `folha`, `ficticio: true`) e grava com `inserirRegistros`, com o botão travado até a resposta. Sucesso → "Folha CR-… lançada (N linhas)." Depois limpa a tela e chama `Crono.app.painelDesatualizado()`.
  - Rascunho: a cada mudança, `localStorage['crono_rascunho_' + id]` (dentro de try/catch). Ao buscar a mesma folha, oferece "Continuar o rascunho?". Ao salvar, apaga o rascunho.
- [ ] **Step 6: Testar** de ponta a ponta: gerar um kit (Novo documento) → lançar a folha `-OP1` com 3 linhas → ver no Editar e no Painel → tentar lançar de novo (deve avisar) → excluir as linhas no Editar e marcar o kit como cancelado (SQL).
- [ ] **Step 7: Commit** `git add cronoanalise/js/conferencias.js cronoanalise/js/lancar.js cronoanalise/testes/conferencias.test.js && git commit -am "Tela Lançar com conferências"`

---

### Task 7: Carga dos dados fictícios

**Files:**
- Create: `cronoanalise/testes/gerar_carga.py` (gera SQL no scratchpad, fora do repositório)

- [ ] **Step 1: Script** — lê `testes/referencia.json` e escreve `INSERT … VALUES` em blocos de 200 linhas (num arquivo fora do repositório), com `ficticio = true` e `descricao = desc`, `exec_aux = execAux`. Texto com aspas simples é escapado (`'` → `''`).
- [ ] **Step 2: Aplicar** cada bloco com `execute_sql`. Conferir com `select count(*) from crono_registros where ficticio` → 974.
- [ ] **Step 3: Testar**: o Painel mostra "974 lançamentos" e os mesmos números da DEMO (KPIs do Dashboard).
- [ ] **Step 4: Commit** do script: `git add cronoanalise/testes/gerar_carga.py && git commit -m "Script de carga dos dados fictícios"`

---

### Task 8: Publicação (v0.2.0)

**Files:**
- Create: `index.html` (raiz, redireciona)
- Modify: `.gitignore` (liberar `/index.html`), `cronoanalise/CHANGELOG.md`, `cronoanalise/LEIA-ME.md`, `README.md`

- [ ] **Step 1: Raiz** `index.html`:
```html
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cronoanálise</title>
<meta http-equiv="refresh" content="0; url=cronoanalise/"></head>
<body><a href="cronoanalise/">Abrir a Cronoanálise</a></body></html>
```
`.gitignore`: acrescentar `!/index.html` logo abaixo de `!/README.md`.
- [ ] **Step 2: CHANGELOG** — seção `v0.2.0 (2026-10-07)`: junção, 4 telas, banco `crono_registros`, sem login, só dados fictícios. LEIA-ME: as telas novas, como rodar os testes (`node cronoanalise/testes/*.test.js` depois de `python -I cronoanalise/testes/gerar_referencia.py`) e o aviso "dados reais só depois do login".
- [ ] **Step 3: Rodar todos os testes** → 3× OK. Rodar `git status --ignored` e conferir que nenhum `.html` de sistema, PDF ou xlsx entrou. Procurar segredos: `git grep -n -E "service_role|sb_secret|eyJ"` → nada.
- [ ] **Step 4: Commit + tag** `git commit -m "Cronoanálise v0.2.0" && git tag v0.2.0`. O push é feito pelo usuário (`git push -u origin main --tags`).
- [ ] **Step 5: GitHub Pages** (usuário): Settings → Pages → Source "Deploy from a branch" → `main` / `(root)`. Endereço: `https://grupogps-mecanizada.github.io/Cronoanalise/`.
- [ ] **Step 6: Cofre** — ficha `Cronoanálise.md` (versão, telas, endereço do Pages, aviso do login), linha no Registro de Versões e no Histórico.

### Task 9: Conferência final (usuário + Claude)
- [ ] Computador e celular: as 4 telas abrem e o F12 fica sem erro vermelho.
- [ ] Imprimir um kit: só as folhas saem no papel.
- [ ] Lançar uma folha de ponta a ponta e ver no Painel.
- [ ] Gravar uma `obs` `<b>teste</b>` pelo Editar: aparece escrita, não em negrito, no Painel e no Editar. Depois excluir.
- [ ] `get_advisors` security: nenhum aviso novo além dos esperados (crono_registros aberto, crono_gerar_kit para anon).
