// Cálculos do Dashboard global: filtros, totais, evolução por dia, atividades, hora do turno, equipes e achados.
// Só números (sem tela), para poder testar no Node. Os registros chegam no formato da DEMO (desc, execAux).
(function (raiz) {
  const Crono = raiz.Crono;
  const { CLS_ORDER, DESC } = Crono.config;
  const SEM_COD = 'Sem código';
  const CLASSES = CLS_ORDER.concat(SEM_COD);
  const PROD = CLS_ORDER[0], IMP = CLS_ORDER[2];
  const GRUPOS = ['Motorista', 'Operador'];
  // Ordem das horas no eixo: começa às 07h para os turnos de dia e de noite ficarem contínuos.
  const HORAS = Array.from({ length: 24 }, (_, i) => (i + 7) % 24);

  const arred = x => Math.round(x * 100) / 100;
  const zero = () => Object.fromEntries(CLASSES.map(c => [c, 0]));
  const classeDe = r => (CLS_ORDER.includes(r.cls) ? r.cls : SEM_COD);
  const grupoDe = papel => (papel === 'Motorista' ? 'Motorista' : 'Operador');
  const somaTot = tot => CLASSES.reduce((a, c) => a + tot[c], 0);
  // % produzindo sobre o tempo classificado (o "sem código" não entra na conta, como no restante do painel).
  const pctProd = tot => {
    const base = CLS_ORDER.reduce((a, c) => a + tot[c], 0);
    return base > 0 ? (100 * tot[PROD]) / base : null;
  };

  function periodo(r) {
    const ini = Crono.minutosDoDia(r.hi, r.horario);
    let fim = Crono.minutosDoDia(r.hf, r.horario);
    if (fim < ini) fim += 1440;
    return { ini, fim, h: (fim - ini) / 60 };
  }

  const unicos = lista => [...new Set(lista.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

  function opcoesFiltro(regs) {
    const datas = unicos(regs.map(r => r.data));
    return {
      de: datas[0] || '', ate: datas[datas.length - 1] || '',
      equipamentos: unicos(regs.map(r => r.equip)),
      turnos: unicos(regs.map(r => r.turno)),
      supervisores: unicos(regs.map(r => r.supervisor))
    };
  }

  // f: { de, ate, equip, turno, supervisor, papel ('Motorista'|'Operador'), cls, cod }
  function filtrar(regs, f) {
    f = f || {};
    return regs.filter(r =>
      (!f.de || r.data >= f.de) && (!f.ate || r.data <= f.ate) &&
      (!f.equip || r.equip === f.equip) && (!f.turno || r.turno === f.turno) &&
      (!f.supervisor || r.supervisor === f.supervisor) &&
      (!f.papel || grupoDe(r.papel) === f.papel) &&
      (!f.cls || classeDe(r) === f.cls) &&
      (f.cod == null || f.cod === '' || String(r.cod ?? '') === String(f.cod)));
  }

  const chaveEquipe = r => r.kit || [r.data, r.vaga, r.turno, r.horario, r.equip].join('|');

  function resumoGeral(regs) {
    const tot = zero(), porPapel = { Motorista: zero(), Operador: zero() };
    regs.forEach(r => {
      const { h } = periodo(r), c = classeDe(r);
      tot[c] += h; porPapel[grupoDe(r.papel)][c] += h;
    });
    const fecha = t => ({ horas: arred(somaTot(t)), porCls: Object.fromEntries(CLASSES.map(c => [c, arred(t[c])])), pctProd: pctProd(t) });
    const datas = unicos(regs.map(r => r.data));
    return Object.assign(fecha(tot), {
      lancamentos: regs.length,
      equipes: new Set(regs.map(chaveEquipe)).size,
      dias: datas.length, de: datas[0] || null, ate: datas[datas.length - 1] || null,
      porPapel: { Motorista: fecha(porPapel.Motorista), Operador: fecha(porPapel.Operador) }
    });
  }

  function porDia(regs) {
    const dias = new Map();
    regs.forEach(r => {
      if (!dias.has(r.data)) dias.set(r.data, { Motorista: zero(), Operador: zero(), Geral: zero() });
      const d = dias.get(r.data), { h } = periodo(r), c = classeDe(r);
      d[grupoDe(r.papel)][c] += h; d.Geral[c] += h;
    });
    return [...dias.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([data, d]) => {
      const o = { data };
      GRUPOS.concat('Geral').forEach(g => { o[g] = { horas: arred(somaTot(d[g])), pctProd: pctProd(d[g]) }; });
      return o;
    });
  }

  function topAtividades(regs, n) {
    const mapa = new Map();
    let total = 0;
    regs.forEach(r => {
      const { h } = periodo(r);
      total += h;
      const chave = r.cod == null || r.cod === '' ? SEM_COD : Number(r.cod);
      if (!mapa.has(chave)) {
        mapa.set(chave, { cod: chave === SEM_COD ? null : chave, desc: chave === SEM_COD ? SEM_COD : (r.desc || DESC[chave] || 'Código ' + chave),
          cls: classeDe(r), h: 0, equipes: new Set(), obs: [] });
      }
      const a = mapa.get(chave);
      a.h += h; a.equipes.add(chaveEquipe(r));
      if (r.obs) a.obs.push({ texto: r.obs, meta: r.data + ' ' + r.hi, nome: r.nome || '' });
    });
    return [...mapa.values()].sort((a, b) => b.h - a.h).slice(0, n || 10)
      .map(a => Object.assign(a, { h: arred(a.h), pct: total > 0 ? (100 * a.h) / total : 0, equipes: a.equipes.size }));
  }

  // Reparte cada lançamento pelas horas do relógio que ele cobre (19:40–21:10 → 20 min na 19h, 60 na 20h, 10 na 21h).
  function porHora(regs) {
    const base = () => HORAS.map(() => zero());
    const acc = { Motorista: base(), Operador: base(), Geral: base() };
    const pos = Object.fromEntries(HORAS.map((h, i) => [h, i]));
    regs.forEach(r => {
      const { ini, fim } = periodo(r), c = classeDe(r), g = grupoDe(r.papel);
      for (let m = ini; m < fim;) {
        const proxima = (Math.floor(m / 60) + 1) * 60, ate = Math.min(fim, proxima), i = pos[Math.floor(m / 60) % 24];
        acc[g][i][c] += (ate - m) / 60; acc.Geral[i][c] += (ate - m) / 60;
        m = ate;
      }
    });
    const fecha = lista => lista.map((t, i) => ({ hora: HORAS[i], horas: arred(somaTot(t)), pctProd: pctProd(t),
      porCls: Object.fromEntries(CLASSES.map(c => [c, arred(t[c])])) }));
    return { horas: HORAS, Motorista: fecha(acc.Motorista), Operador: fecha(acc.Operador), Geral: fecha(acc.Geral) };
  }

  function rankingEquipes(regs) {
    const mapa = new Map();
    regs.forEach(r => {
      const k = chaveEquipe(r);
      if (!mapa.has(k)) mapa.set(k, { chave: k, kit: r.kit || null, data: r.data, equip: r.equip, vaga: r.vaga, turno: r.turno,
        horario: r.horario, supervisor: r.supervisor, area: r.area, tot: zero(), nomes: new Set() });
      const e = mapa.get(k);
      e.tot[classeDe(r)] += periodo(r).h;
      if (r.nome) e.nomes.add(r.nome);
    });
    return [...mapa.values()].map(e => ({
      chave: e.chave, kit: e.kit, data: e.data, equip: e.equip, vaga: e.vaga, turno: e.turno, horario: e.horario,
      supervisor: e.supervisor, area: e.area, nomes: [...e.nomes],
      horas: arred(somaTot(e.tot)), pctProd: pctProd(e.tot),
      porCls: Object.fromEntries(CLASSES.map(c => [c, arred(e.tot[c])]))
    })).sort((a, b) => (b.pctProd ?? -1) - (a.pctProd ?? -1) || b.horas - a.horas);
  }

  function porEquipamento(regs) {
    const mapa = new Map();
    regs.forEach(r => {
      if (!mapa.has(r.equip)) mapa.set(r.equip, { Motorista: zero(), Operador: zero() });
      mapa.get(r.equip)[grupoDe(r.papel)][classeDe(r)] += periodo(r).h;
    });
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR')).map(([equip, g]) => ({
      equip,
      Motorista: { horas: arred(somaTot(g.Motorista)), pctProd: pctProd(g.Motorista) },
      Operador: { horas: arred(somaTot(g.Operador)), pctProd: pctProd(g.Operador) }
    }));
  }

  const fmtH = h => h.toFixed(1).replace('.', ',') + 'h';
  const fmtHora = h => String(h).padStart(2, '0') + 'h';
  const fmtData = iso => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '');

  // Frases automáticas sobre o recorte atual. Cada uma pode trazer um filtro para o clique.
  function achados(regs) {
    const lista = [];
    if (!regs.length) return lista;
    const g = resumoGeral(regs);
    const perdas = topAtividades(regs, 99).filter(a => a.cls === IMP);
    if (perdas.length) {
      const p = perdas[0];
      lista.push({ tipo: 'perda', texto: `A maior perda é <b>${p.desc}</b>${p.cod ? ' (cód. ' + p.cod + ')' : ''}: <b>${fmtH(p.h)}</b>, ${p.pct.toFixed(0)}% de todo o tempo, em ${p.equipes} equipe(s).`,
        filtro: { cod: p.cod } });
    }
    // Hora com mais tempo improdutivo (espera) em horas, não em %: o início do turno (ponto, DDS) não conta como "parado".
    const horas = porHora(regs).Geral.filter(x => x.horas >= 1 && x.pctProd != null);
    const espera = horas.filter(x => x.porCls[IMP] > 0);
    if (espera.length && horas.length >= 2) {
      const pior = espera.reduce((a, b) => (b.porCls[IMP] > a.porCls[IMP] ? b : a));
      const melhor = horas.reduce((a, b) => (b.pctProd > a.pctProd ? b : a));
      lista.push({ tipo: 'hora', texto: `Hora com mais espera: <b>${fmtHora(pior.hora)}</b> (${fmtH(pior.porCls[IMP])} improdutivas). Hora mais produtiva: <b>${fmtHora(melhor.hora)}</b> (${melhor.pctProd.toFixed(0)}% produzindo).` });
    }
    const m = g.porPapel.Motorista.pctProd, o = g.porPapel.Operador.pctProd;
    if (m != null && o != null) {
      const dif = Math.abs(m - o);
      lista.push({ tipo: 'papel', texto: dif < 3
        ? `Motorista e Operador estão parecidos: ${m.toFixed(0)}% e ${o.toFixed(0)}% produzindo.`
        : `<b>${m > o ? 'Motorista' : 'Operador'}</b> produz ${dif.toFixed(0)} pontos a mais (${Math.max(m, o).toFixed(0)}% contra ${Math.min(m, o).toFixed(0)}%).` });
    }
    const eq = rankingEquipes(regs).filter(e => e.pctProd != null && e.horas >= 4);
    if (eq.length >= 2) {
      const nome = e => `${e.kit || e.vaga || e.equip} de ${fmtData(e.data)}`;
      lista.push({ tipo: 'equipe', texto: `Melhor equipe: <b>${nome(eq[0])}</b> (${eq[0].pctProd.toFixed(0)}%). Menor: <b>${nome(eq[eq.length - 1])}</b> (${eq[eq.length - 1].pctProd.toFixed(0)}%).`,
        equipe: eq[eq.length - 1].chave });
    }
    if (g.porCls[SEM_COD] > 0) {
      lista.push({ tipo: 'aviso', texto: `<b>${fmtH(g.porCls[SEM_COD])}</b> lançadas sem código. Corrija na tela Editar para entrarem na conta.`,
        filtro: { cls: SEM_COD } });
    }
    return lista;
  }

  Crono.dashboard = Object.assign(Crono.dashboard || {}, {
    SEM_COD, CLASSES, HORAS, periodo, opcoesFiltro, filtrar, resumoGeral, porDia, topAtividades, porHora,
    rankingEquipes, porEquipamento, achados, fmtH, fmtHora, fmtData
  });
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
