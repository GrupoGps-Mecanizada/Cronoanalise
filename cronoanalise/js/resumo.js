// Resumo da equipe: horas por grupo de atividade, maior perda, comparação entre papéis e alertas.
// Recebe uma equipe (crew) calculada por painel-calculo.js; não acessa a tela.
(function (raiz) {
  const Crono = raiz.Crono;
  const { GRUPOS, grupoDe, EQUIP } = Crono.config;
  const arred = x => Math.round(x * 100) / 100;
  const SIGLA_PAPEL = { 'Motorista': 'MOT', 'Operador 1': 'OP', 'Operador 2': 'OP' };

  function modeloDaFolha(equipNome, papel) {
    const tipo = Object.keys(EQUIP).find(k => EQUIP[k].nome === equipNome);
    return tipo ? tipo.toUpperCase() + '-' + SIGLA_PAPEL[papel] : null;
  }

  function resumoEquipe(crew) {
    const alertas = [];
    let maiorPerda = null;
    const papeis = crew.expectedRoles.filter(p => crew.roles[p]).map(papel => {
      const segs = crew.roles[papel].segments;
      const porGrupo = Object.fromEntries(GRUPOS.map(g => [g.chave, 0]).concat([['outros', 0]]));
      const esperaPorCod = {};
      const validos = Crono.CODIGOS_DA_FOLHA && Crono.CODIGOS_DA_FOLHA[modeloDaFolha(crew.equip, papel)];
      const invalidos = new Set();
      segs.forEach(s => {
        const h = (s.endMin - s.startMin) / 60;
        const g = grupoDe(s.cod);
        porGrupo[g.chave] += h;
        if (g.chave === 'esperas') esperaPorCod[s.cod] = (esperaPorCod[s.cod] || 0) + h;
        if (validos && s.cod != null && !validos.has(Number(s.cod))) invalidos.add(Number(s.cod));
      });
      Object.keys(porGrupo).forEach(k => { porGrupo[k] = arred(porGrupo[k]); });
      const total = arred(Object.values(porGrupo).reduce((a, b) => a + b, 0));
      if (porGrupo.esperas > 0 && (!maiorPerda || porGrupo.esperas > maiorPerda.horas)) {
        const [cod] = Object.entries(esperaPorCod).sort((a, b) => b[1] - a[1])[0];
        maiorPerda = { papel, horas: porGrupo.esperas, cod: Number(cod), desc: Crono.config.DESC[cod] || '' };
      }
      if (invalidos.size) {
        alertas.push(`${papel}: código ${[...invalidos].sort((a, b) => a - b).join(', ')} não é da folha de ${papel === 'Motorista' ? 'motorista' : 'operador'} deste equipamento.`);
      }
      return { papel, nome: crew.roles[papel].nome, porGrupo, total, pctProd: total ? 100 * porGrupo.operacao / total : null };
    });
    return { papeis, maiorPerda, alertas };
  }

  // Junta atividades seguidas do mesmo grupo num bloco só (visão simples da linha do tempo).
  function blocosSimples(segmentos) {
    const blocos = [];
    segmentos.filter(s => s.startMin != null).forEach(s => {
      const grupo = grupoDe(s.cod);
      const ultimo = blocos[blocos.length - 1];
      if (ultimo && ultimo.grupo.chave === grupo.chave && s.startMin <= ultimo.endMin) {
        ultimo.endMin = Math.max(ultimo.endMin, s.endMin);
        ultimo.itens.push(s);
      } else {
        blocos.push({ grupo, startMin: s.startMin, endMin: s.endMin, itens: [s] });
      }
    });
    return blocos;
  }

  function corDoPlacar(pct) {
    if (pct == null) return 'neutro';
    const { verde, amarelo } = Crono.config.PLACAR;
    return pct >= verde ? 'verde' : pct >= amarelo ? 'amarelo' : 'vermelho';
  }

  Crono.blocosSimples = blocosSimples;
  Crono.corDoPlacar = corDoPlacar;
  Crono.resumoEquipe = resumoEquipe;
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
