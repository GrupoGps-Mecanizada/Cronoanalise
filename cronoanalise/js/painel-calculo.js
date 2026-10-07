// Transforma os registros (formato da DEMO) nos dados do painel: {timeline, charts}.
// Cópia fiel de calcular_painel (gerar_demo.py). O teste testes/painel-calculo.test.js confere a igualdade.
(function (raiz) {
  const Crono = raiz.Crono;
  const { CLS_ORDER, DESC, classe, EQUIP, PAPEL_NOME } = Crono.config;
  const GRUPOS = ['Motorista', 'Operador'];
  const PROD = CLS_ORDER[0];

  const arred = x => Math.round(x * 100) / 100;
  const zero = () => Object.fromEntries(CLS_ORDER.map(c => [c, 0]));
  const grupo = papel => papel === 'Motorista' ? 'Motorista' : 'Operador';
  const soma = tot => Object.values(tot).reduce((a, b) => a + b, 0);
  const arredTot = tot => Object.fromEntries(Object.entries(tot).map(([c, v]) => [c, arred(v)]));

  function resumo(tot) {
    const total = arred(soma(tot));
    return { totals: arredTot(tot), totalH: total, pctProd: total ? 100 * tot[PROD] / total : null };
  }

  // Minutos desde 00:00 do dia do turno. Depois da meia-noite soma 1440
  // (vale quando a hora é bem anterior ao início do turno, ex.: 01:00 no turno 19h às 07h).
  function minutosDoDia(hhmm, horario) {
    const [h, m] = String(hhmm || '0:0').split(':').map(Number);
    let min = h * 60 + m;
    const ini = /^\s*(\d{1,2})/.exec(horario || '');
    if (ini && min < (Number(ini[1]) - 4) * 60) min += 1440;
    return min;
  }

  const equipPorNome = Object.fromEntries(Object.values(EQUIP).map(e => [e.nome, e]));

  function numeroDaVaga(vaga) {
    const m = /(\d+)/.exec(vaga || '');
    return m ? String(parseInt(m[1], 10)) : null;
  }

  // Agrupa os registros em equipes (kits), na ordem em que aparecem.
  function montarKits(regs) {
    const kits = new Map();
    regs.forEach(r => {
      const chave = r.kit || [r.data, r.vaga, r.turno, r.horario, r.equip].join('|');
      if (!kits.has(chave)) kits.set(chave, []);
      kits.get(chave).push(r);
    });
    return [...kits.values()];
  }

  function calcularPainel(registros) {
    const regs = registros.map(r => {
      const ini = minutosDoDia(r.hi, r.horario);
      let fim = minutosDoDia(r.hf, r.horario);
      if (fim < ini) fim += 1440;
      return { r, ini, fim, h: (fim - ini) / 60, valido: CLS_ORDER.includes(r.cls) };
    });

    // ---------- equipes ----------
    const crews = montarKits(regs.map(x => Object.assign({}, x.r, { _x: x }))).map(doKit => {
      const p = doKit[0];
      const eq = equipPorNome[p.equip] ||
        { nome: p.equip, label: p.equip, papeis: null };
      const esperados = eq.papeis ? eq.papeis.map(x => PAPEL_NOME[x]) : [...new Set(doKit.map(x => x.papel))];
      const roles = {};
      esperados.forEach(papel => {
        const segs = doKit.filter(x => x.papel === papel);
        if (!segs.length) return;
        const tot = zero();
        const segOut = segs.map(s => {
          const x = s._x;
          if (x.valido) tot[s.cls] += x.h;
          return Object.assign({}, x.r, { startMin: x.ini, endMin: x.fim });
        });
        roles[papel] = { nome: segs[0].nome, segments: segOut, totals: arredTot(tot) };
      });
      const todos = Object.values(roles).flatMap(x => x.segments);
      return {
        id: 0, data: p.data, equip: eq.nome, equipLabel: eq.label,
        vaga: p.vaga, placa: p.placa ?? null, area: p.area, turno: p.turno,
        horario: p.horario, expectedRoles: esperados, roles,
        rolesWithData: Object.keys(roles), completenessNum: Object.keys(roles).length,
        completenessDen: esperados.length,
        globalMin: Math.min(...todos.map(s => s.startMin)), globalMax: Math.max(...todos.map(s => s.endMin)),
        kit: p.kit ?? null, supervisor: p.supervisor ?? null
      };
    });
    crews.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
    crews.forEach((c, i) => { c.id = i; });

    // ---------- geral ----------
    const porCls = zero();
    regs.forEach(x => { if (x.valido) porCls[x.r.cls] += x.h; });
    const completos = crews.filter(c => c.completenessNum >= c.completenessDen).length;
    const overall = {
      totalHoras: arred(soma(porCls)), totalRegistros: registros.length,
      porClassificacao: arredTot(porCls),
      totalCrews: crews.length, crewsCompletos: completos, crewsIncompletos: crews.length - completos
    };

    // ---------- gráficos ----------
    const acumula = (alvo, chave, r, h) => {
      alvo[chave] = alvo[chave] || zero();
      alvo[chave][r.cls] += h;
    };
    const pegar = (obj, chave) => (obj[chave] = obj[chave] || {});
    const lista = (obj, chave) => (obj[chave] = obj[chave] || []);

    const eqChart = {};
    Object.values(EQUIP).forEach(e => {
      eqChart[e.chave] = { label: e.label, slots: e.slots, hasMotorista: e.papeis.includes('MOT'), vagas: {} };
    });
    const vagaRg = {}, vagaRole = {}, vagaNome = {}, vagaObsRg = {}, vagaObsRole = {};
    const turnoRg = {}, turnoObs = {}, horRg = {}, horObs = {}, eqRg = {}, roleRg = {};

    regs.forEach(({ r, h, valido }) => {
      if (!valido) return;
      const rg = grupo(r.papel);
      const e = equipPorNome[r.equip];
      const n = numeroDaVaga(r.vaga);
      const vk = e && n ? e.chave + '|' + n : null;
      if (vk) {
        acumula(pegar(vagaRg, vk), rg, r, h);
        acumula(pegar(vagaRole, vk), r.papel, r, h);
        pegar(vagaNome, vk)[r.papel] = r.nome;
      }
      acumula(pegar(turnoRg, r.turno), rg, r, h);
      acumula(pegar(horRg, r.horario), rg, r, h);
      if (e) acumula(pegar(eqRg, e.chave), rg, r, h);
      acumula(roleRg, rg, r, h);
      if (r.obs) {
        const item = { texto: r.obs, meta: `${r.data} ${r.hi}` };
        if (vk) {
          lista(pegar(vagaObsRg, vk), rg).push(item);
          lista(pegar(vagaObsRole, vk), r.papel).push(item);
        }
        lista(pegar(turnoObs, r.turno), rg).push(item);
        lista(pegar(horObs, r.horario), rg).push(item);
      }
    });

    Object.entries(vagaRg).forEach(([vk, grupos]) => {
      const [ek, n] = vk.split('|');
      const roles = {};
      Object.entries(vagaRole[vk]).forEach(([p, t]) => { roles[p] = Object.assign(resumo(t), { nome: vagaNome[vk][p] }); });
      eqChart[ek].vagas[n] = {
        roleGroup: Object.fromEntries(GRUPOS.map(g => [g, resumo(grupos[g] || zero())])),
        roles,
        obsByRoleGroup: vagaObsRg[vk] || {},
        obsByRole: vagaObsRole[vk] || {}
      };
    });

    const porChave = (acc, obs) => Object.fromEntries(Object.entries(acc).map(([k, v]) =>
      [k, Object.assign({ obs: obs[k] || {} }, Object.fromEntries(GRUPOS.map(g => [g, resumo(v[g] || zero())])))]));

    const charts = {
      clsOrder: CLS_ORDER,
      equip: eqChart,
      turno: porChave(turnoRg, turnoObs),
      horario: porChave(horRg, horObs),
      equipOverall: Object.fromEntries(Object.keys(eqChart).map(ek =>
        [ek, Object.fromEntries(GRUPOS.map(g => [g, resumo((eqRg[ek] || {})[g] || zero())]))])),
      overallRole: Object.fromEntries(GRUPOS.map(g => [g, resumo(roleRg[g] || zero())]))
    };
    const timeline = {
      equipConfig: Object.fromEntries(Object.values(EQUIP).map(e =>
        [e.nome, { label: e.label, roles: e.papeis.map(p => PAPEL_NOME[p]) }])),
      crews,
      overall,
      legend: Object.keys(DESC).map(Number).sort((a, b) => a - b)
        .map(c => ({ cod: c, desc: DESC[c], cls: classe(c) }))
    };
    return { timeline, charts };
  }

  Object.assign(Crono, { minutosDoDia, calcularPainel });
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
