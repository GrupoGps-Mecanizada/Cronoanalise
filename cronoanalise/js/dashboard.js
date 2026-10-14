// Tela Dashboard global: filtros no topo e gráficos interativos que se filtram entre si.
// Os registros chegam já escapados (Crono.banco.escaparRegistro), então os textos podem ir para o HTML.
(function () {
  const D = Crono.dashboard;
  const COR_CLS = { 'Produzindo': '--c-prod', 'Improdutivo necessário': '--c-nec', 'Improdutivo': '--c-imp', [D.SEM_COD]: '--c-semcod' };
  const ROTULO_CLS = { 'Produzindo': 'Produzindo', 'Improdutivo necessário': 'Necessário', 'Improdutivo': 'Improdutivo', [D.SEM_COD]: 'Sem código' };
  const COR_GRUPO = { Motorista: '--c-mot', Operador: '--c-op', Geral: '--text-2' };
  const ICONE = { perda: '!', hora: '◷', papel: '⇄', equipe: '★', aviso: '?' };
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const NOMES_FILTRO = { de: 'De', ate: 'Até', equip: 'Equipamento', turno: 'Turno', supervisor: 'Supervisor', papel: 'Papel', cls: 'Classificação', cod: 'Atividade' };

  let todos = [];
  let filtros = {};
  let rankingTodas = false;
  const el = id => document.getElementById(id);
  const cor = nome => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const pct = v => (v == null ? '—' : v.toFixed(0) + '%');
  const { fmtH, fmtHora, fmtData } = D;

  function svg(tag, attrs, pai) {
    const e = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (pai) pai.appendChild(e);
    return e;
  }

  // ---------- dica flutuante ----------
  const tip = () => el('tip');
  function mostrarDica(e, html) {
    const t = tip(); t.innerHTML = html; t.style.display = 'block';
    t.style.left = Math.min(e.clientX + 14, window.innerWidth - 270) + 'px';
    t.style.top = Math.min(e.clientY + 14, window.innerHeight - 120) + 'px';
  }
  const esconderDica = () => { tip().style.display = 'none'; };
  function comDica(alvo, html) {
    alvo.addEventListener('mousemove', e => mostrarDica(e, typeof html === 'function' ? html() : html));
    alvo.addEventListener('mouseleave', esconderDica);
  }
  const linhaCls = porCls => D.CLASSES.filter(c => porCls[c] > 0).map(c =>
    `<div><span class="db-sw" style="background:var(${COR_CLS[c]})"></span>${ROTULO_CLS[c]}: ${fmtH(porCls[c])}</div>`).join('');

  // ---------- filtros ----------
  function preencherSelect(id, valores, rotuloTodos) {
    const s = el(id);
    s.innerHTML = `<option value="">${rotuloTodos}</option>` + valores.map(v => `<option value="${v}">${v}</option>`).join('');
  }

  function montarFiltros() {
    const op = D.opcoesFiltro(todos);
    preencherSelect('dbEquip', op.equipamentos, 'Todos os equipamentos');
    preencherSelect('dbTurno', op.turnos, 'Todos os turnos');
    preencherSelect('dbSupervisor', op.supervisores, 'Todos os supervisores');
    ['dbDe', 'dbAte'].forEach(id => { el(id).min = op.de; el(id).max = op.ate; });
    const liga = (id, chave) => el(id).addEventListener('change', e => aplicar({ [chave]: e.target.value }));
    liga('dbDe', 'de'); liga('dbAte', 'ate'); liga('dbEquip', 'equip'); liga('dbTurno', 'turno'); liga('dbSupervisor', 'supervisor');
    el('dbPapel').addEventListener('click', e => {
      const b = e.target.closest('[data-papel]');
      if (b) aplicar({ papel: b.dataset.papel });
    });
    el('dbLimpar').addEventListener('click', () => { filtros = {}; desenharTudo(); });
    el('dbChips').addEventListener('click', e => {
      const b = e.target.closest('[data-tira]');
      if (b) aplicar({ [b.dataset.tira]: '' });
    });
  }

  // Liga/desliga: clicar de novo no mesmo item tira o filtro.
  function alternar(chave, valor) {
    aplicar({ [chave]: String(filtros[chave] ?? '') === String(valor ?? '') ? '' : valor });
  }
  function aplicar(novos) {
    Object.entries(novos).forEach(([k, v]) => { if (v === '' || v == null) delete filtros[k]; else filtros[k] = v; });
    desenharTudo();
  }

  function sincronizarControles() {
    el('dbDe').value = filtros.de || ''; el('dbAte').value = filtros.ate || '';
    el('dbEquip').value = filtros.equip || ''; el('dbTurno').value = filtros.turno || ''; el('dbSupervisor').value = filtros.supervisor || '';
    el('dbPapel').querySelectorAll('[data-papel]').forEach(b => b.classList.toggle('active', b.dataset.papel === (filtros.papel || '')));
    const nomeCod = c => { const a = D.topAtividades(todos, 999).find(x => String(x.cod ?? '') === String(c)); return a ? (a.cod ? a.cod + ' · ' : '') + a.desc : c; };
    const valor = (k, v) => (k === 'cod' ? nomeCod(v) : k === 'de' || k === 'ate' ? fmtData(v) : k === 'cls' ? ROTULO_CLS[v] || v : v);
    el('dbChips').innerHTML = Object.entries(filtros).map(([k, v]) =>
      `<button type="button" class="db-chip" data-tira="${k}" title="Tirar este filtro">${NOMES_FILTRO[k]}: <b>${valor(k, v)}</b> <span aria-hidden="true">✕</span></button>`).join('');
    el('dbLimpar').hidden = !Object.keys(filtros).length;
  }

  // ---------- cartões com "ver tabela" ----------
  function tabela(alvoId, cabec, linhas) {
    el(alvoId).innerHTML = `<table class="table db-tabela"><thead><tr>${cabec.map(c => `<th>${c}</th>`).join('')}</tr></thead>` +
      `<tbody>${linhas.map(l => `<tr>${l.map((c, i) => `<td data-label="${cabec[i]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function ligarBotoesTabela() {
    document.querySelectorAll('#view-dashboard [data-alterna]').forEach(b => b.addEventListener('click', () => {
      const card = b.closest('.card');
      const mostrarTabela = !card.classList.contains('db-modo-tabela');
      card.classList.toggle('db-modo-tabela', mostrarTabela);
      b.textContent = mostrarTabela ? 'Ver gráfico' : 'Ver tabela';
      b.setAttribute('aria-pressed', mostrarTabela);
    }));
  }

  // ---------- 1. destaque + para onde vai o tempo ----------
  function desenharDestaque(regs) {
    const g = D.resumoGeral(regs);
    const periodo = g.de === g.ate ? fmtData(g.de) : `${fmtData(g.de)} a ${fmtData(g.ate)}`;
    el('dbNumero').innerHTML = `<div class="db-numero">${pct(g.pctProd)}</div><div class="db-numero-rotulo">do tempo produzindo</div>` +
      `<div class="db-numero-sub">${fmtH(g.horas)} registradas · ${g.equipes} equipe(s) · ${g.dias} dia(s) · ${periodo}` +
      (g.porCls[D.SEM_COD] > 0 ? `<br>As ${fmtH(g.porCls[D.SEM_COD])} sem código ficam fora da porcentagem.` : '') + '</div>';
    el('dbLegendaCls').innerHTML = D.CLASSES.filter(c => c !== D.SEM_COD || g.porCls[c] > 0).map(c =>
      `<button type="button" class="db-leg${filtros.cls === c ? ' active' : ''}" data-cls="${c}"><span class="db-sw" style="background:var(${COR_CLS[c]})"></span>${ROTULO_CLS[c]}</button>`).join('');
    const linhas = [['Geral', g], ['Motorista', g.porPapel.Motorista], ['Operador', g.porPapel.Operador]].filter(([, x]) => x.horas > 0);
    const alvo = el('dbTempo'); alvo.innerHTML = '';
    linhas.forEach(([nome, x]) => {
      const linha = document.createElement('div'); linha.className = 'db-pilha';
      linha.innerHTML = `<div class="db-pilha-nome">${nome}</div><div class="db-pilha-barra"></div><div class="db-pilha-total">${fmtH(x.horas)}</div>`;
      const barra = linha.querySelector('.db-pilha-barra');
      D.CLASSES.forEach(c => {
        const h = x.porCls[c]; if (!(h > 0)) return;
        const p = (100 * h) / x.horas;
        const seg = document.createElement('button'); seg.type = 'button'; seg.className = 'db-seg' + (filtros.cls && filtros.cls !== c ? ' apagado' : '');
        seg.style.flexGrow = p; seg.style.background = `var(${COR_CLS[c]})`;
        seg.setAttribute('aria-label', `${nome}, ${ROTULO_CLS[c]}: ${fmtH(h)}, ${p.toFixed(0)}%`);
        if (p >= 10) seg.textContent = p.toFixed(0) + '%';
        comDica(seg, `<b>${nome} — ${ROTULO_CLS[c]}</b>${fmtH(h)} (${p.toFixed(0)}% do tempo)<br><i>Clique para filtrar</i>`);
        seg.addEventListener('click', () => alternar('cls', c));
        barra.appendChild(seg);
      });
      alvo.appendChild(linha);
    });
    tabela('dbTempoTabela', ['Quem', 'Horas'].concat(D.CLASSES.map(c => ROTULO_CLS[c])),
      linhas.map(([nome, x]) => [nome, fmtH(x.horas)].concat(D.CLASSES.map(c => fmtH(x.porCls[c]) + ' (' + (x.horas ? (100 * x.porCls[c] / x.horas).toFixed(0) : 0) + '%)'))));
  }

  // ---------- 2. evolução dia a dia (linha com mira) ----------
  function desenharDias(regs) {
    const dias = D.porDia(regs);
    const alvo = el('dbDias'); alvo.innerHTML = '';
    const series = (filtros.papel ? [filtros.papel] : ['Motorista', 'Operador']).concat('Geral')
      .filter(s => dias.some(d => d[s].pctProd != null));
    el('dbDiasLegenda').innerHTML = series.map(s =>
      `<span><span class="db-sw ${s === 'Geral' ? 'db-sw-tracejado' : ''}" style="background:var(${COR_GRUPO[s]})"></span>${s}</span>`).join('');
    if (!dias.length) { alvo.innerHTML = '<div class="db-vazio">Sem dados no filtro.</div>'; return; }
    const W = Math.max(alvo.clientWidth || 600, 300), H = 240, pL = 40, pR = 100, pT = 14, pB = 30;
    const w = W - pL - pR, h = H - pT - pB;
    const x = i => pL + (dias.length === 1 ? w / 2 : (i * w) / (dias.length - 1));
    const y = v => pT + h - (v / 100) * h;
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': 'Percentual produzindo por dia' }, alvo);
    [0, 25, 50, 75, 100].forEach(v => {
      svg('line', { x1: pL, x2: W - pR, y1: y(v), y2: y(v), class: 'grid-line' }, s);
      svg('text', { x: pL - 8, y: y(v) + 3, 'text-anchor': 'end', class: 'axis-label' }, s).textContent = v + '%';
    });
    const passo = Math.ceil(dias.length / Math.max(1, Math.floor(w / 56)));
    dias.forEach((d, i) => {
      if (i % passo === 0 || i === dias.length - 1) svg('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'axis-label' }, s).textContent = fmtData(d.data);
    });
    // Rótulo no fim de cada linha, afastados entre si para não se sobreporem.
    const rotulos = series.map(nome => {
      const ult = dias.map((d, i) => [d[nome].pctProd, i]).filter(([v]) => v != null).pop();
      return ult && { nome, v: ult[0], i: ult[1], y: y(ult[0]) + 4 };
    }).filter(Boolean).sort((a, b) => a.y - b.y);
    rotulos.forEach((r, k) => { if (k && r.y - rotulos[k - 1].y < 14) r.y = rotulos[k - 1].y + 14; });
    rotulos.forEach(r => { svg('text', { x: x(r.i) + 8, y: r.y, class: 'db-rotulo-serie' }, s).textContent = `${r.nome} ${pct(r.v)}`; });
    series.forEach(nome => {
      const c = cor(COR_GRUPO[nome]);
      let caminho = '', aberto = false;
      dias.forEach((d, i) => {
        const v = d[nome].pctProd;
        if (v == null) { aberto = false; return; }
        caminho += (aberto ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); aberto = true;
      });
      svg('path', { d: caminho, fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-dasharray': nome === 'Geral' ? '5 4' : '' }, s);
      dias.forEach((d, i) => {
        const v = d[nome].pctProd;
        if (v != null && nome !== 'Geral') svg('circle', { cx: x(i), cy: y(v), r: 4, fill: c, stroke: cor('--surface'), 'stroke-width': 2 }, s);
      });
    });
    // Mira: uma faixa invisível por dia mostra todos os valores daquele dia; o clique filtra o dia.
    const mira = svg('line', { y1: pT, y2: pT + h, class: 'db-mira', visibility: 'hidden' }, s);
    dias.forEach((d, i) => {
      const larg = dias.length === 1 ? w : w / (dias.length - 1);
      const faixa = svg('rect', { x: x(i) - larg / 2, y: pT, width: larg, height: h, fill: 'transparent', class: 'db-alvo' }, s);
      faixa.addEventListener('mousemove', e => {
        mira.setAttribute('x1', x(i)); mira.setAttribute('x2', x(i)); mira.setAttribute('visibility', 'visible');
        mostrarDica(e, `<b>${fmtData(d.data)}</b>` + series.map(n =>
          `<div><span class="db-sw" style="background:var(${COR_GRUPO[n]})"></span>${n}: ${pct(d[n].pctProd)} de ${fmtH(d[n].horas)}</div>`).join('') +
          '<i>Clique para ver só este dia</i>');
      });
      faixa.addEventListener('mouseleave', () => { mira.setAttribute('visibility', 'hidden'); esconderDica(); });
      faixa.addEventListener('click', () => aplicar(filtros.de === d.data && filtros.ate === d.data ? { de: '', ate: '' } : { de: d.data, ate: d.data }));
    });
    tabela('dbDiasTabela', ['Dia'].concat(series.map(n => n + ' (% produzindo)'), ['Horas']),
      dias.map(d => [fmtData(d.data)].concat(series.map(n => pct(d[n].pctProd)), [fmtH(d.Geral.horas)])));
  }

  // ---------- 3. leitura automática ----------
  function desenharAchados(regs) {
    const lista = D.achados(regs);
    const alvo = el('dbAchados');
    if (!lista.length) { alvo.innerHTML = '<li class="db-vazio">Sem dados no filtro.</li>'; return; }
    alvo.innerHTML = lista.map((a, i) =>
      `<li class="db-achado db-achado-${a.tipo}"><span class="db-achado-ic" aria-hidden="true">${ICONE[a.tipo]}</span><div>${a.texto}` +
      (a.filtro ? ` <button type="button" class="db-link" data-achado="${i}">Ver no painel</button>` : '') +
      (a.equipe ? ` <button type="button" class="db-link" data-equipe="${i}">Abrir linha do tempo</button>` : '') + '</div></li>').join('');
    alvo.querySelectorAll('[data-achado]').forEach(b => b.addEventListener('click', () => aplicar(lista[b.dataset.achado].filtro)));
    alvo.querySelectorAll('[data-equipe]').forEach(b => b.addEventListener('click', () => abrirEquipe(lista[b.dataset.equipe].equipe)));
  }

  // ---------- 4. hora do turno (mapa de calor) ----------
  function desenharHoras(regs) {
    const ph = D.porHora(regs);
    const linhas = (filtros.papel ? [filtros.papel] : ['Motorista', 'Operador']).concat('Geral');
    const passos = ['--seq-1', '--seq-2', '--seq-3', '--seq-4', '--seq-5', '--seq-6', '--seq-7'];
    const alvo = el('dbHoras');
    let html = '<div class="db-calor" style="--cols:' + ph.horas.length + '"><div></div>' +
      ph.horas.map(h => `<div class="db-calor-hora">${String(h).padStart(2, '0')}</div>`).join('');
    linhas.forEach(n => {
      html += `<div class="db-calor-nome">${n}</div>`;
      ph[n].forEach((c, i) => {
        if (!(c.horas >= 0.05) || c.pctProd == null) { html += `<div class="db-celula vazia" data-l="${n}" data-i="${i}"></div>`; return; }
        const passo = Math.min(6, Math.floor((c.pctProd / 100) * 7));
        html += `<div class="db-celula${passo >= 4 ? ' escura' : ''}" style="background:var(${passos[passo]})" data-l="${n}" data-i="${i}">${c.pctProd.toFixed(0)}</div>`;
      });
    });
    alvo.innerHTML = html + '</div>';
    alvo.querySelectorAll('.db-celula').forEach(cel => {
      const c = ph[cel.dataset.l][cel.dataset.i];
      comDica(cel, `<b>${cel.dataset.l} — ${fmtHora(c.hora)} às ${fmtHora((c.hora + 1) % 24)}</b>` +
        (c.horas >= 0.05 ? `${pct(c.pctProd)} produzindo em ${fmtH(c.horas)}` + linhaCls(c.porCls) : 'Sem lançamento nesta hora'));
    });
    el('dbHorasLegenda').innerHTML = '<span>Menos produtivo</span>' + passos.map(p => `<span class="db-sw db-sw-q" style="background:var(${p})"></span>`).join('') +
      '<span>Mais produtivo</span><span class="db-leg-vazia"><span class="db-sw db-sw-q vazia"></span>sem lançamento</span>';
    tabela('dbHorasTabela', ['Hora'].concat(linhas.map(n => n + ' (% produzindo)'), ['Horas lançadas']),
      ph.horas.map((h, i) => [fmtHora(h)].concat(linhas.map(n => (ph[n][i].horas >= 0.05 ? pct(ph[n][i].pctProd) : '—')), [fmtH(ph.Geral[i].horas)])));
  }

  // ---------- 5. atividades que mais consomem horas ----------
  function desenharAtividades(regs) {
    // Sem o filtro de atividade, para a barra escolhida continuar visível ao lado das outras.
    const base = D.filtrar(todos, Object.assign({}, filtros, { cod: '' }));
    const top = D.topAtividades(base, 10);
    const max = top.length ? top[0].h : 1;
    const escolhida = filtros.cod != null && filtros.cod !== '' ? String(filtros.cod) : null;
    const alvo = el('dbAtiv');
    alvo.innerHTML = top.length ? '' : '<div class="db-vazio">Sem dados no filtro.</div>';
    top.forEach(a => {
      const chave = a.cod == null ? D.SEM_COD : String(a.cod);
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'db-barra-linha' + (escolhida && escolhida !== chave ? ' apagado' : '') + (escolhida === chave ? ' escolhida' : '');
      b.innerHTML = `<span class="db-barra-nome">${a.cod ? '<span class="db-cod">' + a.cod + '</span>' : ''}${a.desc}</span>` +
        `<span class="db-barra-trilho"><span class="db-barra" style="width:${(100 * a.h / max).toFixed(1)}%;background:var(${COR_CLS[a.cls]})"></span></span>` +
        `<span class="db-barra-valor">${fmtH(a.h)} <small>${a.pct.toFixed(0)}%</small></span>`;
      comDica(b, `<b>${a.cod ? a.cod + ' · ' : ''}${a.desc}</b>${ROTULO_CLS[a.cls]}<br>${fmtH(a.h)} · ${a.pct.toFixed(0)}% do tempo · ${a.equipes} equipe(s)` +
        (a.obs.length ? `<br>${a.obs.length} observação(ões)` : '') + '<br><i>Clique para ver as observações</i>');
      // "Sem código" não tem número: filtra pela classificação.
      b.addEventListener('click', () => (a.cod == null ? alternar('cls', D.SEM_COD) : alternar('cod', a.cod)));
      alvo.appendChild(b);
    });
    el('dbAtivLegenda').innerHTML = D.CLASSES.filter(c => top.some(a => a.cls === c)).map(c =>
      `<span><span class="db-sw" style="background:var(${COR_CLS[c]})"></span>${ROTULO_CLS[c]}</span>`).join('');
    tabela('dbAtivTabela', ['Código', 'Atividade', 'Classificação', 'Horas', '% do tempo', 'Equipes'],
      top.map(a => [a.cod ?? '—', a.desc, ROTULO_CLS[a.cls], fmtH(a.h), a.pct.toFixed(0) + '%', a.equipes]));
    desenharObservacoes(regs);
  }

  function desenharObservacoes(regs) {
    const comObs = regs.filter(r => r.obs);
    const titulo = filtros.cod != null && filtros.cod !== '' ? 'Observações desta atividade' : 'Observações mais recentes';
    el('dbObsTitulo').textContent = `${titulo} (${comObs.length})`;
    const lista = comObs.slice().sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0)).slice(0, 30);
    el('dbObs').innerHTML = lista.length ? lista.map(r =>
      `<li><div class="db-obs-meta">${fmtData(r.data)} ${r.hi} · ${r.papel}${r.nome ? ' · ' + r.nome : ''}${r.cod ? ' · cód. ' + r.cod : ''}${r.kit ? ' · ' + r.kit : ''}</div>${r.obs}</li>`).join('')
      : '<li class="db-vazio">Nenhuma observação no filtro.</li>';
  }

  // ---------- 6. motorista x operador por equipamento ----------
  function desenharEquipamentos(regs) {
    const eqs = D.porEquipamento(regs);
    const grupos = filtros.papel ? [filtros.papel] : ['Motorista', 'Operador'];
    el('dbEquipLegenda').innerHTML = grupos.map(g => `<span><span class="db-sw" style="background:var(${COR_GRUPO[g]})"></span>${g}</span>`).join('');
    const alvo = el('dbEquipamentos');
    alvo.innerHTML = eqs.length ? eqs.map(e => `<div class="db-eq"><div class="db-eq-nome">${e.equip === 'Vácuo' ? 'Auto Vácuo' : e.equip}</div>` +
      grupos.map(g => {
        const v = e[g].pctProd;
        return `<div class="db-eq-linha" data-eq="${e.equip}" data-g="${g}"><span class="db-eq-papel">${g}</span>` +
          (v == null ? '<span class="db-barra-trilho"><span class="db-sem">sem registro</span></span><span class="db-barra-valor">—</span>'
            : `<span class="db-barra-trilho"><span class="db-barra" style="width:${v.toFixed(1)}%;background:var(${COR_GRUPO[g]})"></span></span><span class="db-barra-valor">${pct(v)}</span>`) + '</div>';
      }).join('') + '</div>').join('') : '<div class="db-vazio">Sem dados no filtro.</div>';
    alvo.querySelectorAll('.db-eq-linha').forEach(l => {
      const e = eqs.find(x => x.equip === l.dataset.eq)[l.dataset.g];
      comDica(l, `<b>${l.dataset.g} — ${l.dataset.eq}</b>${pct(e.pctProd)} produzindo em ${fmtH(e.horas)}<br><i>Clique para filtrar este equipamento</i>`);
      l.addEventListener('click', () => alternar('equip', l.dataset.eq));
    });
    tabela('dbEquipTabela', ['Equipamento'].concat(grupos.map(g => g + ' (% produzindo)'), grupos.map(g => g + ' (horas)')),
      eqs.map(e => [e.equip].concat(grupos.map(g => pct(e[g].pctProd)), grupos.map(g => fmtH(e[g].horas)))));
  }

  // ---------- 7. ranking das equipes ----------
  function desenharRanking(regs) {
    const rk = D.rankingEquipes(regs);
    const mostrar = rankingTodas ? rk : rk.slice(0, 10);
    const alvo = el('dbRanking');
    alvo.innerHTML = rk.length ? '' : '<div class="db-vazio">Sem dados no filtro.</div>';
    mostrar.forEach((e, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'db-rank';
      const nome = `${e.kit || 'Planilha'} · ${fmtData(e.data)} · ${e.vaga || '—'}`;
      b.innerHTML = `<span class="db-rank-pos">${i + 1}</span><span class="db-rank-nome"><b>${nome}</b><small>${e.equip === 'Vácuo' ? 'Auto Vácuo' : e.equip} · Turno ${e.turno || '—'}${e.supervisor ? ' · ' + e.supervisor : ''}</small></span>` +
        '<span class="db-pilha-barra db-rank-barra">' + D.CLASSES.filter(c => e.porCls[c] > 0).map(c =>
          `<span class="db-seg" style="flex-grow:${e.porCls[c]};background:var(${COR_CLS[c]})"></span>`).join('') + '</span>' +
        `<span class="db-barra-valor">${pct(e.pctProd)} <small>${fmtH(e.horas)}</small></span>`;
      comDica(b, `<b>${nome}</b>${e.area ? e.area + '<br>' : ''}${e.nomes.join(', ')}${linhaCls(e.porCls)}<i>Clique para abrir a linha do tempo</i>`);
      b.addEventListener('click', () => abrirEquipe(e.chave));
      alvo.appendChild(b);
    });
    const botao = el('dbRankingMais');
    botao.hidden = rk.length <= 10;
    botao.textContent = rankingTodas ? 'Mostrar só as 10 primeiras' : `Mostrar todas (${rk.length})`;
    tabela('dbRankingTabela', ['#', 'Equipe', 'Data', 'Vaga', 'Equipamento', 'Turno', '% produzindo', 'Horas'],
      rk.map((e, i) => [i + 1, e.kit || 'Planilha', fmtData(e.data), e.vaga || '—', e.equip, e.turno || '—', pct(e.pctProd), fmtH(e.horas)]));
  }

  function abrirEquipe(chave) {
    esconderDica();
    if (Crono.painel.abrirEquipe && Crono.painel.abrirEquipe(chave)) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- montagem ----------
  function desenharTudo() {
    esconderDica();
    sincronizarControles();
    const regs = D.filtrar(todos, filtros);
    el('dbConteudo').classList.toggle('db-sem-dados', !regs.length);
    desenharDestaque(regs);
    desenharDias(regs);
    desenharAchados(regs);
    desenharHoras(regs);
    desenharAtividades(regs);
    desenharEquipamentos(regs);
    desenharRanking(regs);
  }

  function desenhar(regs) {
    todos = regs;
    montarFiltros();
    ligarBotoesTabela();
    el('dbLegendaCls').addEventListener('click', e => { const b = e.target.closest('[data-cls]'); if (b) alternar('cls', b.dataset.cls); });
    el('dbRankingMais').addEventListener('click', () => { rankingTodas = !rankingTodas; desenharRanking(D.filtrar(todos, filtros)); });
    let espera;
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => desenharDias(D.filtrar(todos, filtros)), 150); });
    desenharTudo();
  }

  Crono.dashboard.desenhar = desenhar;
  // Chamado pelo menu (aba aparecendo) e pela troca de tema: o gráfico dos dias depende da largura e das cores.
  Crono.dashboard.redesenhar = () => { if (todos.length) desenharDias(D.filtrar(todos, filtros)); };
})();
