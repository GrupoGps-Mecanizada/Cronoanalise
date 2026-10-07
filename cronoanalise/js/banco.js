// Todas as conversas com o Supabase. Só a chave pública (publishable) é usada.
// Os registros saem daqui no formato da DEMO (desc, execAux, seq).
(function (raiz) {
  const Crono = raiz.Crono;
  const { SUPABASE_URL, SUPABASE_CHAVE } = Crono.config;
  const SEM_INTERNET = 'Sem internet. Confira a conexão e tente de novo.';
  const POR_PAGINA = 1000;
  let cliente = null;

  function db() {
    if (!cliente) cliente = raiz.supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE, { auth: { persistSession: false } });
    return cliente;
  }

  function mensagem(e) {
    const texto = String((e && (e.message || e.details)) || e);
    if (raiz.navigator && raiz.navigator.onLine === false) return SEM_INTERNET;
    if (/fetch|network|load failed/i.test(texto)) return SEM_INTERNET;
    if (e && (e.code === '23514' || e.code === '22P02' || e.code === '22001')) {
      return 'Algum campo está fora do padrão. Confira o turno, os horários (HH:MM) e o código.';
    }
    return 'O banco não respondeu. Tente de novo em instantes.';
  }

  async function chamar(fn) {
    let resposta;
    try { resposta = await fn(); } catch (e) { throw new Error(mensagem(e)); }
    if (resposta.error) throw new Error(mensagem(resposta.error));
    return resposta;
  }

  const vazioParaNull = v => (v === '' || v === undefined ? null : v);

  function paraDemo(l) {
    return {
      seq: l.id, data: l.data, turno: l.turno, horario: l.horario, area: l.area, nome: l.nome,
      papel: l.papel, placa: l.placa, vaga: l.vaga, equip: l.equip, hi: l.hi, hf: l.hf,
      cod: l.cod, desc: l.descricao, cls: l.cls, obs: l.obs, row: null,
      kit: l.kit, folha: l.folha, execAux: l.exec_aux, supervisor: l.supervisor
    };
  }

  // Sem login nesta versão: tudo o que é gravado fica marcado como fictício.
  function paraBanco(r) {
    const cod = vazioParaNull(r.cod);
    return {
      data: vazioParaNull(r.data), turno: vazioParaNull(r.turno), horario: vazioParaNull(r.horario),
      area: vazioParaNull(r.area), nome: vazioParaNull(r.nome), papel: vazioParaNull(r.papel),
      placa: vazioParaNull(r.placa), vaga: vazioParaNull(r.vaga), equip: vazioParaNull(r.equip),
      hi: vazioParaNull(r.hi), hf: vazioParaNull(r.hf), cod: cod == null ? null : Number(cod),
      descricao: vazioParaNull(r.desc), cls: vazioParaNull(r.cls), obs: vazioParaNull(r.obs),
      exec_aux: vazioParaNull(r.execAux), supervisor: vazioParaNull(r.supervisor),
      kit: vazioParaNull(r.kit), folha: vazioParaNull(r.folha), ficticio: true
    };
  }

  function escaparRegistro(r) {
    const saida = {};
    Object.keys(r).forEach(k => { saida[k] = typeof r[k] === 'string' ? Crono.esc(r[k]) : r[k]; });
    return saida;
  }

  async function listarRegistros(filtros = {}) {
    const todos = [];
    for (let inicio = 0; ; inicio += POR_PAGINA) {
      const { data } = await chamar(() => {
        let q = db().from('crono_registros').select('*').order('data').order('id');
        if (filtros.de) q = q.gte('data', filtros.de);
        if (filtros.ate) q = q.lte('data', filtros.ate);
        if (filtros.folha) q = q.eq('folha', filtros.folha);
        return q.range(inicio, inicio + POR_PAGINA - 1);
      });
      todos.push(...data.map(paraDemo));
      if (data.length < POR_PAGINA) return todos;
    }
  }

  async function inserirRegistros(registros) {
    const { data } = await chamar(() => db().from('crono_registros').insert(registros.map(paraBanco)).select());
    return data.map(paraDemo);
  }

  async function atualizarRegistro(seq, registro) {
    await chamar(() => db().from('crono_registros').update(paraBanco(registro)).eq('id', seq));
  }

  async function excluirRegistro(seq) {
    await chamar(() => db().from('crono_registros').delete().eq('id', seq));
  }

  async function buscarFolha(idFolha) {
    const { data } = await chamar(() => db().from('crono_folhas')
      .select('id, modelo, papel, kit_id, crono_kits(*)').eq('id', idFolha).maybeSingle());
    if (!data) return null;
    const { crono_kits: kit, ...folha } = data;
    return { folha, kit };
  }

  async function folhaJaLancada(idFolha) {
    const { count } = await chamar(() => db().from('crono_registros')
      .select('id', { count: 'exact', head: true }).eq('folha', idFolha));
    return count > 0;
  }

  async function buscarKit(codigo) {
    const { data } = await chamar(() => db().from('crono_kits').select('*').eq('codigo', codigo).maybeSingle());
    return data;
  }

  async function gerarKit(dados) {
    const { data } = await chamar(() => db().rpc('crono_gerar_kit', {
      p_tipo: dados.tipo, p_equipamento_id: null, p_placa: dados.placa, p_vaga: dados.vaga,
      p_data: dados.data || null, p_turno: dados.turno, p_horario: dados.horario, p_area: dados.area
    }));
    if (!data || !data.codigo) throw new Error('O banco respondeu sem o código do kit. Tente de novo.');
    return data.codigo;
  }

  Crono.banco = {
    paraDemo, paraBanco, escaparRegistro, listarRegistros, inserirRegistros, atualizarRegistro,
    excluirRegistro, buscarFolha, folhaJaLancada, buscarKit, gerarKit
  };
  if (typeof module !== 'undefined') module.exports = Crono;
})(typeof window !== 'undefined' ? window : globalThis);
